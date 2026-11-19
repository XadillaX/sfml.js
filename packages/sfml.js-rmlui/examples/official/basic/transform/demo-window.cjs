'use strict';

/**
 * The original transform sample's window retains its perspective distance.
 */
class DemoWindow {
  constructor(title, position, context) {
    this.perspective = 0;
    this.document = context.loadDocument('basic/transform/data/transform.rml');
    this.document.getElementById('title').innerRML = title;
    this.document.setProperty('left', `${position.x}dp`);
    this.document.setProperty('top', `${position.y}dp`);
    this.document.show();
  }

  setPerspective(distance) {
    this.perspective = distance;
    if (distance > 0) {
      this.document.setProperty('transform', `perspective(${distance}dp)`);
    }
  }

  setRotation(degrees) {
    const perspective = this.perspective > 0
      ? `perspective(${this.perspective}dp) ` : '';
    this.document.setProperty('transform',
      `${perspective}rotate3d(0.0, 1.0, 0.0, ${degrees}deg)`);
  }

  close() {
    this.document.close();
  }
}

module.exports = { DemoWindow };
