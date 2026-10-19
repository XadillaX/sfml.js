'use strict';

const koffi = require('koffi');

/**
 * Bind desktop OpenGL on the active SFML window's native thread.
 * @param {Float32Array} cube Interleaved xyz positions and RGBA colors.
 * @return {object} Scene setup, resize, drawing and vertex storage cleanup.
 */
module.exports = function createScene(cube) {
  const libraries = {
    darwin: '/System/Library/Frameworks/OpenGL.framework/OpenGL',
    linux: 'libGL.so.1',
    win32: 'opengl32.dll',
  };
  const path = libraries[process.platform];
  if (!path) throw new Error('This example requires desktop OpenGL.');
  const library = koffi.load(path);

  /**
   * Bind a core OpenGL export with the platform's desktop GL ABI.
   * @param {string} name GL entry point name.
   * @param {string} result C return type.
   * @param {string[]} args C parameter types.
   * @return {Function} Synchronous native call.
   */
  function bind(name, result, args) {
    return library.func('__stdcall', name, result, args);
  }

  const gl = {
    clearDepth: bind('glClearDepth', 'void', [ 'double' ]),
    clearColor: bind('glClearColor', 'void', [
      'float', 'float', 'float', 'float',
    ]),
    enable: bind('glEnable', 'void', [ 'uint' ]),
    disable: bind('glDisable', 'void', [ 'uint' ]),
    depthMask: bind('glDepthMask', 'void', [ 'uint8_t' ]),
    viewport: bind('glViewport', 'void', [ 'int', 'int', 'int', 'int' ]),
    matrixMode: bind('glMatrixMode', 'void', [ 'uint' ]),
    loadIdentity: bind('glLoadIdentity', 'void', []),
    frustum: bind('glFrustum', 'void', [
      'double', 'double', 'double', 'double', 'double', 'double',
    ]),
    enableClientState: bind('glEnableClientState', 'void', [ 'uint' ]),
    disableClientState: bind('glDisableClientState', 'void', [ 'uint' ]),
    vertexPointer: bind('glVertexPointer', 'void', [
      'int', 'uint', 'int', 'const void *',
    ]),
    colorPointer: bind('glColorPointer', 'void', [
      'int', 'uint', 'int', 'const void *',
    ]),
    clear: bind('glClear', 'void', [ 'uint' ]),
    translate: bind('glTranslatef', 'void', [ 'float', 'float', 'float' ]),
    rotate: bind('glRotatef', 'void', [ 'float', 'float', 'float', 'float' ]),
    drawArrays: bind('glDrawArrays', 'void', [ 'uint', 'int', 'int' ]),
    getError: bind('glGetError', 'uint', []),
  };
  const GL = {
    DEPTH_TEST: 0x0b71,
    LIGHTING: 0x0b50,
    TEXTURE_2D: 0x0de1,
    PROJECTION: 0x1701,
    MODELVIEW: 0x1700,
    VERTEX_ARRAY: 0x8074,
    COLOR_ARRAY: 0x8076,
    NORMAL_ARRAY: 0x8075,
    TEXTURE_COORD_ARRAY: 0x8078,
    FLOAT: 0x1406,
    TRIANGLES: 0x0004,
    COLOR_BUFFER_BIT: 0x4000,
    DEPTH_BUFFER_BIT: 0x0100,
  };

  // GL retains these pointers after the FFI call. Keep native storage alive
  // until the window's GL context has been closed.
  const vertices = koffi.alloc('float', cube.length);
  new Float32Array(koffi.view(vertices, cube.byteLength)).set(cube);
  let drawable = false;

  /** Surface GL failures through the example's normal cleanup path. */
  function checkError() {
    const error = gl.getError();
    if (error) throw new Error(`OpenGL error: 0x${error.toString(16)}`);
  }

  return {
    /** Configure depth testing and the original vertex/color arrays. */
    initialize() {
      gl.clearDepth(1);
      gl.clearColor(0, 0, 0, 1);
      gl.enable(GL.DEPTH_TEST);
      gl.depthMask(1);
      gl.disable(GL.LIGHTING);
      gl.disable(GL.TEXTURE_2D);
      gl.enableClientState(GL.VERTEX_ARRAY);
      gl.enableClientState(GL.COLOR_ARRAY);
      gl.vertexPointer(3, GL.FLOAT, 28, vertices);
      gl.colorPointer(4, GL.FLOAT, 28, vertices + 12n);
      gl.disableClientState(GL.NORMAL_ARRAY);
      gl.disableClientState(GL.TEXTURE_COORD_ARRAY);
      checkError();
    },

    /**
     * Preserve the vertical field of view as the window changes aspect ratio.
     * @param {object} size Current client-area pixel dimensions.
     */
    resize(size) {
      drawable = size.x > 0 && size.y > 0;
      gl.viewport(0, 0, size.x, size.y);
      if (!drawable) return;

      gl.matrixMode(GL.PROJECTION);
      gl.loadIdentity();
      const ratio = size.x / size.y;
      gl.frustum(-ratio, ratio, -1, 1, 1, 500);
      checkError();
    },

    /**
     * Render the six-colored cube at its original angular velocities.
     * @param {number} elapsed Seconds since the scene started.
     * @return {boolean} Whether a frame was rendered.
     */
    draw(elapsed) {
      if (!drawable) return false;
      gl.clear(GL.COLOR_BUFFER_BIT + GL.DEPTH_BUFFER_BIT);
      gl.matrixMode(GL.MODELVIEW);
      gl.loadIdentity();
      gl.translate(0, 0, -200);
      gl.rotate(elapsed * 50, 1, 0, 0);
      gl.rotate(elapsed * 30, 0, 1, 0);
      gl.rotate(elapsed * 90, 0, 0, 1);
      gl.drawArrays(GL.TRIANGLES, 0, 36);
      checkError();
      return true;
    },

    /** Release the vertex storage after closing the GL context. */
    dispose() {
      koffi.free(vertices);
    },
  };
};
