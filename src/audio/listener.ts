import { audioNative } from '../internal/audio-native';
import { Vector3f } from '../system/vector3';
import { radians } from '../system/angle';
import type { ReadonlyValue as R } from '../internal/value-storage';
import { Cone, type ConeInput, float, vector, angle } from './value';

export { Cone } from './value';
let state: { handle: ReturnType<typeof audioNative.createAudioListener>['handle'];
  values: Float32Array } | undefined;

function listener() {
  if (!state) {
    const mapping = audioNative.createAudioListener();
    state = { handle: mapping.handle, values: new Float32Array(mapping.buffer) };
  }
  return state;
}
function getVector(field: number): Vector3f {
  const { handle, values } = listener();
  audioNative.audioListenerField(handle, field, false);
  return new Vector3f(values[field], values[field + 1], values[field + 2]);
}
function setVector(field: number, value: R<Vector3f>): void {
  vector(value);
  const { handle, values } = listener();
  values[field] = value.x;
  values[field + 1] = value.y;
  values[field + 2] = value.z;
  audioNative.audioListenerField(handle, field, true);
}
/** 设置所有声源的总音量百分比，0 静音、100 为原始音量。 */
export function setGlobalVolume(value: number): void {
  const { handle, values } = listener();
  values[0] = float(value);
  audioNative.audioListenerField(handle, 0, true);
}
/** 返回总音量百分比。 */
export function getGlobalVolume(): number {
  const { handle, values } = listener();
  audioNative.audioListenerField(handle, 0, false);
  return values[0];
}
/** 返回监听者的三维位置副本。 */
export function getPosition(): Vector3f { return getVector(1); }
/** 设置监听者的世界坐标位置。 */
export function setPosition(value: R<Vector3f>): void { setVector(1, value); }
/** 返回监听者的朝向副本。 */
export function getDirection(): Vector3f { return getVector(4); }
/** 设置监听者的正前方方向。 */
export function setDirection(value: R<Vector3f>): void { setVector(4, value); }
/** 返回监听者的速度副本。 */
export function getVelocity(): Vector3f { return getVector(7); }
/** 设置监听者的速度，用于多普勒效应，单位为位置单位/秒。 */
export function setVelocity(value: R<Vector3f>): void { setVector(7, value); }
/** 返回监听者上方方向的副本。 */
export function getUpVector(): Vector3f { return getVector(10); }
/** 设置监听者上方方向，与正前方方向共同决定空间朝向。 */
export function setUpVector(value: R<Vector3f>): void { setVector(10, value); }
/** 复制方向锥参数并更新原生监听者。 */
export function setCone(value: Readonly<ConeInput>): void {
  const inner = angle(value.innerAngle);
  const outer = angle(value.outerAngle);
  const gain = float(value.outerGain);
  const { handle, values } = listener();
  values.set([ inner, outer, gain ], 13);
  audioNative.audioListenerField(handle, 13, true);
}
/** 返回监听者方向锥参数副本。 */
export function getCone(): Cone {
  const { handle, values } = listener();
  audioNative.audioListenerField(handle, 13, false);
  return new Cone({ innerAngle: radians(values[13]), outerAngle: radians(values[14]),
    outerGain: values[15] });
}
