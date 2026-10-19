'use strict';

const koffi = require('koffi');

/**
 * Bind desktop OpenGL and retain the original textured cube in native memory.
 * @return {object} Scene initialization, projection, drawing and cleanup.
 */
module.exports = function createCube() {
  const path = {
    darwin: '/System/Library/Frameworks/OpenGL.framework/OpenGL',
    linux: 'libGL.so.1',
    win32: 'opengl32.dll',
  }[process.platform];
  if (!path) throw new Error('This example requires desktop OpenGL.');
  const library = koffi.load(path);

  /**
   * Bind a core GL export with the platform's desktop ABI.
   * @param {string} name Entry point.
   * @param {string} result Return type.
   * @param {string[]} args Parameter types.
   * @return {Function} Synchronous native call.
   */
  function bind(name, result, args) {
    return library.func('__stdcall', name, result, args);
  }

  const gl = {
    enable: bind('glEnable', 'void', [ 'uint' ]),
    disable: bind('glDisable', 'void', [ 'uint' ]),
    depthMask: bind('glDepthMask', 'void', [ 'uint8_t' ]),
    clearDepth: bind('glClearDepth', 'void', [ 'double' ]),
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
    texCoordPointer: bind('glTexCoordPointer', 'void', [
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
    DEPTH_BUFFER_BIT: 0x0100,
  };

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
  // GL keeps these pointers across FFI calls and asynchronous rendering turns.
  const vertices = koffi.alloc('float', cube.length);
  new Float32Array(koffi.view(vertices, cube.byteLength)).set(cube);

  /** Surface GL failures through the caller's finally cleanup. */
  function checkError() {
    const error = gl.getError();
    if (error) throw new Error(`OpenGL error: 0x${error.toString(16)}`);
  }

  return {
    /** Set up depth testing and interleaved position/UV arrays. */
    initialize() {
      gl.enable(GL.DEPTH_TEST);
      gl.depthMask(1);
      gl.clearDepth(1);
      gl.disable(GL.LIGHTING);
      gl.enable(GL.TEXTURE_2D);
      gl.enableClientState(GL.VERTEX_ARRAY);
      gl.enableClientState(GL.TEXTURE_COORD_ARRAY);
      gl.vertexPointer(3, GL.FLOAT, 20, vertices);
      gl.texCoordPointer(2, GL.FLOAT, 20, vertices + 12n);
      gl.disableClientState(GL.NORMAL_ARRAY);
      gl.disableClientState(GL.COLOR_ARRAY);
      checkError();
    },

    /**
     * Preserve the original vertical field of view when resizing.
     * @param {sf.Vector2u} size Client-area dimensions.
     */
    resize(size) {
      gl.viewport(0, 0, size.x, size.y);
      if (!size.x || !size.y) return;
      gl.matrixMode(GL.PROJECTION);
      gl.loadIdentity();
      const ratio = size.x / size.y;
      gl.frustum(-ratio, ratio, -1, 1, 1, 500);
      checkError();
    },

    /**
     * Draw the rotating cube above the existing SFML background.
     * @param {number} elapsed Seconds since window creation.
     * @param {sf.Vector2i} mouse Window-relative cursor position.
     * @param {sf.Vector2u} size Current client-area dimensions.
     */
    draw(elapsed, mouse, size) {
      gl.clear(GL.DEPTH_BUFFER_BIT);
      gl.matrixMode(GL.MODELVIEW);
      gl.loadIdentity();
      gl.translate(mouse.x * 200 / size.x - 100,
        -mouse.y * 200 / size.y + 100, -100);
      gl.rotate(elapsed * 50, 1, 0, 0);
      gl.rotate(elapsed * 30, 0, 1, 0);
      gl.rotate(elapsed * 90, 0, 0, 1);
      gl.drawArrays(GL.TRIANGLES, 0, 36);
      checkError();
    },

    /** Release retained vertex memory after the window context is closed. */
    dispose() {
      koffi.free(vertices);
    },
  };
};
