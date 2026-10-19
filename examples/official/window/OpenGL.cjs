'use strict';

const gl = require('@wettstein/nodegl');

/**
 * Draw through nodegl on the active SFML window's native thread.
 * @param {Float32Array} cube Interleaved xyz positions and RGBA colors.
 * @return {object} Scene setup, resize, drawing and vertex storage cleanup.
 */
module.exports = function createScene(cube) {
  // nodegl borrows Buffer data; retain these zero-copy views until GL closes.
  let vertices = Buffer.from(cube.buffer, cube.byteOffset, cube.byteLength);
  let colors = vertices.subarray(3 * Float32Array.BYTES_PER_ELEMENT);
  let drawable = false;

  /** Surface GL failures through the example's normal cleanup path. */
  function checkError() {
    const error = gl.glGetError();
    if (error) throw new Error(`OpenGL error: 0x${error.toString(16)}`);
  }

  return {
    /** Configure depth testing and the original vertex/color arrays. */
    initialize() {
      gl.glClearDepth(1);
      gl.glClearColor(0, 0, 0, 1);
      gl.glEnable(gl.GL_DEPTH_TEST);
      gl.glDepthMask(true);
      gl.glDisable(gl.GL_LIGHTING);
      gl.glDisable(gl.GL_TEXTURE_2D);
      gl.glEnableClientState(gl.GL_VERTEX_ARRAY);
      gl.glEnableClientState(gl.GL_COLOR_ARRAY);
      gl.glVertexPointer(3, gl.GL_FLOAT, 28, vertices);
      gl.glColorPointer(4, gl.GL_FLOAT, 28, colors);
      gl.glDisableClientState(gl.GL_NORMAL_ARRAY);
      gl.glDisableClientState(gl.GL_TEXTURE_COORD_ARRAY);
      checkError();
    },

    /**
     * Preserve the vertical field of view as the window changes aspect ratio.
     * @param {object} size Current client-area pixel dimensions.
     */
    resize(size) {
      drawable = size.x > 0 && size.y > 0;
      gl.glViewport(0, 0, size.x, size.y);
      if (!drawable) return;

      gl.glMatrixMode(gl.GL_PROJECTION);
      gl.glLoadIdentity();
      const ratio = size.x / size.y;
      gl.glFrustum(-ratio, ratio, -1, 1, 1, 500);
      checkError();
    },

    /**
     * Render the six-colored cube at its original angular velocities.
     * @param {number} elapsed Seconds since the scene started.
     * @return {boolean} Whether a frame was rendered.
     */
    draw(elapsed) {
      if (!drawable) return false;
      gl.glClear(gl.GL_COLOR_BUFFER_BIT + gl.GL_DEPTH_BUFFER_BIT);
      gl.glMatrixMode(gl.GL_MODELVIEW);
      gl.glLoadIdentity();
      gl.glTranslatef(0, 0, -200);
      gl.glRotatef(elapsed * 50, 1, 0, 0);
      gl.glRotatef(elapsed * 30, 0, 1, 0);
      gl.glRotatef(elapsed * 90, 0, 0, 1);
      gl.glDrawArrays(gl.GL_TRIANGLES, 0, 36);
      checkError();
      return true;
    },

    /** Release the Buffer references after closing the GL context. */
    dispose() {
      vertices = undefined;
      colors = undefined;
    },
  };
};
