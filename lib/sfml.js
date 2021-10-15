'use strict';

module.exports = {
  Color: require('./color'),
  RenderWindow: require('./render_window'),
  VideoMode: require('./video_mode'),

  ...require('./rect'),
  ...require('./vector2'),

  // drawable
  CircleShape: require('./drawable/circle_shape'),
  ConvexShape: require('./drawable/convex_shape'),
  RectangleShape: require('./drawable/rectangle_shape'),

  Clock: require('./clock'),
  Time: {
    ...require('./time'),
  },
};
