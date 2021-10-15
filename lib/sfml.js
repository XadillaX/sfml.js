'use strict';

module.exports = {
  Clock: require('./clock'),
  Color: require('./color'),
  Font: require('./font'),
  Keyboard: require('./keyboard'),
  Mouse: require('./mouse'),
  RenderWindow: require('./render_window'),
  VideoMode: require('./video_mode'),

  Time: {
    ...require('./time'),
  },

  ...require('./rect'),
  ...require('./vector2'),

  // drawable
  CircleShape: require('./drawable/circle_shape'),
  ConvexShape: require('./drawable/convex_shape'),
  RectangleShape: require('./drawable/rectangle_shape'),
};
