import { audioNative } from '../internal/audio-native';

/** 音频播放设备的生命周期通知。 */
export enum Notification {
  /** 设备开始运行。 */
  DeviceStarted,
  /** 设备停止运行。 */
  DeviceStopped,
  /** 音频输出路由发生变化。 */
  DeviceRerouted,
  /** 系统中断开始。 */
  DeviceInterruptionBegan,
  /** 系统中断结束。 */
  DeviceInterruptionEnded,
  /** 设备解除锁定。 */
  DeviceUnlocked,
}
/** 接收播放设备状态通知的回调。 */
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
/** 返回可用播放设备名称。 */
export function getAvailableDevices(): string[] { return command(0) as string[]; }
/** 返回系统默认播放设备名称；不可用时为 undefined。 */
export function getDefaultDevice(): string | undefined {
  return command(1) as string | undefined;
}
/** 切换到指定名称的播放设备，返回是否成功。 */
export function setDevice(name: string): boolean {
  command(2, name); return values[3] !== 0;
}
/** 切换到系统默认播放设备，返回是否成功。 */
export function setDeviceToDefault(): boolean {
  command(3); return values[3] !== 0;
}
/** 切换到不输出声音的空设备，返回是否成功。 */
export function setDeviceToNull(): boolean { command(4); return values[3] !== 0; }
/** 返回当前播放设备名称；不可用时为 undefined。 */
export function getDevice(): string | undefined {
  return command(5) as string | undefined;
}
/** 返回当前设备采样率（Hz）；不可用时为 undefined。 */
export function getDeviceSampleRate(): number | undefined {
  command(6); return values[1] ? values[0] : undefined;
}
/** 返回当前设备是否跟随系统默认设备。 */
export function isDefaultDevice(): boolean { command(7); return values[2] !== 0; }
/** 设置设备通知回调；undefined 或 null 移除回调。 */
export function setNotificationCallback(callback?: NotificationCallback | null): void {
  audioNative.audioDeviceNotifications(callback);
}
