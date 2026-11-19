import {
  CompiledFilter, CompiledShader, FilterHandleList, RenderManager,
  FilterInstancer, PropertyDictionary, getRenderInterface,
  type Context, type Element, type RenderParameters,
} from '../../dist';

declare const context: Context;
declare const element: Element;
const manager: RenderManager = context.getRenderManager();
const optional: RenderManager | null = element.getRenderManager();
const parameters: RenderParameters = { sigma: 2 };
const filter: CompiledFilter = manager.compileFilter('blur', parameters);
const shader: CompiledShader = new RenderManager(getRenderInterface()!)
  .compileShader('shader', { vertex_shader: 'source' });
const list = new FilterHandleList();
filter.addHandleTo(list);
const count: number = list.size;
const valid: boolean = filter.isValid;
const invalid: 0n = CompiledFilter.invalidHandle();
const shaderInvalid: 0n = CompiledShader.invalidHandle();
const definition = FilterInstancer.get('blur')!;
const properties = new PropertyDictionary();
definition.getPropertySpecification().setPropertyDefaults(properties);
definition.instanceFilter('blur', properties)!.compileFilter(element).release();
shader.release();
list.clear();
new CompiledFilter().release();
new CompiledShader().release();
// @ts-expect-error The interface must be a checked native renderer.
new RenderManager({});
// @ts-expect-error Compiled shaders cannot occupy compiled filter lists.
shader.addHandleTo(list);
// @ts-expect-error A JS array is not a native filter list.
filter.addHandleTo([]);
// @ts-expect-error Opaque resources have distinct native types.
const wrong: CompiledFilter = shader;
// @ts-expect-error Elements are not render parameter values.
manager.compileFilter('blur', { element });
void [ optional, count, valid, invalid, shaderInvalid, wrong ];
