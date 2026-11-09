'use strict';

/**
 * Test-only preload for headless X servers.
 *
 * SFML keeps one X11 Display per process through a weak singleton; when the
 * last GL context is destroyed, the Display is closed. These suites create
 * and drop many RenderTextures with no persistent window, so under GC the
 * Display can be closed and immediately reopened. Xvfb's GLX still holds the
 * old connection's drawables at that point and replies BadAccess to
 * glXMakeContextCurrent on the new connection. Holding one Context for the
 * lifetime of the process keeps the Display (and a valid GL context) open.
 */

const sf = require('..');

global.__sfmlKeepaliveGlContext = new sf.Context();
