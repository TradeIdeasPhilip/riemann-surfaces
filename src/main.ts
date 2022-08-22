import "./style.css";
import { Complex } from "complex.js";
import { getById } from "phil-lib/client-misc";
import { zip } from "phil-lib/misc";

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
  readonly badPoints: readonly Complex[];
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
    badPoints: [Complex.ZERO],
    initialZ: new Complex(4),
  },
  // The natural log should not jump.  TODO Fix the analytic continuation.
  // This is different from the square root because ln() has an infinite number of w's and we're just showing one of them.
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
          adjustIm(primary, Math.PI * 2),
          primary,
          adjustIm(primary, -Math.PI * 2),
        ];
      }
    },
    error(w: Complex, z: Complex): number {
      return w.exp().sub(z).abs();
    },
    badPoints: [Complex.ZERO],
    initialZ: Complex.E,
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

const formatter1 = new Intl.NumberFormat(undefined, {
  maximumSignificantDigits: 4,
});
const formatter2 = new Intl.NumberFormat(undefined, {
  maximumSignificantDigits: 4,
  signDisplay: "always",
});

function formatComplex(complex: Complex) {
  return `${formatter1.format(complex.re)}${formatter2.format(complex.im)}𝓲`;
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
  for (const badPoint of formula.badPoints) {
    //        <circle class="bad-point" cx="0" cy="0" r="0.1"></circle>
    const circle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    circle.classList.add("bad-point");
    circle.cx.baseVal.value = badPoint.re;
    circle.cy.baseVal.value = -badPoint.im;
    circle.r.baseVal.value = 0.1;
    topGroup.appendChild(circle);
  }
}

init();

formulaSelect.addEventListener("change", () => {
  init();
});

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
// TODO add corresponding touch events.

// TODO Add a "Hide older" button.  Go through all of the lines and make each of them 50% more transparent.
// When they get below 10% just delete them.

// TODO check for error and print the result.

// TODO add a clear or reset button.

// TODO add the cubic polynomial from the original problem.

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
