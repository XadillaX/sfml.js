'use strict';

const gl = require('@wettstein/nodegl');

/**
 * Draw through nodegl on the calling thread's active SFML context.
 * @param {Float32Array} cube Interleaved positions and RGB colors.
 * @return {object} Context initialization, drawing and vertex storage cleanup.
 */
module.exports = function createScene(cube) {
  // Both GL contexts borrow these zero-copy Buffer views until they close.
  let vertices = Buffer.from(cube.buffer, cube.byteOffset, cube.byteLength);
  let colors = vertices.subarray(3 * Float32Array.BYTES_PER_ELEMENT);

  /** Surface GL failures through the example's normal cleanup path. */
  function checkError() {
    const error = gl.glGetError();
    if (error) throw new Error(`OpenGL error: 0x${error.toString(16)}`);
  }

  return {
    /** Initialize whichever SFML context is currently active. */
    initialize() {
      gl.glClearDepth(1);
      gl.glClearColor(0, 0.5, 0.5, 0);
      gl.glEnable(gl.GL_DEPTH_TEST);
      gl.glDepthMask(true);
      gl.glMatrixMode(gl.GL_PROJECTION);
      gl.glLoadIdentity();
      const extent = Math.tan(Math.PI / 4);
      gl.glFrustum(-extent, extent, -extent, extent, 1, 500);
      gl.glEnableClientState(gl.GL_VERTEX_ARRAY);
      gl.glEnableClientState(gl.GL_COLOR_ARRAY);
      gl.glVertexPointer(3, gl.GL_FLOAT, 24, vertices);
      gl.glColorPointer(3, gl.GL_FLOAT, 24, colors);
      checkError();
    },

    /**
     * Draw the original cube with its original per-axis angular velocities.
     * @param {number} elapsed Seconds since the scene started.
     */
    draw(elapsed) {
      gl.glClear(gl.GL_COLOR_BUFFER_BIT + gl.GL_DEPTH_BUFFER_BIT);
      gl.glMatrixMode(gl.GL_MODELVIEW);
      gl.glLoadIdentity();
      gl.glTranslatef(0, 0, -200);
      gl.glRotatef(elapsed * 10, 1, 0, 0);
      gl.glRotatef(elapsed * 6, 0, 1, 0);
      gl.glRotatef(elapsed * 18, 0, 0, 1);
      gl.glDrawArrays(gl.GL_TRIANGLES, 0, 36);
      checkError();
    },

    /** Release shared Buffer references after both GL contexts are closed. */
    dispose() {
      vertices = undefined;
      colors = undefined;
    },
  };
};
