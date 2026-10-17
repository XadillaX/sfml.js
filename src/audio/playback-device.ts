import { audioNative } from '../internal/audio-native';

/**
 * Lifecycle notifications for the audio playback device.
 * @zh 音频播放设备的生命周期通知。
 * @ja 音声再生デバイスのライフサイクル通知。
 * @ko 오디오 재생 장치의 수명 주기 알림입니다.
 */
export enum Notification {
  /**
   * The device started.
   * @zh 设备开始运行。
   * @ja デバイスが動作を開始しました。
   * @ko 장치가 작동을 시작했습니다.
   */
  DeviceStarted,
  /**
   * The device stopped.
   * @zh 设备停止运行。
   * @ja デバイスが停止しました。
   * @ko 장치가 작동을 중지했습니다.
   */
  DeviceStopped,
  /**
   * The audio output route changed.
   * @zh 音频输出路由发生变化。
   * @ja 音声出力の経路が変わりました。
   * @ko 오디오 출력 경로가 변경되었습니다.
   */
  DeviceRerouted,
  /**
   * A system interruption began.
   * @zh 系统中断开始。
   * @ja システムによる割り込みが始まりました。
   * @ko 시스템 인터럽트가 시작되었습니다.
   */
  DeviceInterruptionBegan,
  /**
   * A system interruption ended.
   * @zh 系统中断结束。
   * @ja システムによる割り込みが終了しました。
   * @ko 시스템 인터럽트가 끝났습니다.
   */
  DeviceInterruptionEnded,
  /**
   * The device was unlocked.
   * @zh 设备解除锁定。
   * @ja デバイスのロックが解除されました。
   * @ko 장치 잠금이 해제되었습니다.
   */
  DeviceUnlocked,
}
/**
 * Callback receiving playback device status notifications.
 * @zh 接收播放设备状态通知的回调。
 * @ja 再生デバイスの状態通知を受け取るコールバック。
 * @ko 재생 장치 상태 알림을 받는 콜백입니다.
 */
export type NotificationCallback = (notification: Notification) => void;
let state: ReturnType<typeof audioNative.createAudioDeviceState> | undefined;
let values: Uint32Array;

function command(id: number, name?: string) {
  if (!state) {
    state = audioNative.createAudioDeviceState();
    values = new Uint32Array(state.buffer);
  }
  return audioNative.audioDevice(state.handle, id, name);
}
/**
 * Return the names of available playback devices.
 * @zh 返回可用播放设备名称。
 * @ja 利用可能な再生デバイスの名前を返します。
 * @ko 사용 가능한 재생 장치 이름을 반환합니다.
 */
export function getAvailableDevices(): string[] { return command(0) as string[]; }
/**
 * Return the system's default playback device name,
 * or undefined if unavailable.
 * @zh 返回系统默认播放设备名称；不可用时为 undefined。
 * @ja システムの既定の再生デバイス名を返します。利用不可なら undefined。
 * @ko 시스템 기본 재생 장치 이름을 반환합니다. 사용할 수 없으면 undefined입니다.
 */
export function getDefaultDevice(): string | undefined {
  return command(1) as string | undefined;
}
/**
 * Switch to the named playback device and return whether it succeeded.
 * @zh 切换到指定名称的播放设备，返回是否成功。
 * @ja 指定名の再生デバイスに切り替え、成功したかどうかを返します。
 * @ko 지정한 이름의 재생 장치로 전환하고 성공 여부를 반환합니다.
 */
export function setDevice(name: string): boolean {
  command(2, name); return values[3] !== 0;
}
/**
 * Switch to the system's default playback device and report success.
 * @zh 切换到系统默认播放设备，返回是否成功。
 * @ja システムの既定の再生デバイスに切り替え、成功したかどうかを返します。
 * @ko 시스템 기본 재생 장치로 전환하고 성공 여부를 반환합니다.
 */
export function setDeviceToDefault(): boolean {
  command(3); return values[3] !== 0;
}
/**
 * Switch to a null device with no sound output and return whether it succeeded.
 * @zh 切换到不输出声音的空设备，返回是否成功。
 * @ja 音を出力しないヌルデバイスに切り替え、成功したかどうかを返します。
 * @ko 소리를 출력하지 않는 널 장치로 전환하고 성공 여부를 반환합니다.
 */
export function setDeviceToNull(): boolean { command(4); return values[3] !== 0; }
/**
 * Return the current playback device name, or undefined if unavailable.
 * @zh 返回当前播放设备名称；不可用时为 undefined。
 * @ja 現在の再生デバイス名を返します。利用不可なら undefined。
 * @ko 현재 재생 장치 이름을 반환합니다. 사용할 수 없으면 undefined입니다.
 */
export function getDevice(): string | undefined {
  return command(5) as string | undefined;
}
/**
 * Return the current device sample rate in Hz, or undefined if unavailable.
 * @zh 返回当前设备采样率（Hz）；不可用时为 undefined。
 * @ja 現在のデバイスのサンプルレートを Hz で返します。利用不可なら undefined。
 * @ko 현재 장치의 샘플 레이트를 Hz로 반환합니다. 사용할 수 없으면 undefined입니다.
 */
export function getDeviceSampleRate(): number | undefined {
  command(6); return values[1] ? values[0] : undefined;
}
/**
 * Return whether the current device follows the system default.
 * @zh 返回当前设备是否跟随系统默认设备。
 * @ja 現在のデバイスがシステムの既定デバイスに追従するかどうかを返します。
 * @ko 현재 장치가 시스템 기본 장치를 따르는지 반환합니다.
 */
export function isDefaultDevice(): boolean { command(7); return values[2] !== 0; }
/**
 * Set the device notification callback; undefined or null removes it.
 * @zh 设置设备通知回调；undefined 或 null 移除回调。
 * @ja デバイス通知のコールバックを設定します。undefined または null で解除します。
 * @ko 장치 알림 콜백을 설정합니다. undefined 또는 null은 콜백을 제거합니다.
 */
export function setNotificationCallback(callback?: NotificationCallback | null): void {
  audioNative.audioDeviceNotifications(callback);
}
