import {
  ContextInstancer, Context, Factory, RenderManager, TextInputHandler,
  type ContextInstanceCallback, type ContextReleaseCallback,
} from '../../src';

declare const context: Context;
declare const manager: RenderManager;
declare const handler: TextInputHandler | null;
const allocator = new ContextInstancer();
const constructed = new Context('native', manager, handler);
const input: TextInputHandler | null = context.getTextInputHandler();
const create: ContextInstanceCallback = (name, renderer, input) =>
  allocator.instanceContext(name, renderer, input);
const release: ContextReleaseCallback = snapshot => {
  const name: string = snapshot.name;
  void name;
};
const adapter = new ContextInstancer(create, release);
Factory.registerContextInstancer(adapter);
const owned: Context | null =
  Factory.instanceContext('owned', manager, handler);
const direct: Context | null =
  adapter.instanceContext('direct', manager, handler);
if (direct) {
  adapter.releaseContext(direct);
}

// @ts-expect-error Factory cannot register a null context allocator.
Factory.registerContextInstancer(null);
// @ts-expect-error Direct construction requires the explicit input handler.
new Context('native', manager);
// @ts-expect-error Direct construction requires a native manager.
new Context('native', context, handler);
// @ts-expect-error Context creation needs a native render manager.
Factory.instanceContext('owned', context, null);
// @ts-expect-error Input handlers are typed native capabilities.
allocator.instanceContext('owned', manager, {});
// @ts-expect-error A creation callback returns a native owned context.
new ContextInstancer(() => ({}));
// @ts-expect-error Native allocation may fail.
const required: Context = Factory.instanceContext('owned', manager, null);
const inputHandler = new TextInputHandler();
// @ts-expect-error Handler customization requires functions.
new TextInputHandler({ onActivate: 12 });
void inputHandler;
void [ owned, required, constructed, input ];
