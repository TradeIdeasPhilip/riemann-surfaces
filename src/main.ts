import "./style.css";
import { Complex } from "complex.js";
import { getById } from "phil-lib/client-misc";
import { count, initializedArray, sleep, sum, zip } from "phil-lib/misc";

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
  /**
   * In calculus terminology these are "Branch points".
   */
  readonly branchPoints: readonly Complex[];
  readonly initialZ: Complex;
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
  wPaths.forEach((path) => path.save());
}

svg.addEventListener("mouseleave", () => {
  // When the mouse is inside of the SVG, we will display a dotted line leading to the point under the mouse.
  // This is a preview of what you would get if you clicked to save the current point to the path.
  // When the mouse leaves the SVG, the following code will hide that preview.
  zPath.undo();
  wPaths.forEach((path) => path.undo());
});
svg.addEventListener("mousemove", (event) => {
  // If the mouse button is up, Update the preview.
  updateZ(cursorToComplex(event));
  if (event.buttons & 1) {
    // If the mouse button is down, save the new point immediately.
    saveAll();
  }
});
svg.addEventListener("mouseup", (_event) => {
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
 * Currently this is just for testing and development.
 * You can only select this from the console.
 */
const sixthRootFormula: Formula = {
  shortName: "Sixth Root",
  allWs(z: Complex, previousWs?: readonly Complex[]): readonly Complex[] {
    const power = 6;
    const primary = z.pow(1 / power);
    const newWs = initializedArray(power, (i) =>
      primary.mul({ r: 1, phi: ((Math.PI * 2) / power) * i })
    );
    return reorderToMatchPast(newWs, previousWs);
  },
  error(w: Complex, z: Complex): number {
    return w.pow(6).sub(z).abs();
  },
  branchPoints: [Complex.ZERO],
  initialZ: new Complex(6),
};

/**
 * Create a list of points that approximate a circle.
 * @param center The center of the circle.
 * @param start Where to start drawing.  Typically the currently selected point.
 * @param steps The number of points to draw.
 * A negative number means to move clockwise.
 * A positive number means to move counterclockwise, i.e. the "mathematically positive direction."
 * No point is counted twice.
 *
 * This should be a non-zero integer.
 * @returns A list of points.
 * The last point will be the same as the `start` point.
 * The first point will be one step away from the `start` point.
 */
function makeCircle(center: Complex, start: Complex, steps: number) {
  const initialOffset = start.sub(center);
  const stepRotation = new Complex({ r: 1, phi: (2 * Math.PI) / steps });
  const result = initializedArray(Math.abs(steps) - 1, (step) => {
    return stepRotation
      .pow(step + 1)
      .mul(initialOffset)
      .add(center);
  });
  result.push(start);
  return result;
}

/**
 * Create a list of points along a line segment.
 * @param from Where to start drawing.
 * The first point in the result will be one step past this.
 * The assumption is that you're starting from the currently saved point.
 * @param to Where to end.  The last point in the list will be exactly this.
 * @param steps How many points do you want?  Should be an integer greater than 0.
 * @returns A list of evenly spaced points between `from` and `to`, including `to` as the last value.
 */
function makeSegment(from: Complex, to: Complex, steps: number) {
  const totalDistance = to.sub(from);
  return initializedArray(steps, (step) =>
    to.sub(totalDistance.mul((steps - step - 1) / steps))
  );
}

/**
 * Rotate a point around the origin by 90° counterclockwise.
 * @param from The initial point.
 * @returns from * 𝓲.  I'm doing it this way to avoid round off error.
 */
function rotate90(from: Complex) {
  return new Complex({ re: -from.im, im: from.re });
}

/**
 *
 * @returns A set containing all of the preview lines.  I.e. the dotted lines.
 *
 * There is always a preview line for every input and output.
 * Sometimes you don't see it because the beginning and end are at the same point,
 * but it is still there.
 */
function savedLines() {
  const notSaved = new Set([zPath, ...wPaths].map((path) => path.lastSegment));
  return Array.from(svg.querySelectorAll("line")).filter(
    (line) => !notSaved.has(line)
  );
}

function styleCurrentLines(newStyle : "thin" | "fat") {
  savedLines().forEach((line) => {
    const classList = line.classList;
    if (!(classList.contains("thin") || classList.contains("fat"))) {
      classList.add(newStyle);
    }
  });
}

(["thin", "fat"] as const).forEach(style => {
  getById(style, HTMLButtonElement).addEventListener("click", () => {
    styleCurrentLines(style);
  });
});

/**
 * Run some automated demos.  Move the input and output according to a script.
 *
 * This is a work in progress.
 */
async function demo() {
  selectFormula(squareRootFormula);
  await sleep(100);
  const steps = 30;
  for (const z of makeCircle(Complex.ZERO, zPath.lastSaved, steps)) {
    updateZ(z);
    await sleep(3000 / steps);
    saveAll();
  }
  styleCurrentLines("fat");
  await sleep(500);
  for (const z of makeCircle(Complex.ZERO, zPath.lastSaved, steps)) {
    updateZ(z);
    saveAll();
    await sleep(3000 / steps);
  }
  await sleep(2000);
  selectFormula(squareRootFormula);
  async function square(
    savesPerSegment: number,
    pointsPerSave: number = Math.floor(50 / savesPerSegment),
    totalMs = 3000
  ) {
    const pointsPerSegment = savesPerSegment * pointsPerSave;
    let source = zPath.lastSaved;
    for (let i = 0; i < 4; i++) {
      const destination = rotate90(source);
      for (const [next, index] of zip(
        makeSegment(source, destination, pointsPerSegment),
        count()
      )) {
        updateZ(next);
        await sleep(totalMs / pointsPerSegment);
        if ((index + 1) % pointsPerSave == 0) {
          saveAll();
        }
      }
      // assert all saved?  Force a save now?
      source = destination;
    }
  }
  await square(1);
  styleCurrentLines("thin");
  await sleep(500);
  await square(2);
  styleCurrentLines("fat");
  await sleep(500);
  await square(30);
  await sleep(500);
}

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
  demo,
};

// TODO Add a "Hide older" button.  Go through all of the lines and make each of them 50% more transparent.
// When they get below 10% just delete them.  Update:  See "fat" and "thin" (quotes included) above for
// a starting point.  Add buttons to allow the user to do what the demo() is already doing.

// TODO add some buttons to do demos, like circles and squares.
// For the square root, consider a simple diamond (rotated square) with only 4 points, to show off the octagon it creates.
// Then a version with one point in the middle of each segment, so you can see the sides of the octagon bow in slightly.
// Then a version two a few more points to make up each segment.
// Then clear it and do a diamond with a whole lot of points, especially right near the corners.
// If I remember correctly, the angles should be 90 degrees.
// Maybe repeat that last detailed step with other shapes, like a triangle.
// If I remember correctly, the input and the output should have identical angles.
// For the log, make a perfect circle or three around the origin.
// Then move to a bigger radius.
// Then perfect circles in the opposite direction.

// TODO Add a button to save the SVG image.
