(function($) {
"use strict";

    $.fn.trippy = function(options) {
        this.each(function(index, canvas) {
            if(canvas.nodeName != "CANVAS") {
                console.error(
                    "Trippy called on something that is not a canvas!"
                );
                console.error(canvas);
            }

            options = options || {};

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

            // Canvas stuff
            var ctx = canvas.getContext("2d");

            // Functions for drawing on the canvas using
            // coords [(-0.5, 0.5), (-0.5, 0.5)]
            function center_x_to_canvas(x) {
                return canvas.width*x + 0.5*canvas.width;
            }
            function center_y_to_canvas(y) {
                return canvas.height*y + 0.5*canvas.height;
            }

            // Get flattened perspective based coord
            function perspective(focal_length, pos, depth) {
                return pos*focal_length/depth;
            }


            // The all important array of points
            var points = new Array(4*num_points);
            function point_offset(i) {
                return 4*i;
            }

            // Get a new point
            function renew_point(i) {
                var offset = point_offset(i);

                points[offset+0] = start_spread*(Math.random()-0.5);
                points[offset+1] = start_spread*(Math.random()-0.5);
                points[offset+2] = start_distance;
                points[offset+3] = point_colors[
                    Math.floor(Math.random()*point_colors.length)
                ];
            }

            // Step a point through the simulation
            function step_point_forward(i, v, dt) {
                points[point_offset(i)+2] -= v*dt;
            }


            //Initialize the points array
            for(var i=0; i<num_points; i++) {
                renew_point(i);
                points[point_offset(i)+2] = Math.random();
            }


            // Run trippy
            //
            // Function outputs all current points and then steps them
            // forward by one time step.
            //
            // Function is implemented as a self executing function that
            // calls itself in a setTimeout. This ensures we keep good
            // time and that the browser doesn't choke on a recursive
            // function.
            //
            setInterval(function run_trippy() {

                ctx.beginPath();
                ctx.rect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = bg_color;
                ctx.fill();

                for(var i=0; i<num_points; i++) {
                    var offset = point_offset(i);

                    var pos_x  = perspective(
                        focal_length, points[offset+0], points[offset+2]
                    );
                    var pos_y  = perspective(
                        focal_length, points[offset+1], points[offset+2]
                    );
                    var p_size = perspective(
                        focal_length, point_size, points[offset+2]
                    );

                    while(
                        Math.abs(pos_x) > 0.5
                        && Math.abs(pos_y) > 0.5
                        || p_size < 0
                    ) {
                        renew_point(i)

                        pos_x  = perspective(
                            focal_length, points[offset+0], points[offset+2]
                        );
                        pos_y  = perspective(
                            focal_length, points[offset+1], points[offset+2]
                        );
                        p_size = perspective(
                            focal_length, point_size, points[offset+2]
                        );
                    }

                    ctx.beginPath();
                    ctx.arc(
                        center_x_to_canvas(pos_x),
                        center_y_to_canvas(pos_y),
                        p_size,
                        0, Math.PI*2, true
                    );
                    ctx.closePath();
                    ctx.fillStyle = points[offset+3];
                    ctx.fill();

                    step_point_forward(i, velocity, time_step);
                }
            }, step_interval)

        });

        // Keeping in the spirit of jQuery
        return this;
    }

})(jQuery);
