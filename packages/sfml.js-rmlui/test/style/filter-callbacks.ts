import {
  Filter, CompiledFilter, FilterInstancer, type FilterCallbacks,
} from '../../dist';

const callbacks: FilterCallbacks = {
  compileFilter: element => element.getRenderManager()!.compileFilter(
    'blur', { sigma: 2 }),
  extendInkOverflow: (_element, rectangle) => {
    rectangle.p0.x -= 2;
    return rectangle;
  },
};
const filter = new Filter(callbacks);
FilterInstancer.register('custom', new FilterInstancer(() => filter));
new Filter({ compileFilter: () => new CompiledFilter() });
// @ts-expect-error A compilation callback is required.
new Filter({});
// @ts-expect-error Compilation must return a synchronous owned resource.
new Filter({ compileFilter: async () => new CompiledFilter() });
// @ts-expect-error Overflow callbacks return a rectangle.
new Filter({ ...callbacks, extendInkOverflow: () => undefined });
