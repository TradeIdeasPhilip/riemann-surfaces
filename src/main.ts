import "./style.css";
import { Complex } from "complex.js";
import { getById } from "phil-lib/client-misc";
import { sum, zip } from "phil-lib/misc";

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

const formulas: Formula[] = [
  {
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
  },
  {
    shortName: "Natural Log",
    allWs(z: Complex, previousWs?: readonly Complex[]): readonly Complex[] {
      function adjustIm(base: Complex, toAdd: number) {
        return base.add(0, toAdd);
      }
      const primary = z.log();
      if (previousWs) {
        return previousWs.map((previousW) => {
          const difference = previousW.im - primary.im;
          const adjustment =
            Math.round(difference / (Math.PI * 2)) * Math.PI * 2;
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
  },
  {
    shortName: "w³-zw-2 = 0",
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
  },
];

const formulaSelect = getById("formula", HTMLSelectElement);
formulas.forEach((formula) => {
  const option = document.createElement("option");
  option.innerText = formula.shortName;
  formulaSelect.appendChild(option);
});

const bottomGroup = getById("bottom", SVGGElement);
const mainGroup = getById("main", SVGGElement);
const topGroup = getById("top", SVGGElement);

const positionInfoDiv = getById("positionInfo", HTMLDivElement);
const errorInfoDiv = getById("errorInfo", HTMLDivElement);

// Focus on en-US because I'm doing some very specific things with the
// output, not just printing it as is.  I don't want to test this in
// multiple locales!
const formatter = new Intl.NumberFormat("en-US", {
  minimumSignificantDigits: 4,
  maximumSignificantDigits: 4,
});

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
 * This describes the path of the z or one of the w's.
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

let formula!: Formula;
let zPath!: PathInfo;
let wPaths!: PathInfo[];

function init() {
  bottomGroup.innerHTML = "";
  mainGroup.innerHTML = "";
  topGroup.innerHTML = "";
  positionInfoDiv.innerHTML = "";
  formula = formulas[formulaSelect.selectedIndex];
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

getById("reset", HTMLButtonElement).addEventListener("click", () => init());

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

// Export the updateZ() function to the JavaScript console for debug purposes.
// The inputs are 2 real numbers because the Complex class has not be exported to the console.
(window as any).updateZ = (re: number, im: number) => {
  updateZ(new Complex(re, im));
};

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

function saveAll() {
  zPath.save();
  wPaths.forEach((path) => path.save());
}

svg.addEventListener("mouseleave", () => {
  zPath.undo();
  wPaths.forEach((path) => path.undo());
});
svg.addEventListener("mousemove", (event) => {
  updateZ(cursorToComplex(event));
  if (event.buttons & 1) {
    saveAll();
  }
});
svg.addEventListener("mouseup", (_event) => {
  saveAll();
});

// TODO Add a "Hide older" button.  Go through all of the lines and make each of them 50% more transparent.
// When they get below 10% just delete them.

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
