'use strict';

const gl = require('@wettstein/nodegl');

/**
 * Draw the original textured cube through nodegl with retained Buffer views.
 * @return {object} Scene initialization, projection, drawing and cleanup.
 */
module.exports = function createCube() {
  // Original 36 vertices: xyz position followed by normalized UV coordinates.
  const cube = new Float32Array([
    -20, -20, -20, 0, 0,
    -20, 20, -20, 1, 0,
    -20, -20, 20, 0, 1,
    -20, -20, 20, 0, 1,
    -20, 20, -20, 1, 0,
    -20, 20, 20, 1, 1,

    20, -20, -20, 0, 0,
    20, 20, -20, 1, 0,
    20, -20, 20, 0, 1,
    20, -20, 20, 0, 1,
    20, 20, -20, 1, 0,
    20, 20, 20, 1, 1,

    -20, -20, -20, 0, 0,
    20, -20, -20, 1, 0,
    -20, -20, 20, 0, 1,
    -20, -20, 20, 0, 1,
    20, -20, -20, 1, 0,
    20, -20, 20, 1, 1,

    -20, 20, -20, 0, 0,
    20, 20, -20, 1, 0,
    -20, 20, 20, 0, 1,
    -20, 20, 20, 0, 1,
    20, 20, -20, 1, 0,
    20, 20, 20, 1, 1,

    -20, -20, -20, 0, 0,
    20, -20, -20, 1, 0,
    -20, 20, -20, 0, 1,
    -20, 20, -20, 0, 1,
    20, -20, -20, 1, 0,
    20, 20, -20, 1, 1,

    -20, -20, 20, 0, 0,
    20, -20, 20, 1, 0,
    -20, 20, 20, 0, 1,
    -20, 20, 20, 0, 1,
    20, -20, 20, 1, 0,
    20, 20, 20, 1, 1,
  ]);
  // nodegl borrows Buffer data; retain these zero-copy views until GL closes.
  let vertices = Buffer.from(cube.buffer, cube.byteOffset, cube.byteLength);
  let texCoords = vertices.subarray(3 * Float32Array.BYTES_PER_ELEMENT);

  /** Surface GL failures through the caller's finally cleanup. */
  function checkError() {
    const error = gl.glGetError();
    if (error) throw new Error(`OpenGL error: 0x${error.toString(16)}`);
  }

  return {
    /** Set up depth testing and interleaved position/UV arrays. */
    initialize() {
      gl.glEnable(gl.GL_DEPTH_TEST);
      gl.glDepthMask(true);
      gl.glClearDepth(1);
      gl.glDisable(gl.GL_LIGHTING);
      gl.glEnable(gl.GL_TEXTURE_2D);
      gl.glEnableClientState(gl.GL_VERTEX_ARRAY);
      gl.glEnableClientState(gl.GL_TEXTURE_COORD_ARRAY);
      gl.glVertexPointer(3, gl.GL_FLOAT, 20, vertices);
      gl.glTexCoordPointer(2, gl.GL_FLOAT, 20, texCoords);
      gl.glDisableClientState(gl.GL_NORMAL_ARRAY);
      gl.glDisableClientState(gl.GL_COLOR_ARRAY);
      checkError();
    },

    /**
     * Preserve the original vertical field of view when resizing.
     * @param {sf.Vector2u} size Client-area dimensions.
     */
    resize(size) {
      gl.glViewport(0, 0, size.x, size.y);
      if (!size.x || !size.y) return;
      gl.glMatrixMode(gl.GL_PROJECTION);
      gl.glLoadIdentity();
      const ratio = size.x / size.y;
      gl.glFrustum(-ratio, ratio, -1, 1, 1, 500);
      checkError();
    },

    /**
     * Draw the rotating cube above the existing SFML background.
     * @param {number} elapsed Seconds since window creation.
     * @param {sf.Vector2i} mouse Window-relative cursor position.
     * @param {sf.Vector2u} size Current client-area dimensions.
     */
    draw(elapsed, mouse, size) {
      gl.glClear(gl.GL_DEPTH_BUFFER_BIT);
      gl.glMatrixMode(gl.GL_MODELVIEW);
      gl.glLoadIdentity();
      gl.glTranslatef(mouse.x * 200 / size.x - 100,
        -mouse.y * 200 / size.y + 100, -100);
      gl.glRotatef(elapsed * 50, 1, 0, 0);
      gl.glRotatef(elapsed * 30, 0, 1, 0);
      gl.glRotatef(elapsed * 90, 0, 0, 1);
      gl.glDrawArrays(gl.GL_TRIANGLES, 0, 36);
      checkError();
    },

    /** Release the Buffer references after the window context is closed. */
    dispose() {
      vertices = undefined;
      texCoords = undefined;
    },
  };
};
