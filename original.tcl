###########################################################################
# Complex Math
# Complex numbers are represented as a list of two real number, x then y.
###########################################################################

proc c_+ {z w} {
  set x [lindex $z 0]
  set y [lindex $z 1]
  set u [lindex $w 0]
  set v [lindex $w 1]
  list [expr {$x + $u}] [expr {$y + $v}]
}

proc c_- {z w} {
  set x [lindex $z 0]
  set y [lindex $z 1]
  set u [lindex $w 0]
  set v [lindex $w 1]
  list [expr {$x - $u}] [expr {$y - $v}]
}

proc c_* {z w} {
  set x [lindex $z 0]
  set y [lindex $z 1]
  set u [lindex $w 0]
  set v [lindex $w 1]
  list [expr {$x * $u - $y * $v}] [expr {$x * $v + $y * $u}]
}

proc c_/ {z w} {
    set x [lindex $z 0]
    set y [lindex $z 1]
    set u [lindex $w 0]
    set v [lindex $w 1]
    set denom [expr {$u * $u + $v * $v + 0.0}]
    list [expr {($x * $u + $y * $v) / $denom}] [expr {($y * $u - $x * $v) / $denom}]
}

# z -> -z
proc c_neg {z} {
    c_* {-1 0} $z
}

proc c_sqrt {z} {
    c_to_polar $z r th
    c_from_polar [expr {sqrt($r)}] [expr {$th / 2.0}]
}

# Select the "primary" root.  For n an integer, pick the root closest
# to the positive real axis.
proc c_nth_root {z n} {
    c_to_polar $z r th
    c_from_polar [expr {pow($r, 1.0/$n)}] [expr {$th / $n}]
}

# (z,n) -> z^n.  n can actually be real, but will probably be an integer.
proc c_nth_pwr {z n} {
    c_to_polar $z r th
    c_from_polar [expr {pow($r, $n)}] [expr {$th * $n}]
}

proc c_sqr {z} {
    c_nth_pwr $z 2
}

proc c_cube {z} {
    c_nth_pwr $z 3
}

proc c_abs {z} {
    set x [lindex $z 0]
    set y [lindex $z 1]
    expr {sqrt($x * $x + $y * $y)}
}

proc c_as_string {z} {
    set x [lindex $z 0]
    set y [lindex $z 1]
    format {%0.4f%+0.4fi} $x $y
}
    
proc c_to_polar {z r_var th_var} {
    upvar $r_var r
    upvar $th_var th
    set x [lindex $z 0]
    set y [lindex $z 1]
    set r [expr {sqrt($x * $x + $y * $y)}]
    set th [expr atan2($y,$x)]
}

proc c_from_polar {r th} {
    list [expr {$r * cos($th)}] [expr {$r * sin($th)}]
}


###########################################################################
# Algebra.
# Currently fixed for P(z,w) = w^3-z*-2
###########################################################################

# Just for display.  Maybe we should keep the user from selecting these.
# Or maybe not.  The function is undefined after that point, but interesting
# at that point.
#
# Returns a list of complex numbers.
proc bad_points {} {
    set z1 [c_nth_root {-1 0} 3]
    set rho [c_* $z1 $z1]
    set rho_sqr [c_* $rho $rho]
    list {3 0} [c_* {3 0} $rho] [c_* {3 0} $rho_sqr]
}

# Returns a list of complex numbers.
proc solutions {z} {
    # Correction is used to choose the right 3rd root.  Otherwise the result
    # will not be the roots of the equation.  This was determined by seeing
    # what would make this funciton continuous.
    # The rest of the logic is from Schaums with some algebra for the constant
    # terms.
    set a [c_sqrt [c_- {1 0} [c_/ [c_cube $z] {27 0}]]]
    if {[c_abs $z] == 0.0} {
	set correction {1 0}
    } else {
	set correction [c_/ $z [c_nth_root [c_cube $z] 3]]
    }
    set S [c_nth_root [c_+ {1 0} $a] 3]
    set T [c_nth_root [c_- {1 0} $a] 3]
    set T [c_* $T $correction]
    set root1 [c_+ $S $T]
    set b [c_* {0.0 0.866025403785} [c_- $S $T]]
    set c [c_* {-0.5 0.0} [c_+ $S $T]]
    set root2 [c_+ $c $b]
    set root3 [c_- $c $b]
    list $root1 $root2 $root3
}

# This is the funciton we are finding the roots of.  This funciton is used
# only to verify the solutions function, and is not used by the operational
# system.
proc P {z w} {
    c_- [c_- [c_cube $w] [c_* $z $w]] {2 0}
}

###########################################################################
# Numerical Support
###########################################################################

proc permute {from perm} {
    foreach index $perm {
	lappend result [lindex $from $index]
    }
    return $result
}

proc total_distance {a b} {
    set distance 0.0
    foreach z $a w $b {
	set distance [expr {$distance + [c_abs [c_- $z $w]]}]
    }
    return $distance
}

proc reorder {previous current} {
    foreach perm {{0 1 2} {0 2 1} {1 0 2} {1 2 0} {2 0 1} {2 1 0}} {
	set try [permute $current $perm]
	set d [total_distance $previous $try]
	if {(![info exists min_d]) || ($d < $min_d)} {
	    set min_d $d
	    set best_try $try
	}
    }
    return $best_try
}


###########################################################################
# GUI
# All I/O is done in complex numbers.
# The number of bad points, the number of inputs, and the scale are
# currently fixed.
###########################################################################

set border_colors {\#000000 \#ff0000 \#00c000 \#0000ff}
set fill_colors {\#C0C0C0 \#ff8080 \#80ff80 \#8080ff}

proc create_shapes {c} {
    global border_colors fill_colors
    global path_items start_items end_items
    for {set i 0} {$i < 4} {incr i} {
	set path_items($i) [$c create line 0 0 0 0 -fill [lindex $border_colors $i]]
    }
    for {set i 0} {$i < 4} {incr i} {
	set start_items($i) [$c create rectangle 0 0 0 0 -outline [lindex $border_colors $i] -fill [lindex $fill_colors $i] -width 2]
    }
    for {set i 0} {$i < 4} {incr i} {
	set end_items($i) [$c create oval 0 0 0 0 -outline [lindex $border_colors $i] -fill [lindex $fill_colors $i] -width 2]
    }
}

proc canvas_pos {where x_var y_var} {
    upvar $x_var x
    upvar $y_var y
    set x [expr {[lindex $where 0] * 75.0 + 250}]
    set y [expr {[lindex $where 1] * -75.0 + 250}]
}

proc from_canvas {x y} {
    list [expr {($x - 250) / 75.0}] [expr {($y - 250) / -75.0}]
}

proc reset_pointer {c which where} {
    global path_items start_items end_items path_points
    canvas_pos $where x y
    set path_points($which) [list $x $y]
    $c coords $start_items($which) [expr {$x - 7.5}] [expr {$y - 7.5}] [expr {$x + 7.5}] [expr {$y + 7.5}]
    $c coords $end_items($which) [expr {$x - 5}] [expr {$y - 5}] [expr {$x + 5}] [expr {$y + 5}]
    $c coords $path_items($which) $x $y $x $y
}

proc update_pointer {c which where} {
    global path_items start_items end_items path_points
    canvas_pos $where x y
    lappend path_points($which) $x $y
    $c coords $end_items($which) [expr {$x - 5}] [expr {$y - 5}] [expr {$x + 5}] [expr {$y + 5}]
    eval [concat [list $c coords $path_items($which)] $path_points($which)]
}

proc display_values {} {
    global current_z current_roots
    .f.l0 config -text [c_as_string $current_z]
    foreach i {1 2 3} r $current_roots {
	.f.l$i config -text [c_as_string $r]
    }

    set total_error 0.0
    foreach w $current_roots {
	set local_error [c_abs [P $current_z $w]]
	set total_error [expr {$total_error + $local_error}]
    }
    .f.err config -text [format {Err=%0.4f} $total_error]
#    puts $total_error
}

proc reset_z {} {
    global current_z current_roots
    set current_z {0.0 0.0}
    set current_roots [solutions $current_z]
    reset_pointer .c 0 $current_z
    foreach a {1 2 3} b $current_roots {
	reset_pointer .c $a $b
    }
    display_values
}

proc update_z {z} {
    global current_z current_roots
    set roots [solutions $z]
    set roots [reorder $current_roots $roots]
    update_pointer .c 0 $z
    foreach a {1 2 3} b $roots {
	update_pointer .c $a $b
    }
    set current_z $z
    set current_roots $roots
    display_values
}

# Just for development.  This just moves things without a trail.
proc set_z {z} {
    set roots [solutions $z]
    reset_pointer .c 0 $z
    foreach a {1 2 3} b $roots {
	reset_pointer .c $a $b
    }
}

proc init_graphics {} {
    global border_colors
    canvas .c -width 500 -height 500 -bg white
    pack .c -side top
    frame .f
    pack .f -side top -fill both
    foreach i {0 1 2 3} {
	label .f.l$i -fg [lindex $border_colors $i]
	pack .f.l$i -side left -expand 1
    }
    label .f.err -fg \#ff00ff
    pack .f.err
    create_shapes .c 
    button .b -text Reset -command {reset_z}
    pack .b -side top -fill both
    foreach z [bad_points] {
	canvas_pos $z x y
	.c create oval [expr {$x - 4}] [expr {$y - 4}] [expr {$x + 4}] [expr {$y + 4}] -fill \#ff00ff -outline {}
    }
    reset_z
    bind .c <Button-1> {update_z [from_canvas %x %y]}
}

init_graphics
