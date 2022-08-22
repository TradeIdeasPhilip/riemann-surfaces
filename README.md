# Riemann Surfaces

I'm recreating something I did in school.
https://www.trade-ideas.com/home/phil/loops/
That code doesn't want to run any more, so I'm redoing it in JavaScript (TypeScript).

This is a way of graphing a function with complex inputs and outputs.
It is especially useful for multi-valued functions.
E.g. ∜16 = 2 **and** -2.
If you believe in imaginary numbers, it **also** equals 2𝓲 and -2𝓲.

## Terminology

For a given 𝒛 there can be multiple 𝒘's.
For a given 𝒘 there can be only one 𝒛.
E.g. 𝒛=𝒘².

## Try It Yourself!

https://tradeideasphilip.github.io/riemann-surfaces/

This is an interactive program.
Use the mouse to move the 𝒛 value.
The 𝒘 values will update automatically.
Click save the point and continue your path.
Hold the mouse button down to record your entire path, without any preview.

Use the dropdown list to pick a function to graph.

## Alternate View

This image from Wikipedia is a common way to show a Riemann surface, like the one created by 𝒛=𝒘².
![Riemann surface 3d graph from Wikipedia](./public/Riemann_surface_sqrt.svg)

𝒛 is not just a number on the complex plane.
𝒛 is a point on this structure which was made by grafting two complex planes together.
𝒛 has to make **two** complete rotations around the point in the center (where all the grid lines meet) before it gets back to the same place on this surface.

That point in the center is often called a "branch point" in calculus class.
It is called a "bad" point in this code.
This program draws this points as brown dots.

Each position on this Riemann surface maps to exactly one value of 𝒘.

There is nothing special about the ray where the green and purple overlap.
This is just an artifact of how someone chose to draw this surface.
You could slide that intersection somewhere else and the picture would mean the same thing.
The advantage of this program over a picture like this one is that this program shows the total symmetry of the problem.

## Keywords

- Riemann surface
- Roots of complex equations
- Analytic continuation
- Multi valued functions
- Complex analysis
- Graphing complex functions
- Branch point
