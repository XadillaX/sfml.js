import {
  RenderWindow, RenderTarget, Window, VideoMode, Vector2u, Vector2i, Vector2f,
  Texture, Image, Color, Sprite, Vertex, VertexArray, VertexBuffer, PrimitiveType,
  View, Shader, RenderStates, Cursor, Mouse, State, milliseconds,
} from '../src';

const window = new RenderWindow(new VideoMode(new Vector2u(320, 240)), 'Test', {
  state: State.Windowed, settings: { stencilBits: 8 },
});
const asWindow: Window = window;
const asTarget: RenderTarget = window;
const copy = new RenderWindow(window.getNativeHandle(), { depthBits: 24 });
copy.create(new Vector2u(100, 100), 'Recreated');
copy.create(window.getNativeHandle());
window.setSize(new Vector2u(200, 200));
window.setPosition(new Vector2i(20, 20));
window.setMinimumSize(undefined);
window.setIcon(new Image(new Vector2u(1, 1), Color.Red));
window.setIcon(new Vector2u(1, 1), new Uint8Array(4));
window.setMouseCursor(new Cursor(Cursor.Type.Arrow));
window.setView(new View());
window.mapPixelToCoords(new Vector2i());
window.mapCoordsToPixel(new Vector2f());
window.clear(Color.Black, 0);
window.clearStencil(0);
window.draw(new Sprite(new Texture(new Vector2u(1, 1))));
window.draw(new VertexArray());
window.draw(new VertexBuffer(), 0, 1, new RenderStates());
window.draw([ new Vertex() ], PrimitiveType.Points, new Shader());
new Texture(window.getSize()).update(window);
Mouse.getPosition(window);
Mouse.setPosition(new Vector2i(), window);
window.pollEvent();
window.waitEvent(milliseconds(1));
window.handleEvents({ Closed: () => window.close() });
window.setActive();
window.pushGLStates();
window.popGLStates();
window.resetGLStates();
window.display();
window.close();

// @ts-expect-error native handles must retain integer precision
new RenderWindow(123);
// @ts-expect-error window size uses unsigned coordinates
window.setSize(new Vector2i());
// @ts-expect-error pixel icons require the bytes argument
window.setIcon(new Vector2u(1, 1));
// @ts-expect-error a window does not own a texture view
window.getTexture();

void [ asWindow, asTarget ];
