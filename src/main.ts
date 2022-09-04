import "./style.css";
import { Complex } from "complex.js";
import { getById } from "phil-lib/client-misc";
import {
  initializedArray,
  makeLinear,
  makePromise,
  sleep,
  sum,
  zip,
} from "phil-lib/misc";

// TODO shouldn't this move to phil-lib/client-misc.ts.
/**
 *
 * @param toPermute The items that need to find a location.  Initially all items are here.
 * @param prefix The items that are already in the correct place.  Initially this is empty.  New items will be added to the end of this list.
 * @returns Something you can iterate over to get all permutations of the original array.
 */
function* permutations<T>(
  toPermute: readonly T[],
  prefix: readonly T[] = []
): Generator<readonly T[], void, undefined> {
  if (toPermute.length == 0) {
    yield prefix;
  } else {
    for (let index = 0; index < toPermute.length; index++) {
      const nextItem = toPermute[index];
      const newPrefix = [...prefix, nextItem];
      const stillNeedToPermute = [
        ...toPermute.slice(0, index),
        ...toPermute.slice(index + 1),
      ];
      yield* permutations(stillNeedToPermute, newPrefix);
    }
  }
}
//console.log(Array.from(permutations(["A", "B", "C"])), Array.from(permutations([1 , 2, 3, 4])), Array.from(permutations([])));

/**
 * This will attempt to reorder the `current` array to be as similar as possible to the `past` array.
 *
 * If you are plotting _all_ results of a formula, this is a good way to make sure that the 𝒘 values update smoothly.
 * @param current A list of valid 𝒘 values.
 * @param past The most recently plotted 𝒘 values.
 * Leave this blank if we are starting a new plot.
 * @returns A permutation of `current`.
 */
function reorderToMatchPast(
  current: readonly Complex[],
  past: undefined | readonly Complex[]
): readonly Complex[] {
  if (!(past instanceof Array)) {
    return current;
  }
  if (current.length != past.length) {
    throw new Error("wtf");
  }
  let bestChange = Infinity;
  let bestOrder!: readonly Complex[];
  for (const currentButReordered of permutations(current)) {
    let change = 0;
    for (const [currentValue, pastValue] of zip(currentButReordered, past)) {
      change += currentValue.sub(pastValue).abs();
    }
    if (change < bestChange) {
      bestChange = change;
      bestOrder = currentButReordered;
    }
  }
  return bestOrder;
}

const ONE = new Complex(1);

/**
 * Something to plot.  What makes √𝒛 different from ln(𝒛)?
 */
type Formula = {
  /**
   * This would be good to show in a combo box.
   */
  readonly shortName: string;
  /**
   * Solve for w given a specific value of z.
   * @param z
   * @returns An array containing all possible solutions.
   */
  allWs(z: Complex, previousWs?: readonly Complex[]): readonly Complex[];
  /**
   * Check a solution.
   * @param w
   * @param z
   * @returns A measure of how good the solution is.
   * 0 would mean a perfect solution.
   * Smaller numbers are better.
   * Due to round off error we'd expect a very small value here.
   * A large value would suggest that there is a bug in the code.
   */
  error(w: Complex, z: Complex): number;
  readonly branchPoints: readonly Complex[];
  readonly initialZ: Complex;
  /**
   * If this is true we can draw a ray showing where we would have to cut the plane to attach a different plane.
   * If you move the preview points across the ray, it will cause some output values to swap.
   * Each time you save, the ray moves to try to stay out of the way.
   *
   * This uses a very simple formula.  If that formula doesn't work, set this to false.
   * (Or add some smarter code!)
   */
  readonly showSimpleCut: boolean;
};

const squareRootFormula: Formula = {
  shortName: "Square Root",
  allWs(z: Complex, previousWs?: readonly Complex[]): readonly Complex[] {
    const primary = z.sqrt();
    const newWs = [primary, primary.neg()];
    return reorderToMatchPast(newWs, previousWs);
  },
  error(w: Complex, z: Complex): number {
    return w.pow(2).sub(z).abs();
  },
  branchPoints: [Complex.ZERO],
  initialZ: new Complex(4),
  showSimpleCut: true,
};
const naturalLogFormula: Formula = {
  shortName: "Natural Log",
  allWs(z: Complex, previousWs?: readonly Complex[]): readonly Complex[] {
    function adjustIm(base: Complex, toAdd: number) {
      return base.add(0, toAdd);
    }
    const primary = z.log();
    if (previousWs) {
      return previousWs.map((previousW) => {
        const difference = previousW.im - primary.im;
        const adjustment = Math.round(difference / (Math.PI * 2)) * Math.PI * 2;
        return adjustIm(primary, adjustment);
      });
    } else {
      return [
        adjustIm(primary, Math.PI * 4),
        adjustIm(primary, Math.PI * 2),
        primary,
        adjustIm(primary, -Math.PI * 2),
        adjustIm(primary, -Math.PI * 4),
      ];
    }
  },
  error(w: Complex, z: Complex): number {
    return w.exp().sub(z).abs();
  },
  branchPoints: [Complex.ZERO],
  initialZ: Complex.E,
  showSimpleCut: true,
};
const originalPolynomialFormula: Formula = {
  shortName: "𝒘³-𝒛𝒘-2 = 0",
  initialZ: Complex.ZERO,
  branchPoints: [
    new Complex(3),
    new Complex({ r: 3, phi: (Math.PI * 2) / 3 }),
    new Complex({ r: 3, phi: (Math.PI * 4) / 3 }),
  ],
  allWs(z, previousWs?) {
    // Correction is used to choose the right 3rd root.  Otherwise the result
    // will not be the roots of the equation.  This was determined by seeing
    // what would make this function continuous.
    // The rest of the logic is from Schaums with some algebra for the constant
    // terms.

    //set a [c_sqrt [c_- {1 0} [c_/ [c_cube $z] {27 0}]]]
    const a = ONE.sub(z.pow(3).div(27)).sqrt();

    //  if {[c_abs $z] == 0.0} {
    //set correction {1 0}
    //  } else {
    //set correction [c_/ $z [c_nth_root [c_cube $z] 3]]
    //  }
    const correction = z.isZero() ? ONE : z.div(z.pow(3).pow(1 / 3));

    //  set S [c_nth_root [c_+ {1 0} $a] 3]
    const S = ONE.add(a).pow(1 / 3);

    //  set T [c_nth_root [c_- {1 0} $a] 3]
    //  set T [c_* $T $correction]
    const T = correction.mul(ONE.sub(a).pow(1 / 3));

    //  set root1 [c_+ $S $T]
    const root1 = S.add(T);

    //  set b [c_* {0.0 0.866025403785} [c_- $S $T]]
    const b = S.sub(T).mul(0.0, 0.866025403785);

    //  set c [c_* {-0.5 0.0} [c_+ $S $T]]
    const c = S.add(T).mul(-0.5);

    //  set root2 [c_+ $c $b]
    const root2 = c.add(b);

    //  set root3 [c_- $c $b]
    const root3 = c.sub(b);

    //  list $root1 $root2 $root3
    return reorderToMatchPast([root1, root2, root3], previousWs);
    //return [root1, root2, root3];
    //return [root1];
  },
  error(w, z) {
    return w.pow(3).sub(z.mul(w)).sub(2).abs();
  },
  showSimpleCut: false,
};

/**
 * These are the formulas in the drop down.
 * These _must_ appear in the same order in both places.
 */
const formulas: Formula[] = [
  squareRootFormula,
  naturalLogFormula,
  originalPolynomialFormula,
];

/**
 * The drop down where the user can pick a `Formula`.
 */
const formulaSelect = getById("formula", HTMLSelectElement);
formulas.forEach((formula) => {
  const option = document.createElement("option");
  option.innerText = formula.shortName;
  formulaSelect.appendChild(option);
});

/**
 * The marker for the __start__ of each path goes on the bottom.
 * I.e. the part of the path that is fixed.
 * Other things can cover it.
 */
const bottomGroup = getById("bottom", SVGGElement);

/**
 * Draw the lines here.
 */
const mainGroup = getById("main", SVGGElement);

/**
 * The marker for the end of each path should go on top.
 * Ie. the part of the path that keeps moving.
 * This will be drawn on top of everything else.
 */
const topGroup = getById("top", SVGGElement);

/**
 * The current values of each input and output, printed as numbers.
 */
const positionInfoDiv = getById("positionInfo", HTMLDivElement);

const errorInfoDiv = getById("errorInfo", HTMLDivElement);

// Focus on en-US because I'm doing some very specific things with the
// output, not just printing it as is.  I don't want to test this in
// multiple locales!
const formatter = new Intl.NumberFormat("en-US", {
  minimumSignificantDigits: 4,
  maximumSignificantDigits: 4,
});

/**
 * Format the number so it's easy to read.
 * @param complex The number to display.
 * @returns The same number as a user readable string.
 */
function formatComplex(complex: Complex) {
  const real = complex.re;
  const imaginary = complex.im;
  let result = "";
  if ((real | 0) == real) {
    // This is an integer.  The default formatter will
    // display nothing after the decimal point.
    // Google "trailingZeroDisplay stripIfInteger" for more info.
    result += real;
  } else {
    // Always show 4 digits.  I tried removing all optional 0s,
    // but that made my display jump around a lot.
    result += formatter.format(real);
  }
  if (imaginary != 0) {
    if (imaginary > 0) {
      result += "+";
    }
    if ((imaginary | 0) == imaginary) {
      result += imaginary;
    } else {
      result += formatter.format(imaginary);
    }
    result += "𝓲";
  }
  return result;
}

/**
 * While a demo is running, most of the GUI should be deactivated.
 * It would be confusing if the user and the demo were moving inputs at the same time,
 * or if two demos were trying to run at the same time.
 */
class DisableUserInterface {
  static readonly #shouldDisable = Array.from(
    document.querySelectorAll("button:not([data-no-disable]), select")
  ) as (HTMLButtonElement | HTMLSelectElement)[];
  /**
   * Only enable the things that we previously disabled.
   *
   * Undefined means that we are already in the enabled state.
   */
  static #shouldEnable: { disabled: boolean }[] | undefined;
  static now() {
    if (this.#shouldEnable) {
      throw new Error("Already disabled.");
    }
    const shouldEnable: { disabled: boolean }[] = [];
    this.#shouldDisable.forEach((element) => {
      if (!element.disabled) {
        element.disabled = true;
        shouldEnable.push(element);
      }
    });
    this.#shouldEnable = shouldEnable;
    updateCutCheckBoxEnabled();
  }
  static restore() {
    if (!this.#shouldEnable) {
      throw new Error("Already disabled.");
    }
    this.#shouldEnable.forEach((element) => (element.disabled = false));
    this.#shouldEnable = undefined;
    updateCutCheckBoxEnabled();
  }
  static isEnabled() {
    return this.#shouldEnable == undefined;
  }
  static isDisabled() {
    return this.#shouldEnable != undefined;
  }
}

/**
 * This describes the path of the 𝒛 or one of the 𝒘's.
 *
 * This contains pointers to the relevant GUI items and to the relevant numerical values.
 */
class PathInfo {
  /**
   * The marker that the user can adjust.
   */
  readonly #end: SVGCircleElement;
  /**
   * The line segment currently connected to the end.
   */
  #lastSegment?: SVGLineElement;
  /**
   * The line segment currently connected to the end.
   * This has not been saved, yet, so one end can move.
   *
   * When you reset the screen, or you hit save, the program immediately creates this segment.
   * Initially the segment will start and end at the same point, so you might not see it immediately.
   * The next time you move the mouse, this segment will grow.
   */
  get lastSegment() {
    return this.#lastSegment;
  }
  /**
   * This is the end of the path that can move.
   */
  #currentValue: Complex;
  /**
   * This is the end of the path that can move.
   */
  get currentValue() {
    return this.#currentValue;
  }
  set currentValue(newValue: Complex) {
    const x = newValue.re;
    const y = -newValue.im;
    const line = this.#lastSegment!;
    line.x2.baseVal.value = x;
    line.y2.baseVal.value = y;
    const circle = this.#end;
    circle.cx.baseVal.value = x;
    circle.cy.baseVal.value = y;
    this.#currentValue = newValue;
    this.displayValue();
  }
  /**
   * Roll back to this
   */
  #undo: Complex;
  /**
   * Roll the currentValue back to the last saved value.
   */
  undo() {
    this.currentValue = this.#undo;
  }
  /**
   * We'd go back to this if someone called undo().
   * The next time someone saves we will draw a strength line between this point and the point being saved.
   */
  get lastSaved() {
    return this.#undo;
  }
  readonly #valueDiv: HTMLDivElement;
  private displayValue() {
    this.#valueDiv.innerText = formatComplex(this.#currentValue);
  }
  constructor(public readonly color: string, initialValue: Complex) {
    this.#currentValue = initialValue;
    this.#undo = initialValue;
    const valueDiv = document.createElement("div");
    valueDiv.style.color = color;
    positionInfoDiv.appendChild(valueDiv);
    this.#valueDiv = valueDiv;
    this.displayValue();
    const x = initialValue.re;
    const y = -initialValue.im;
    // <circle cx="2" cy="0" r="0.2" style="--base-color: red"></circle>
    const circle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    circle.cx.baseVal.value = x;
    circle.cy.baseVal.value = y;
    circle.r.baseVal.value = 0.2;
    circle.style.setProperty("--base-color", color);
    topGroup.appendChild(circle);
    this.#end = circle;
    // <rect x="3.75" y="-0.25" width="0.5" height="0.5" style="--base-color: black"></rect>
    const square = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    );
    const size = 0.5;
    square.x.baseVal.value = x - size / 2;
    square.y.baseVal.value = y - size / 2;
    square.width.baseVal.value = size;
    square.height.baseVal.value = size;
    square.style.setProperty("--base-color", color);
    bottomGroup.appendChild(square);
    this.newLine();
  }
  private newLine() {
    const currentValue = this.#currentValue;
    const x = currentValue.re;
    const y = -currentValue.im;
    // <line x1="4" y1="0" x2="3" y2="-1.5" stroke="black"></line>
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.x1.baseVal.value = x;
    line.y1.baseVal.value = y;
    line.x2.baseVal.value = x;
    line.y2.baseVal.value = y;
    line.setAttribute("stroke", this.color);
    line.classList.add("active");
    this.#lastSegment?.classList?.remove("active");
    mainGroup.appendChild(line);
    this.#lastSegment = line;
    this.#undo = currentValue;
  }
  save() {
    if (this.#currentValue.equals(this.#undo)) {
      return;
    }
    if (this.#lastSegment) {
      this.#lastSegment.classList.add("can-be-styled");
    }
    this.newLine();
  }
}

/**
 * The formula we are currently plotting.
 */
let formula!: Formula;

/**
 * The GUI for the input.
 */
let zPath!: PathInfo;

/**
 * The GUI for the outputs.
 */
let wPaths!: PathInfo[];

/**
 * This is the dashed line that shows the branch cut.
 * This is undefined if we don't know how to draw the line or no such line is appropriate.
 * This can also be temporarily hidden with the check box, but in that case the `SVGLineElement` will still be stored in this variable.
 */
let cutRay: SVGLineElement | undefined;
const showCutCheckBox = getById("showCut", HTMLInputElement);

/**
 * This can be disabled for multiple reasons.  And the the reasons
 * can change at different times.
 */
function updateCutCheckBoxEnabled() {
  showCutCheckBox.disabled =
    DisableUserInterface.isDisabled() || !formula.showSimpleCut;
}

/**
 * The user or the demo program can hide this line via the check box.
 */
function updateCutVisibility() {
  if (cutRay) {
    cutRay.style.display = showCutCheckBox.checked ? "" : "none";
  }
}

showCutCheckBox.addEventListener("click", () => {
  updateCutVisibility();
});

/**
 * This updates the segment showing where you don't want to move your input.
 * If you cross this line in preview mode, the outputs will jump.
 *
 * This is just a display.  The formula does what it does without calling this.
 */
function updateCutPosition() {
  if (cutRay) {
    /**
     * We want the line segment to go off the SVG element.
     * The longest line segment would be a diagonal from one corner to an opposite corner.
     */
    const length = 15 * Math.SQRT2;
    /**
     * This simple algorithm assumes we have exactly one branch point.
     */
    const start = formula.branchPoints[0];
    /**
     * The direction from the current z the branch point is the same as
     * the direction from the branch point off to infinity.
     * I.e. we're pointing the segment as far from z as possible.
     */
    const direction = start.sub(zPath.lastSaved).arg();
    // TODO what if start = zPath.lastSaved?
    const end = new Complex({ r: length, phi: direction });
    cutRay.x2.baseVal.value = end.re;
    cutRay.y2.baseVal.value = -end.im;
  }
}

/**
 * Select a formula and clear the screen.
 * This function will reset everything even if the "new" formula is the same as the existing one.
 *
 * This will try to make the formula drop down match the `formula` variable.
 * @param newFormula Switch to this formula.  If this is missing, use what the user selected from the GUI.
 */
function init(newFormula?: Formula) {
  bottomGroup.innerHTML = "";
  mainGroup.innerHTML = "";
  topGroup.innerHTML = "";
  cutRay = undefined;
  positionInfoDiv.innerHTML = "";
  // Try to make the formula drop down match the formula variable.
  if (newFormula) {
    formula = newFormula;
    // If newFormula is in the drop down, select it.
    // Otherwise go to index -1 which will display the empty string.
    // TODO Look at https://stackoverflow.com/a/29806043/971955 to display something like "custom",
    // which the user cannot select, but the programmer can.
    formulaSelect.selectedIndex = formulas.indexOf(newFormula);
  } else {
    // Grab whatever the user selected.
    // TODO throw an exception if there's nothing there?
    formula = formulas[formulaSelect.selectedIndex];
  }
  const z = formula.initialZ;
  zPath = new PathInfo("black", z);
  const wValues = formula.allWs(z);
  wPaths = wValues.map((w, index) => {
    const color = `hsl(${index / wValues.length}turn, 100%, 50%)`;
    return new PathInfo(color, w);
  });
  if (formula.showSimpleCut) {
    cutRay = document.createElementNS("http://www.w3.org/2000/svg", "line");
    cutRay.classList.add("cut-ray");
    const start = formula.branchPoints[0];
    cutRay.x1.baseVal.value = start.re;
    cutRay.y1.baseVal.value = -start.im;
    updateCutPosition();
    updateCutVisibility();
    topGroup.appendChild(cutRay);
  }
  updateCutCheckBoxEnabled();
  checkForError();
  for (const branchPoint of formula.branchPoints) {
    //        <circle class="branch-point" cx="0" cy="0" r="0.1"></circle>
    const circle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    circle.classList.add("branch-point");
    circle.cx.baseVal.value = branchPoint.re;
    circle.cy.baseVal.value = -branchPoint.im;
    circle.r.baseVal.value = 0.1;
    topGroup.appendChild(circle);
  }
}

init();

formulaSelect.addEventListener("change", () => {
  init();
});

getById("reset", HTMLButtonElement).addEventListener("click", () =>
  init(formula)
);

/**
 * This exists mostly for the programmer to check his work, but we display it for everyone.
 *
 * There is no specific scale for the output.
 * But the numbers should be very small, consistent with round off error.
 * `Math.sin(Math.PI)` gives me 1.2246467991473532e-16, which shows the right order of magnitude for an acceptable error.
 */
function checkForError() {
  const z = zPath.currentValue;
  const totalError = sum(
    wPaths.map((wPath) => formula.error(wPath.currentValue, z))
  );
  errorInfoDiv.innerText = `Total error = ${totalError}`;
}

/**
 * Extend the z path to the given point.
 * Solve each of the w's and move their paths to the corresponding points.
 * @param z Move z to here.
 */
function updateZ(z: Complex) {
  zPath.currentValue = z;
  for (const [w, path] of zip(
    formula.allWs(
      z,
      wPaths.map((path) => path.lastSaved)
    ),
    wPaths
  )) {
    path.currentValue = w;
  }
  checkForError();
}

const svg = document.querySelector("svg")!;

// https://stackoverflow.com/a/10298843/971955
// Create an SVGPoint for future math
const pt = svg.createSVGPoint();
// Get point in global SVG space
/**
 *
 * @param evt We copy the location information from this event.
 * @returns The position if the event in svg coordinates.
 */
function cursorToComplex(evt: MouseEvent) {
  pt.x = evt.clientX;
  pt.y = evt.clientY;
  const scaled = pt.matrixTransform(svg.getScreenCTM()!.inverse());
  return new Complex(scaled.x, -scaled.y);
}

/**
 * Mark the current input and output so they stay on the screen.
 */
function saveAll() {
  zPath.save();
  updateCutPosition();
  wPaths.forEach((path) => path.save());
}

svg.addEventListener("mouseleave", () => {
  if (DisableUserInterface.isDisabled()) {
    return;
  }
  // When the mouse is inside of the SVG, we will display a dotted line leading to the point under the mouse.
  // This is a preview of what you would get if you clicked to save the current point to the path.
  // When the mouse leaves the SVG, the following code will hide that preview.
  zPath.undo();
  wPaths.forEach((path) => path.undo());
});
svg.addEventListener("mousemove", (event) => {
  if (DisableUserInterface.isDisabled()) {
    return;
  }
  // If the mouse button is up, Update the preview.
  updateZ(cursorToComplex(event));
  if (event.buttons & 1) {
    // If the mouse button is down, save the new point immediately.
    saveAll();
  }
});
svg.addEventListener("mouseup", (_event) => {
  if (DisableUserInterface.isDisabled()) {
    return;
  }
  // When the user clicks and releases the mouse button, save the current position.
  saveAll();
});

/**
 * Change the current formula and update the GUI.
 *
 * This will always erase the old paths, even if you select the same formula that is currently active.
 * @param toSelect Which formula do we want to use?
 *
 * A number will look up the formula from the drop down.  0 for the first entry.
 *
 * A string will find an entry in the drop down with `toSelect` as the `shortName`, the value we display for the user.
 *
 * You can add any formula.  It does not have to be listed in the drop down.
 * This function will update the drop down to match the formula.
 * @throws If you pick an invalid number or string, this will throw an exception.
 */
function selectFormula(toSelect: number | Formula | string) {
  switch (typeof toSelect) {
    case "number": {
      const newFormula = formulas[toSelect];
      if (!newFormula) {
        throw new Error(`No such formula: ${toSelect}`);
      }
      init(newFormula);
      break;
    }
    case "object": {
      init(toSelect);
      break;
    }
    case "string": {
      const newFormula = formulas.find(
        (possible) => possible.shortName == toSelect
      );
      if (!newFormula) {
        throw new Error(`No such formula: "${toSelect}"`);
      }
      init(newFormula);
      break;
    }
  }
}

/**
 *
 * @param radians How far to rotate.  0 means not at all.  Math.PI/2 means 90° counterclockwise.
 * @returns If you multiply the return value by a complex number, that number will rotate by the specified amount.
 */
function rotate(radians: number) {
  return new Complex({ r: 1, phi: radians });
}

/**
 *
 * @param turns How far to rotate.  0 means not at all.  0.25 means 90° counterclockwise.
 * @returns If you multiply the return value by a complex number, that number will rotate by the specified amount.
 */
function rotateTurns(turns: number) {
  return rotate(turns * (Math.PI * 2));
}

function rotateDegrees(degrees: number) {
  return rotate(degrees * (Math.PI / 180));
}

/**
 * Currently this is just for testing and development.
 * You can only select this from the console.
 */
const sixthRootFormula: Formula = {
  shortName: "Sixth Root",
  allWs(z: Complex, previousWs?: readonly Complex[]): readonly Complex[] {
    const power = 6;
    const primary = z.pow(1 / power);
    const newWs = initializedArray(power, (i) =>
      primary.mul(rotateTurns(i / power))
    );
    return reorderToMatchPast(newWs, previousWs);
  },
  error(w: Complex, z: Complex): number {
    return w.pow(6).sub(z).abs();
  },
  branchPoints: [Complex.ZERO],
  initialZ: new Complex(6),
  showSimpleCut: true,
};

/**
 * A number between 0 and 1.
 * 0 means just started.
 * 1 means done.
 */
type Progress = number;

type Action = { updateNow(progress: Progress): void };

/**
 * This will draw a circle.
 *
 * This will affect the preview and the saved points.
 * This will animate the preview smoothly, if `updateNow()` is called frequently enough.
 * This will always put the saved points in exactly the request places, even if the calls come at an uneven pace.
 */
class MakeCircle implements Action {
  /**
   * this.center + this.#initialOffset = the first and last point of the circle.
   */
  #initialOffset: Complex;
  /**
   * How many times have we saved a point so far?
   *
   * We don't want to skip any points, even if the animation timer temporarily stops firing.
   */
  #stepsSaved = 0;

  readonly #direction: -1 | 1;

  readonly #stepsRequested: number;

  /**
   *
   * @param center The center of the circle.
   * @param start The point where the circle starts and stops.
   * This point should already be saved before the the circle starts.
   * @param steps The number of times to save the current point to the path.
   * These steps will be evenly spread around the circle.
   * This will include the final point, but not the starting point.
   *
   * A positive number will rotate counterclockwise, i.e. the mathematically positive direction.
   * A negative number will rotate clockwise.
   */
  constructor(private readonly center: Complex, start: Complex, steps: number) {
    this.#initialOffset = start.sub(center);
    this.#direction = steps > 0 ? 1 : -1;
    this.#stepsRequested = steps / this.#direction;
  }

  /**
   * @param progress How far along the animation should be.
   * @returns The current position of the input.
   */
  private getPosition(progress: Progress) {
    if (progress == 1) {
      // Avoid round-off error.  The graph will look the same either way.
      // But I print the number differently if it is an exact integer.
      progress = 0;
    }
    return this.#initialOffset
      .mul(rotateTurns(progress * this.#direction))
      .add(this.center);
  }

  /**
   * Update the screen.
   * @param progress How far along we should be.
   * This animation only makes sense of the progress never goes backwards.
   */
  public updateNow(progress: Progress) {
    const shouldBeSaved = (this.#stepsRequested * progress) | 0;
    while (this.#stepsSaved < shouldBeSaved) {
      this.#stepsSaved++;
      updateZ(this.getPosition(this.#stepsSaved / this.#stepsRequested));
      saveAll();
    }
    updateZ(this.getPosition(progress));
  }
}

/**
 * This will perform a series of calls to update the screen, all managed by the animation timer.
 *
 * The individual animations are defined by another object.
 * This function takes care of talking to the animation timer and other boilerplate items used by all animations.
 * @param ms How long, in milliseconds, the animation should take.
 * @param action The object that will do the actual work of updating the screen.
 * @returns A promise that will resolve when the animation is complete.
 * @throws If the `action` throws something, the promise will reject with the same reason.
 */
function runTimer(ms: number, action: Action) {
  const promise = makePromise();
  const startTime = performance.now();
  const endTime = startTime + ms;
  const timeToProgress = makeLinear(startTime, 0, endTime, 1);
  let lastReportedTime = startTime;
  function animationCallback(time: number) {
    try {
      if (time >= endTime) {
        action.updateNow(1);
        promise.resolve();
      } else {
        if (time > lastReportedTime) {
          action.updateNow(timeToProgress(time));
        }
        requestAnimationFrame(animationCallback);
      }
    } catch (reason) {
      promise.reject(reason);
    }
  }
  requestAnimationFrame(animationCallback);
  return promise.promise;
}

class MakeSegment implements Action {
  /**
   * How many times have we saved a point so far?
   *
   * We don't want to skip any points, even if the animation timer temporarily stops firing.
   */
  #stepsSaved = 0;

  readonly #totalDistance: Complex;

  constructor(
    from: Complex,
    private readonly to: Complex,
    private readonly steps: number
  ) {
    this.#totalDistance = to.sub(from);
  }

  /**
   * @param progress How far along the animation should be.
   * @returns The current position of the input.
   */
  private getPosition(progress: Progress) {
    return this.to.sub(this.#totalDistance.mul(1 - progress));
  }

  updateNow(progress: number): void {
    if (this.steps) {
      // TODO this was copied directly from MakeCircle.updateNow().
      // Should these classes share a base class?
      const shouldBeSaved = (this.steps * progress) | 0;
      while (this.#stepsSaved < shouldBeSaved) {
        this.#stepsSaved++;
        updateZ(this.getPosition(this.#stepsSaved / this.steps));
        saveAll();
      }
    }
    // else steps = 0, so we don't save anything.
    // I made this a special case to avoid ÷0.
    updateZ(this.getPosition(progress));
  }

  static makeDiamond(stepsPerSide: number, start = zPath.lastSaved) {
    const result: MakeSegment[] = [];
    for (let i = 0; i < 4; i++) {
      const end = rotate90(start);
      result.push(new this(start, end, stepsPerSide));
      start = end;
    }
    return result;
  }
}

/**
 * Rotate a point around the origin by 90° counterclockwise.
 * @param from The initial point.
 * @returns from * 𝓲.  I'm doing it this way to avoid round off error.
 */
function rotate90(from: Complex) {
  return new Complex({ re: -from.im, im: from.re });
}

function styleCurrentLines(newStyle: "thin" | "fat") {
  Array.from(svg.querySelectorAll(".can-be-styled")).forEach((line) => {
    const classList = line.classList;
    classList.remove("can-be-styled");
    classList.add(newStyle);
  });
}

(["thin", "fat"] as const).forEach((style) => {
  getById(style, HTMLButtonElement).addEventListener("click", () => {
    styleCurrentLines(style);
  });
});

getById("showMeCirclesAndRoots", HTMLButtonElement).addEventListener(
  "click",
  async () => {
    DisableUserInterface.now();
    showCutCheckBox.checked = false;
    selectFormula(squareRootFormula);
    await runTimer(5000, new MakeCircle(Complex.ZERO, zPath.lastSaved, 20));
    styleCurrentLines("fat");
    await sleep(500);
    await runTimer(5000, new MakeCircle(Complex.ZERO, zPath.lastSaved, 20));
    DisableUserInterface.restore();
  }
);

getById("showMeBranchCuts1", HTMLButtonElement).addEventListener(
  "click",
  async () => {
    DisableUserInterface.now();
    showCutCheckBox.checked = true;
    selectFormula(squareRootFormula);
    let source = zPath.currentValue;
    const script: [number, Complex][] = [
      [500, new Complex(1, 1)],
      [750, new Complex(1, -1)],
      [750, new Complex(1, 1)],
      [750, new Complex(1, -1)],
      [750, new Complex(1, 1)],
      [500, new Complex(-2, 2)],
      [750, new Complex(-2, -2)],
      [750, new Complex(-2, 2)],
      [750, new Complex(-2, -2)],
      [750, new Complex(-2, 2)],
      [500, new Complex(1, 1)],
      [500, new Complex(1, -1)],
      [500, new Complex(-2, -2)],
      [750, new Complex(-2, 2)],
      [750, new Complex(-2, -2)],
      [750, new Complex(-2, 2)],
      [750, new Complex(-2, -2)],
    ];
    for (const [ms, destination] of script) {
      await runTimer(ms, new MakeSegment(source, destination, 0));
      source = destination;
    }
    DisableUserInterface.restore();
  }
);

getById("showMeBranchCuts2", HTMLButtonElement).addEventListener(
  "click",
  async () => {
    DisableUserInterface.now();
    showCutCheckBox.checked = true;
    selectFormula(squareRootFormula);
    let source = new Complex(-2, -2);
    updateZ(source);
    saveAll();
    const script: [number, Complex][] = [
      [750, new Complex(-2, 2)],
      [750, new Complex(-2, -2)],
      [750, new Complex(-2, 2)],
      [750, new Complex(-2, -2)],
    ];
    for (const [ms, destination] of script) {
      await runTimer(ms, new MakeSegment(source, destination, 5));
      source = destination;
    }
    styleCurrentLines("thin");
    await runTimer(5000, new MakeCircle(Complex.ZERO, source, 7));
    styleCurrentLines("fat");
    await runTimer(5000, new MakeCircle(Complex.ZERO, source, 35));
    DisableUserInterface.restore();
  }
);

getById("showMeSquare1", HTMLButtonElement).addEventListener(
  "click",
  async () => {
    DisableUserInterface.now();
    showCutCheckBox.checked = false;
    selectFormula(squareRootFormula);
    for (const segment of MakeSegment.makeDiamond(1)) {
      await runTimer(1500, segment);
    }
    DisableUserInterface.restore();
  }
);

getById("showMeSquare2", HTMLButtonElement).addEventListener(
  "click",
  async () => {
    DisableUserInterface.now();
    showCutCheckBox.checked = false;
    selectFormula(squareRootFormula);
    for (const segment of MakeSegment.makeDiamond(1)) {
      segment.updateNow(1);
    }
    styleCurrentLines("thin");
    for (const segment of MakeSegment.makeDiamond(2)) {
      await runTimer(1500, segment);
    }
    DisableUserInterface.restore();
  }
);

getById("showMeSquare3", HTMLButtonElement).addEventListener(
  "click",
  async () => {
    DisableUserInterface.now();
    showCutCheckBox.checked = false;
    selectFormula(squareRootFormula);
    for (const segment of MakeSegment.makeDiamond(1)) {
      segment.updateNow(1);
    }
    styleCurrentLines("thin");
    for (const segment of MakeSegment.makeDiamond(2)) {
      segment.updateNow(1);
    }
    styleCurrentLines("fat");
    for (const segment of MakeSegment.makeDiamond(30)) {
      await runTimer(1500, segment);
    }
    DisableUserInterface.restore();
  }
);

getById("showMeEquilateralTriangle", HTMLButtonElement).addEventListener(
  "click",
  async () => {
    const first = new Complex(6.5);
    const second = first.mul(rotateTurns(1 / 3));
    const third = first.mul(rotateTurns(2 / 3));
    DisableUserInterface.now();
    showCutCheckBox.checked = false;
    selectFormula(squareRootFormula);
    await runTimer(250, new MakeSegment(zPath.currentValue, first, 1));
    await runTimer(2000, new MakeSegment(first, second, 50));
    await runTimer(2000, new MakeSegment(second, third, 50));
    await runTimer(2000, new MakeSegment(third, first, 50));
    DisableUserInterface.restore();
  }
);

getById("showMeRightTriangle", HTMLButtonElement).addEventListener(
  "click",
  async () => {
    /**
     * The segment opposite the 30° angle.
     */
    const shortLength = 6;
    /**
     * The segment opposite the 60° angle.
     */
    const longLength = shortLength * Math.sqrt(3);
    /**
     * The segment opposite the 90° angle.
     */
    const hypotenuseLength = 2 * shortLength;
    DisableUserInterface.now();
    showCutCheckBox.checked = false;
    selectFormula(squareRootFormula);
    const vertex90 = zPath.lastSaved;
    const vertex30 = vertex90.add(rotateDegrees(90 + 45 + 20).mul(longLength));
    const vertex60 = vertex90.add(
      rotateDegrees(180 + 45 + 20).mul(shortLength)
    );
    const totalTime = 6000;
    const parameter = sum([shortLength, longLength, hypotenuseLength]);
    await runTimer(
      (totalTime * longLength) / parameter,
      new MakeSegment(vertex90, vertex30, 50)
    );
    await runTimer(
      (totalTime * hypotenuseLength) / parameter,
      new MakeSegment(vertex30, vertex60, 50)
    );
    await runTimer(
      (totalTime * shortLength) / parameter,
      new MakeSegment(vertex60, vertex90, 50)
    );
    DisableUserInterface.restore();
  }
);

getById("showMeLog1", HTMLButtonElement).addEventListener("click", async () => {
  DisableUserInterface.now();
  showCutCheckBox.checked = false;
  selectFormula(naturalLogFormula);
  await runTimer(250, new MakeSegment(zPath.lastSaved, new Complex(2), 1));
  await runTimer(2000, new MakeCircle(Complex.ZERO, zPath.lastSaved, 50));
  await runTimer(250, new MakeSegment(zPath.lastSaved, new Complex(4), 1));
  await runTimer(4000, new MakeCircle(Complex.ZERO, zPath.lastSaved, 100));
  await runTimer(250, new MakeSegment(zPath.lastSaved, new Complex(6), 1));
  await runTimer(6000, new MakeCircle(Complex.ZERO, zPath.lastSaved, -150));
  DisableUserInterface.restore();
});

getById("showMeLog2", HTMLButtonElement).addEventListener("click", async () => {
  DisableUserInterface.now();
  showCutCheckBox.checked = false;
  selectFormula(naturalLogFormula);
  /**
   * As progress goes from 0 to 1,
   * the outputs should go from 1 to -8.
   */
  const desiredOutput = makeLinear(0, 1, 1, -8);
  const action: Action = {
    updateNow(progress: Progress) {
      const z = Math.exp(desiredOutput(progress));
      updateZ(new Complex(z));
    },
  };
  await runTimer(5000, action);
  DisableUserInterface.restore();
});

getById("showMeMultiple1", HTMLButtonElement).addEventListener(
  "click",
  async () => {
    DisableUserInterface.now();
    showCutCheckBox.checked = false;
    selectFormula(originalPolynomialFormula);
    const redCenter = new Complex(2, 0);
    const greenCenter = redCenter.mul(rotateTurns(1 / 3));
    const blueCenter = redCenter.mul(rotateTurns(2 / 3));
    await sleep(500);
    await runTimer(5000, new MakeCircle(redCenter, Complex.ZERO, 50));
    await sleep(500);
    await runTimer(5000, new MakeCircle(greenCenter, Complex.ZERO, 50));
    await sleep(500);
    await runTimer(5000, new MakeCircle(blueCenter, Complex.ZERO, 50));
    //styleCurrentLines("fat");
    await sleep(500);
    const ratio = 1.2;
    await runTimer(
      5000,
      new MakeCircle(blueCenter.mul(ratio), Complex.ZERO, 50)
    );
    await sleep(500);
    await runTimer(
      5000,
      new MakeCircle(greenCenter.mul(ratio), Complex.ZERO, 50)
    );
    await sleep(500);
    await runTimer(
      5000,
      new MakeCircle(redCenter.mul(ratio), Complex.ZERO, 50)
    );
    DisableUserInterface.restore();
  }
);

getById("showMeMultiple2", HTMLButtonElement).addEventListener(
  "click",
  async () => {
    DisableUserInterface.now();
    showCutCheckBox.checked = false;
    selectFormula(originalPolynomialFormula);
    await sleep(500);
    const points = [
      new Complex(0, 0),
      new Complex(0, 4),
      new Complex(-3, 4),
      new Complex(-3, -4),
      new Complex(0, -4),
    ];
    const segments = points.map((from, index) => {
      const to = points[(index + 1) % points.length];
      const length = to.sub(from).abs();
      return { from, to, length };
    });
    const parameter = sum(segments.map((segment) => segment.length));
    const totalMs = 10000;
    const stepsPerUnit = 5;
    for (const { to, from, length } of segments) {
      const steps = Math.round(length * stepsPerUnit);
      await runTimer(
        (totalMs * length) / parameter,
        new MakeSegment(from, to, steps)
      );
    }
    DisableUserInterface.restore();
  }
);

getById("showMeMultiple3", HTMLButtonElement).addEventListener(
  "click",
  async () => {
    DisableUserInterface.now();
    showCutCheckBox.checked = false;
    selectFormula(originalPolynomialFormula);
    const center = new Complex(1.5);
    const offset = 0.08;
    await sleep(500);
    await runTimer(5000, new MakeCircle(center.add(offset), Complex.ZERO, 50));
    await sleep(500);
    await runTimer(5000, new MakeCircle(center.sub(offset), Complex.ZERO, 50));
    await sleep(500);
    await runTimer(
      5000,
      new MakeCircle(
        center.sub(offset / 2).mul(rotateTurns(1 / 3)),
        Complex.ZERO,
        50
      )
    );
    DisableUserInterface.restore();
  }
);

function download(filename: string, text: string) {
  // Source:  https://stackoverflow.com/a/18197511/971955
  // TODO move this to to phil-lib
  var pom = document.createElement("a");
  pom.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(text)
  );
  pom.setAttribute("download", filename);

  if (document.createEvent) {
    var event = document.createEvent("MouseEvents");
    event.initEvent("click", true, true);
    pom.dispatchEvent(event);
  } else {
    pom.click();
  }
}

const saveChartButton = getById("saveChart", HTMLButtonElement);

saveChartButton.addEventListener("click", () => {
  const text = svg.outerHTML;
  download("chart.svg", text);
});

addEventListener("keydown", (event) => {
  if (event.code == "KeyS") {
    saveChartButton.click();
  }
});

/**
 * This is a collection of things that I'm exporting for debug purposes.
 * This is subject to constant change.
 */
(window as any).phil = {
  // Export the updateZ() function to the JavaScript console for debug purposes.
  // The inputs are 2 real numbers because the Complex class has not be exported to the console.
  updateZ(re: number, im: number) {
    updateZ(new Complex(re, im));
  },
  selectFormula,
  sixthRootFormula,
  DisableUserInterface,
};

// TODO The numbers still jump around too much.
// Maybe instead of writing "4" I should write "4&nbsp;&nbsp;&nbsp;&nbsp;",
// to line up with "3.999"

// TODO get rid of most of the transparency.
// It makes sense for the circles that mark the moving end of the path.
// In other places that was just the easiest way for me to make the color lighter, and more distinct from the original.
// It works okay, now, for the most part.
// But if there are a lot of partially transparent segments, the GUI slows down A LOT.
