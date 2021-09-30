'use strict';

module.exports = {
  Color: require('./color'),
  RenderWindow: require('./render_window'),
  VideoMode: require('./video_mode'),

  // drawable
  CircleShape: require('./drawable/circle_shape'),

  Time: {
    ...require('./time'),
  },
};
