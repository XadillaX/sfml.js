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
/**
 * Set the global volume percentage for all sources;
 * 0 is silent and 100 is the original volume.
 * @zh 设置所有声源的总音量百分比，0 静音、100 为原始音量。
 * @ja 全音源の全体音量を百分率で設定します。0 は無音、100 は元の音量です。
 * @ko 모든 음원의 전체 볼륨을 백분율로 설정합니다. 0은 무음, 100은 원래 볼륨입니다.
 */
export function setGlobalVolume(value: number): void {
  const { handle, values } = listener();
  values[0] = float(value);
  audioNative.audioListenerField(handle, 0, true);
}
/**
 * Return the global volume percentage.
 * @zh 返回总音量百分比。
 * @ja 全体音量の百分率を返します。
 * @ko 전체 볼륨 백분율을 반환합니다.
 */
export function getGlobalVolume(): number {
  const { handle, values } = listener();
  audioNative.audioListenerField(handle, 0, false);
  return values[0];
}
/**
 * Return a copy of the listener's 3D position.
 * @zh 返回监听者的三维位置副本。
 * @ja リスナーの 3D 位置のコピーを返します。
 * @ko 리스너의 3차원 위치 복사본을 반환합니다.
 */
export function getPosition(): Vector3f { return getVector(1); }
/**
 * Set the listener's position in world coordinates.
 * @zh 设置监听者的世界坐标位置。
 * @ja リスナーのワールド座標での位置を設定します。
 * @ko 리스너의 월드 좌표 위치를 설정합니다.
 */
export function setPosition(value: R<Vector3f>): void { setVector(1, value); }
/**
 * Return a copy of the listener's facing direction.
 * @zh 返回监听者的朝向副本。
 * @ja リスナーの向きのコピーを返します。
 * @ko 리스너가 향하는 방향의 복사본을 반환합니다.
 */
export function getDirection(): Vector3f { return getVector(4); }
/**
 * Set the listener's forward direction.
 * @zh 设置监听者的正前方方向。
 * @ja リスナーの前方方向を設定します。
 * @ko 리스너의 정면 방향을 설정합니다.
 */
export function setDirection(value: R<Vector3f>): void { setVector(4, value); }
/**
 * Return a copy of the listener's velocity.
 * @zh 返回监听者的速度副本。
 * @ja リスナーの速度のコピーを返します。
 * @ko 리스너 속도의 복사본을 반환합니다.
 */
export function getVelocity(): Vector3f { return getVector(7); }
/**
 * Set the listener's velocity for the Doppler effect, in position units/second.
 * @zh 设置监听者的速度，用于多普勒效应，单位为位置单位/秒。
 * @ja ドップラー効果用のリスナー速度を設定します。単位は位置単位/秒です。
 * @ko 도플러 효과에 사용할 리스너 속도를 설정합니다. 단위는 위치 단위/초입니다.
 */
export function setVelocity(value: R<Vector3f>): void { setVector(7, value); }
/**
 * Return a copy of the listener's up direction.
 * @zh 返回监听者上方方向的副本。
 * @ja リスナーの上方向のコピーを返します。
 * @ko 리스너 위쪽 방향의 복사본을 반환합니다.
 */
export function getUpVector(): Vector3f { return getVector(10); }
/**
 * Set the listener's up direction, which defines orientation together with the
 * forward direction.
 * @zh 设置监听者上方方向，与正前方方向共同决定空间朝向。
 * @ja リスナーの上方向を設定します。前方方向とともに空間内の向きを決めます。
 * @ko 리스너의 위쪽 방향을 설정합니다. 정면 방향과 함께 공간상의 방향을 결정합니다.
 */
export function setUpVector(value: R<Vector3f>): void { setVector(10, value); }
/**
 * Copy directional cone parameters and update the native listener.
 * @zh 复制方向锥参数并更新原生监听者。
 * @ja 指向性コーンのパラメーターをコピーし、ネイティブリスナーを更新します。
 * @ko 지향성 원뿔 매개변수를 복사하고 네이티브 리스너를 갱신합니다.
 */
export function setCone(value: Readonly<ConeInput>): void {
  const inner = angle(value.innerAngle);
  const outer = angle(value.outerAngle);
  const gain = float(value.outerGain);
  const { handle, values } = listener();
  values.set([ inner, outer, gain ], 13);
  audioNative.audioListenerField(handle, 13, true);
}
/**
 * Return a copy of the listener's directional cone parameters.
 * @zh 返回监听者方向锥参数副本。
 * @ja リスナーの指向性コーンのパラメーターのコピーを返します。
 * @ko 리스너의 지향성 원뿔 매개변수 복사본을 반환합니다.
 */
export function getCone(): Cone {
  const { handle, values } = listener();
  audioNative.audioListenerField(handle, 13, false);
  return new Cone({ innerAngle: radians(values[13]), outerAngle: radians(values[14]),
    outerGain: values[15] });
}
