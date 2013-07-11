/**
 * Trippy runs a small animation of an observer flying through
 * a field of stars on a canvas element.
 *
 * It can comfortably run 2000 particles on a little netbook.
 * It has not been tested on anything more powerful.
 */
function trippy(canvas, options) {
    "use strict";

    /*
     * Sanity and argument checks
     */

    // Require element is a canvas
    if(canvas.nodeName != "CANVAS") {
        console.error(
            "Trippy called on something that is not a canvas!"
        );
        console.error(canvas);
    }

    // Set options to empty object if undefined
    options = options || {};


    /*
     * Defaults
     */

    // Point sizes
    var point_size = options.point_size || 20;
    var num_points = options.num_points || 2000;

    // Spreads and distances
    var focal_length = options.focal_length || 0.01;
    var start_distance = options.start_distance || 1;
    var start_spread = options.start_spread || 60;

    // Update rate and speeds
    var velocity = options.velocity || 0.1;
    var time_step = options.time_step || 0.1;
    var step_interval = options.step_interval || 40;

    // Colors
    var bg_color = options.bg_color || "#000000";
    var point_colors = options.point_colors || [
        // White, faint red, faint blue
        "#ffffff", "#ffcccc", "#ccccff"
    ];

    // Canvas context
    var ctx = canvas.getContext("2d");


    /*
     * Coordinate functions
     */

    // Functions for drawing on the canvas using
    // coords [(-0.5, 0.5), (-0.5, 0.5)]
    function center_x_to_canvas(x) {
        return canvas.width*x + 0.5*canvas.width;
    }
    function center_y_to_canvas(y) {
        return canvas.height*y + 0.5*canvas.height;
    }

    // Get projected perspective based coord
    function perspective(focal_length, pos, depth) {
        return pos*focal_length/depth;
    }


    /**
     * Point array and associated operations.
     *
     * The point array is a 4*num_points array.
     * A point is of the form [x, y, z, colour].
     *
     * Data for point i can be accessed:
     * points[4*i + 0] => x coord
     * points[4*i + 1] => y coord
     * points[4*i + 2] => z coord
     * points[4*i + 3] => colour
     *
     * A much nicer data structure was originally used,
     * but this was found to be much faster.
     */

    // The all important array of points
    var points = new Array(4*num_points);

    // Get offset for starting at point i
    function point_offset(i) {
        return 4*i;
    }

    // Reset a point, have it come from the distance
    function renew_point(i) {
        var offset = point_offset(i);

        points[offset+0] = start_spread*(Math.random()-0.5);
        points[offset+1] = start_spread*(Math.random()-0.5);
        points[offset+2] = start_distance;
        points[offset+3] = point_colors[
            Math.floor(Math.random()*point_colors.length)
        ];
    }

    // Move a point towards the screen for one time step
    function step_point_forward(i, v, dt) {
        points[point_offset(i)+2] -= v*dt;
    }


    var checkPerformance = (function() {
        if(document.location.search.match("debug=true")) {
            var old_time = window.performance.now();
            var rep = 0;
            var num_reps = 100;

            console.log("Outputting timing averaged over "+num_reps+" reps.");

            return function() {
                rep++;

                if(rep%num_reps == 0) {
                    var time = window.performance.now();
                    var diff = time - old_time;

                    old_time = time;

                    console.debug(diff/num_reps);
                }
            }
        } else {
            return function() {};
        }
    })();


    // If requested dot is small enough, approximate it to
    // a rectangle.
    ctx.performanceDot = function(x, y, size) {
        // Cut off drawing size
        if (size < 0.2) {
            // do nothing

        // Cheap drawing size
        } else if(size < 1) {
            this.rect(x-size, y-size, 2*size, 2*size);

        // Regular drawing
        } else {
            this.arc(x, y, size, 0, Math.PI*2, true);
        }
    }



    /**
     * Run trippy
     *
     * Function outputs all current points and then steps them
     * forward by one time step.
     *
     * A setInterval ensures we keep good time and that the browser
     * doesn't crash on a never ending while loop. This also allows
     * other scripts to execute.
     */

    //Initialize the points
    for(var i=0; i<num_points; i++) {
        renew_point(i);
        points[point_offset(i)+2] = Math.random();
    }

    setInterval(function run_trippy() {

        // Particle data
        var point_x;
        var point_y;
        var point_z;
        var size;
        var color;

        // Cet particle data
        var set_projected_coords = function(i) {
            var offset = point_offset(i);

            point_x = points[offset+0];
            point_y = points[offset+1];
            point_z = points[offset+2];
            color   = points[offset+3];

            // Get perspective coordinates
            point_x = perspective(focal_length, point_x,    point_z);
            point_y = perspective(focal_length, point_y,    point_z);
            size    = perspective(focal_length, point_size, point_z);
        };


        // Clear the canvas
        ctx.beginPath();
        ctx.rect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = bg_color;
        ctx.fill();

        // Loop over the points
        for(var i=0; i<num_points; i++) {

            // Set projected coords
            set_projected_coords(i);

            // If point is outside of the viewing screen, reset it.
            // Ensure new point is actually inside the viewing screen
            while(
                Math.abs(point_x) > 0.5 || Math.abs(point_y) > 0.5
                || size < 0
            ) {
                renew_point(i);
                set_projected_coords(i);
            }

            // Draw point to screen
            ctx.beginPath();
            ctx.performanceDot(
                center_x_to_canvas(point_x), center_y_to_canvas(point_y), size
            );
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();

            // Update point
            step_point_forward(i, velocity, time_step);

        }

        // Check performance
        checkPerformance();

    }, step_interval);
}


// Add trippy to jQuery
(function($) {

    $.fn.trippy = function(options) {

        // Run trippy on each element
        this.each(function(index, canvas) {
            trippy(canvas, options);
        });

        // Return selector
        return this;
    }

})(jQuery);
