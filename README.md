# Riemann Surfaces and Multi-Valued Functions

This is a way of graphing a function with complex inputs and outputs.
It is especially useful for multi-valued functions.
E.g. β16 = 2 **and** -2.
If you believe in imaginary numbers, it **also** equals 2π² and -2π².

## Terminology

For a given π there can be multiple values for π.
For a given π there can be only one π.
E.g. π=πΒ².

## Try It Yourself!

https://tradeideasphilip.github.io/riemann-surfaces/

This is an interactive program.
Use the mouse to move the π value.
The π values will update automatically.
Click to save the point and continue your path.
Hold the mouse button down to record your entire path, without any preview.

(On a touch device you can just touch to add the next point.
Currently there is no preview or drag option unless you use a mouse.)

Use the dropdown list to pick a function to graph.

The "Demo" section will show you some examples of interesting things you can do.

### Square Root

π=πΒ².
I started here because itβs the easiest way to explain multi-valued functions to someone who hasnβt seen them before.

Make a circle _all the way_ around the branch point, and the two solutions will each go _half way_ around the branch point, in the same direction.
Make a second circle in the same direction and the two solutions will return to their original places.

### Natural Log

π=πΚ·.
This is just a beautiful example. This result makes the most sense if you think of π in polar coordinates.

The distance that π is from the origin sets the real part of the result.
As long as the input stays on the positive part of the real axis, this the the normal natural log.

The angle part of π sets the imaginary part of the result.
If π makes a full circle around the origin in the counter clockwise direction, then you add 2Οπ² to the result.
If you keep rotating the input in the same direction, the output will keep moving at the same rate and can go on forever.

This program plots 5 of the infinite number of solutions.

### P(π,π)=πΒ³-πΒ·π-2=0

This was the original equation that my professor showed our class.
There are three branch points.
If π goes around any one of these points and returns to its initial position, some of the results will swap places.

Try going around multiple branch points.
Or _almost_ going around a branch point.
Or going around a branch point multiple times.

## Alternate View

This image from Wikipedia is a common way to show a Riemann surface, like the one created by π=πΒ².
![Riemann surface 3d graph from Wikipedia](./public/Riemann_surface_sqrt.svg)

π is not just a number on the complex plane.
π is a point on this structure which was made by grafting two complex planes together.
π has to make **two** complete rotations around the point in the center (where all the grid lines meet) before it gets back to the same place on this surface.

That point in the center is often called a "branch point."
It was called a "bad" point in my original TCL code.
This program draws these points as brown dots.

Each position on this Riemann surface maps to exactly one value of π.

There is nothing special about the ray where the green and purple overlap.
This is just an artifact of how someone chose to draw this surface.
You could slide that intersection somewhere else and the picture would mean the same thing.
The advantage of my program over a picture like this one is that my program shows the total symmetry of the problem.

## Branch Points

Take another look at the picture above.

The point in the center where everything comes together is the origin, 0+0π².
On my program this is marked with a brown point.

This point is special because if the input goes here, both of the outputs will have the same value.
This is called a "branch point."

A branch point causes a problem in calculus.
Normally when I'm calculating the next output point I can clearly choose which point will make the path smooth and continuous.
At the branch point the process would be ambiguous, so the answer is no longer well defined.
In calculus terminology you'd say the square root of π is "analytic" everywhere _except_ for this point.
In layman's terms, that's a bad point that we want to avoid.

For the square root of π (labeled `π=πΒ²` in my code) the input _and_ the outputs all go to 0 at the same time.
That is not always the case.
A branch point always refers to position of the input, not the output.

Look at `πΒ³-πΒ·π-2=0` for a more interesting example.
There are three different branch points.
Each time the input goes near one, two of the outputs get very close to each other.
If you could click exactly at the branch point, the two outputs would overlap.

The natural log of π (labeled `π=πΚ·`) is even more interesting.
As with the square root, there is one branch point and it is at 0.
But there are infinitely many answers.
As the input approaches 0, the outputs will all approach infinity.
And they will each approach infinity from a different direction!

Note that the branch points depend on the equation.
We have no choice in where to place them.

## Branch Cuts

Take another look at the picture.
The "0" next to the red edge is 1+0π².
The line connecting that to the branch point is the real axis, a.k.a. the real number line.

Notice where the surface intersects itself.
This corresponds to the dashed brown line in my program.

Ideally you completely ignore this self intersection.
From a practical standpoint, you just try to move it out of the way.
Unlike the branch points, you get some leeway in the position _and shape_ of this intersection.

What if you only looked at the surface from above and ignored anything that wasn't visible?
You'd see a single complex plane.
If you avoid the branch point and the ray where the surface intersects itself, you could do normal math there.
You could pick either of the two outputs and it would be a normal function, as long as you stayed away from the self intersections.
In calculus terminology, the function would be analytic in the entire complex plane except at the branch point and along the branch cut.

When I say "normal" or "[analytic](https://en.wikipedia.org/wiki/Analytic_function)" I mean you could could make a function that

- takes in a single complex input and returns a single complex output,
- is defined everywhere I just described, and
- gives two outputs that are arbitrarily close together if the two inputs are sufficiently close together.

My software will automatically move the branch cut out of your way each time you click to save a point in the path.
Use the check box to show the cut.
Move the mouse around the branch cut without clicking to see what happens when you don't move the branch cut.
In this case you can move the input a small amount and the output will jump a lot.

For some formulas I have disabled the branch cut.
The function still give the right answers.
And as long as you make small moves between each click and don't get too close to the branch point, everything will work fine.
It was just too complicated for me to show more.

## History

I recreated something I did in school.
https://www.trade-ideas.com/home/phil/loops/
That code doesnβt want to run any more, so I redid it in JavaScript (TypeScript).

This saved my butt back in grad school. I was having trouble in complex analysis class. The rest of the students were all math majors, and had a fulltime job. But I took one of my professorβs handouts and turned it into an interactive demo and I got a lot of extra credit.

I still have that handout.
There were no drawings, no colors, just a page full of numbers.
![The professor's original handout](./Riemann300.jpg)

I was initially upset because I couldnβt get my answers to match the professorβs handout. My professor wasnβt the slightest bit concerned. It turns out he made a mistake in his version. No one had ever noticed until I created my interactive demo!

## In Layman's Terms

_Complex analysis_ is calculus with imaginary numbers.
It is mostly focused on _analytic_ functions, i.e. things that are smooth to the nth degree.
Some functions, like square root, would be perfectly analytic except for the one pesky little problem that they have more than one answer.
A _Riemann surface_ (pictured above) is a way to solve that problem, and make the square root perfectly smooth.
My program is a way to visualize Riemann surfaces in action.

## Keywords

- Riemann surface
- Roots of complex equations
- Analytic continuation
- Multi valued functions
- Complex analysis
- Graphing complex functions
- Branch point
