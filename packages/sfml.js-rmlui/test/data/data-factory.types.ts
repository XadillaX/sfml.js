import {
  Context, DataView, DataController, DataViewInstancer,
  DataControllerInstancer, Factory, DataModelConstructor,
  type DataViewCallbacks, type DataControllerCallbacks,
  type DataBindingInitialize, type DataBindingRelease, Element,
} from '../../src';

declare const element: Element;
declare const context: Context;
declare const model: DataModelConstructor;

const initialize: DataBindingInitialize =
  (current, attached, expression, modifier) => {
    const value: DataModelConstructor = current;
    const target: Element = attached;
    const source: string = expression;
    const suffix: string = modifier;
    return value.isValid && target.id === source + suffix;
  };
const release: DataBindingRelease = () => {};
const callbacks: DataViewCallbacks = {
  initialize, update: current => current.isValid,
  getVariableNameList: () => [ 'value' ], release,
};
const view = new DataView(element, callbacks, -20);
const controllerCallbacks: DataControllerCallbacks = { initialize, release };
const controller = new DataController(element, controllerCallbacks);
const viewInstancer = new DataViewInstancer(target =>
  new DataView(target, callbacks));
const controllerInstancer = new DataControllerInstancer(target =>
  new DataController(target, controllerCallbacks));
Factory.registerDataViewInstancer(viewInstancer, 'host');
Factory.registerDataViewInstancer(viewInstancer, 'structural', true);
Factory.registerDataControllerInstancer(controllerInstancer, 'host');
const borrowedView: DataView | null = Factory.instanceDataView('host', element);
const borrowedController: DataController | null =
  Factory.instanceDataController('host', element);
const directView: DataView | null = viewInstancer.instanceView(element);
const directController: DataController | null =
  controllerInstancer.instanceController(element);
const target: Element | null = view.getElement();
const controllerTarget: Element | null = controller.getElement();
const order: number = view.sortOrder;
const validity: boolean = view.isValid && controller.isValid;
const names: string[] = view.getVariableNameList();
const initialized: boolean = view.initialize(model, element, 'value', '');
const changed: boolean = view.update(model);
controller.initialize(model, element, 'value', '');
view.release();
controller.release();
context.update();
void [ borrowedView, borrowedController, directView, directController,
  target, controllerTarget, order, validity, names, initialized, changed ];

// @ts-expect-error A view initializer must return the native boolean.
new DataView(element, { ...callbacks, initialize: () => 'true' });
// @ts-expect-error A view updater must return the native change boolean.
new DataView(element, { ...callbacks, update: () => undefined });
// @ts-expect-error Dependencies contain root names, not numeric addresses.
new DataView(element, { ...callbacks, getVariableNameList: () => [ 1 ] });
// @ts-expect-error Instancers return genuine views or null.
new DataViewInstancer(() => undefined);
// @ts-expect-error Controllers and views have distinct public contracts.
new DataViewInstancer(() => controller);
// @ts-expect-error View registrations require native instancers.
Factory.registerDataViewInstancer(view, 'host');
// @ts-expect-error Manual updates require a checked model constructor facade.
view.update(model.getModelHandle());
