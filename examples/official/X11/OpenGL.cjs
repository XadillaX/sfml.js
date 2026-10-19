'use strict';

const koffi = require('koffi');

/**
 * Bind the upstream desktop GL calls through Koffi, on the calling thread.
 * @param {Float32Array} cube Interleaved positions and RGB colors.
 * @return {object} Context initialization, drawing and vertex storage cleanup.
 */
module.exports = function createScene(cube) {
  const library = koffi.load('libGL.so.1');
  const gl = {
    clearDepth: library.func('void glClearDepth(double depth)'),
    clearColor: library.func('void glClearColor(float r, float g, float b, ' +
      'float a)'),
    enable: library.func('void glEnable(unsigned int capability)'),
    depthMask: library.func('void glDepthMask(unsigned char flag)'),
    matrixMode: library.func('void glMatrixMode(unsigned int mode)'),
    loadIdentity: library.func('void glLoadIdentity(void)'),
    frustum: library.func('void glFrustum(double left, double right, ' +
      'double bottom, double top, double nearValue, double farValue)'),
    enableClientState: library.func('void glEnableClientState(unsigned int a)'),
    vertexPointer: library.func('void glVertexPointer(int size, ' +
      'unsigned int type, int stride, const void *pointer)'),
    colorPointer: library.func('void glColorPointer(int size, ' +
      'unsigned int type, int stride, const void *pointer)'),
    clear: library.func('void glClear(unsigned int mask)'),
    translate: library.func('void glTranslatef(float x, float y, float z)'),
    rotate: library.func(
      'void glRotatef(float angle, float x, float y, float z)'
    ),
    drawArrays: library.func('void glDrawArrays(unsigned int mode, ' +
      'int first, int count)'),
    getError: library.func('unsigned int glGetError(void)'),
  };
  const GL = {
    DEPTH_TEST: 0x0b71,
    PROJECTION: 0x1701,
    MODELVIEW: 0x1700,
    VERTEX_ARRAY: 0x8074,
    COLOR_ARRAY: 0x8076,
    FLOAT: 0x1406,
    TRIANGLES: 0x0004,
    COLOR_BUFFER_BIT: 0x4000,
    DEPTH_BUFFER_BIT: 0x0100,
  };

  // GL retains these pointers across FFI calls. Allocate stable native memory
  // once, and release it only after both SFML contexts have been closed.
  const vertices = koffi.alloc('float', cube.length);
  new Float32Array(koffi.view(vertices, cube.byteLength)).set(cube);

  /** Surface GL failures through the example's normal cleanup path. */
  function checkError() {
    const error = gl.getError();
    if (error) throw new Error(`OpenGL error: 0x${error.toString(16)}`);
  }

  return {
    /** Initialize whichever SFML context is currently active. */
    initialize() {
      gl.clearDepth(1);
      gl.clearColor(0, 0.5, 0.5, 0);
      gl.enable(GL.DEPTH_TEST);
      gl.depthMask(1);
      gl.matrixMode(GL.PROJECTION);
      gl.loadIdentity();
      const extent = Math.tan(Math.PI / 4);
      gl.frustum(-extent, extent, -extent, extent, 1, 500);
      gl.enableClientState(GL.VERTEX_ARRAY);
      gl.enableClientState(GL.COLOR_ARRAY);
      gl.vertexPointer(3, GL.FLOAT, 24, vertices);
      gl.colorPointer(3, GL.FLOAT, 24, vertices + 12n);
      checkError();
    },

    /**
     * Draw the original cube with its original per-axis angular velocities.
     * @param {number} elapsed Seconds since the scene started.
     */
    draw(elapsed) {
      gl.clear(GL.COLOR_BUFFER_BIT + GL.DEPTH_BUFFER_BIT);
      gl.matrixMode(GL.MODELVIEW);
      gl.loadIdentity();
      gl.translate(0, 0, -200);
      gl.rotate(elapsed * 10, 1, 0, 0);
      gl.rotate(elapsed * 6, 0, 1, 0);
      gl.rotate(elapsed * 18, 0, 0, 1);
      gl.drawArrays(GL.TRIANGLES, 0, 36);
      checkError();
    },

    /** Release the shared vertex storage after the GL contexts are closed. */
    dispose() {
      koffi.free(vertices);
    },
  };
};
