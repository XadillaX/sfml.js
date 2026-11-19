import {
  Decorator, type DecoratorCallbacks, type DecoratorData, type Element,
  type RenderManager, type Texture, type BoxArea, DecoratorInstancer,
} from '../../src';

declare const element: Element;
declare const manager: RenderManager;
declare const texture: Texture;

interface Data {
  serial: number;
}

const callbacks: DecoratorCallbacks<Data> = {
  generateElementData(target, area) {
    const value: BoxArea = area;
    const original: Element = target;
    void value;
    void original;
    return { serial: 1 };
  },
  renderElement(_target, data) {
    const serial: number = data.serial;
    void serial;
    // @ts-expect-error Callback data retains its declared shape.
    data.missing = true;
  },
  releaseElementData(data) {
    data.serial = 0;
  },
};

const custom = new Decorator(manager, callbacks);
const erased: Decorator = custom;
new DecoratorInstancer(() => custom);
const data: DecoratorData | null = custom.generateElementData(element);
if (data) {
  custom.renderElement(element, data);
  custom.releaseElementData(data);
}
const index: number = custom.addTexture(texture);
const count: number = custom.getNumTextures();
const first: Texture = custom.getTexture();
void erased;
void index;
void count;
void first;
// @ts-expect-error All native virtual methods require implementations.
new Decorator(manager, { generateElementData: () => ({}) });
// @ts-expect-error Callback data must be an object, not a native pointer.
new Decorator<number>(manager, callbacks);
