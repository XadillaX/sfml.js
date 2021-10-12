'use strict';

module.exports = {
  Color: require('./color'),
  RenderWindow: require('./render_window'),
  VideoMode: require('./video_mode'),

  ...require('./rect'),

  // drawable
  CircleShape: require('./drawable/circle_shape'),

  Clock: require('./clock'),
  Time: {
    ...require('./time'),
  },
};
