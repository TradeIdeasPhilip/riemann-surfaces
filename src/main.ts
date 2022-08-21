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

/**
 * Eventually the user will get the option to choose between multiple formulas.
 * This is the info that will have to change when the user makes a decision.
 */
const formula = {
  /**
   * This would be good to show in a combo box.
   */
  shortName: "Square Root",
  /**
   * Solve for w given a specific value of z.
   * @param z
   * @returns An array containing all possible solutions.
   */
  allWs(z: Complex): Complex[] {
    const primary = z.sqrt();
    return [primary, primary.neg()];
  },
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
  error(w: Complex, z: Complex): number {
    return w.pow(2).sub(z).abs();
  },
  /**
   * In calculus terminology these are "Branch points".
   */
  badPoints: [Complex.ZERO],
  initialZ: new Complex(4),
};

const bottomGroup = getById("bottom", SVGGElement);
const mainGroup = getById("main", SVGGElement);
const topGroup = getById("top", SVGGElement);

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
  readonly #lastSegment: SVGLineElement;
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
    const line = this.#lastSegment;
    line.x2.baseVal.value = x;
    line.y2.baseVal.value = y;
    const circle = this.#end;
    circle.cx.baseVal.value = x;
    circle.cy.baseVal.value = y;
    this.#currentValue = newValue;
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
  constructor(public readonly color: string, initialValue: Complex) {
    this.#currentValue = initialValue;
    this.#undo = initialValue;
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
    // <line x1="4" y1="0" x2="3" y2="-1.5" stroke="black"></line>
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.x1.baseVal.value = x;
    line.y1.baseVal.value = y;
    line.x2.baseVal.value = x;
    line.y2.baseVal.value = y;
    line.setAttribute("stroke", color);
    mainGroup.appendChild(line);
    this.#lastSegment = line;
  }
}

/**
 * Load the initial state for the given formula.
 * Each path will start and end at the same point and have a length of 0.
 * @returns The `PathInfo` objects.
 */
function init() {
  mainGroup.innerHTML = "";
  topGroup.innerHTML = "";
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
    mainGroup.appendChild(circle);
  }
  const z = formula.initialZ;
  const zPath = new PathInfo("black", z);
  const wValues = formula.allWs(z);
  const wPaths = wValues.map((w, index) => {
    const color = `hsl(${index / wValues.length}turn, 100%, 50%)`;
    return new PathInfo(color, w);
  });
  return { zPath, wPaths };
}

let { zPath, wPaths } = init();

/**
 * Extend the z path to the given point.
 * Solve each of the w's and move their paths to the corresponding points.
 * @param z Move z to here.
 */
function updateZ(z: Complex) {
  zPath.currentValue = z;
  let bestChange = Infinity;
  let bestWsInOrder!: readonly Complex[];
  for (const wsInOrder of permutations(formula.allWs(z))) {
    let change = 0;
    for (const [w, path] of zip(wsInOrder, wPaths)) {
      change += w.sub(path.currentValue).abs();
    }
    if (change < bestChange) {
      bestChange = change;
      bestWsInOrder = wsInOrder;
    }
  }
  for (const [w, path] of zip(bestWsInOrder, wPaths)) {
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

svg.addEventListener("mouseleave", (event) => {
  // TODO undo all of the recent changes.
  //console.log(event);
});
svg.addEventListener("mousemove", (event) => {
  //console.log(event);
  // TODO move the updateZ() to here.
});
svg.addEventListener("mouseup", (event) => {
  //console.log(event);
  //console.log(cursorToComplex(event));
  updateZ(cursorToComplex(event));
  // TODO this should save the current position.
  // Save doesn't exist yet!
});

//let z = formula.initialZ;
