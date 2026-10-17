import {
  audioNative, audioHandle, type AudioHandle, type AudioSourceMapping,
} from '../internal/audio-native';
import { Vector3f } from '../system/vector3';
import { radians } from '../system/angle';
import { Time } from '../system/time';
import { EffectProcessor } from './effect-processor';
import type { ReadonlyValue as R } from '../internal/value-storage';
import {
  Cone, type ConeInput, SoundStatus, float, flag, vector, angle, duration,
} from './value';

/**
 * Shared control/result fields; every engine operation still executes in SFML.
 * @zh 共享控制和结果字段；所有引擎操作仍在 SFML 中执行。
 * @ja 共有の制御・結果フィールド。エンジン操作はすべて SFML で実行されます。
 * @ko 공유 제어 및 결과 필드이며, 모든 엔진 작업은 여전히 SFML에서 실행됩니다.
 */
export abstract class SoundSource {
  /**
   * Playback status enumeration.
   * @zh 播放状态枚举。
   * @ja 再生状態の列挙型。
   * @ko 재생 상태 열거형입니다.
   */
  static readonly Status = SoundStatus;
  /**
   * Directional cone configuration type.
   * @zh 方向锥配置类型。
   * @ja 指向性コーンの設定型。
   * @ko 지향성 원뿔 설정 타입입니다.
   */
  static readonly Cone = Cone;
  readonly [audioHandle]: AudioHandle<'source'>;
  protected readonly values: Float32Array;
  protected readonly times: BigInt64Array;
  private effect?: EffectProcessor;

  protected constructor(mapping: AudioSourceMapping) {
    this[audioHandle] = mapping.handle;
    this.values = new Float32Array(mapping.values);
    this.times = new BigInt64Array(mapping.times);
  }
  /**
   * Copy source attributes, retaining this source's content and playback.
   * @zh 复制声源属性，保留当前声源的内容和播放状态。
   * @ja 音源の属性をコピーし、この音源の内容と再生状態を保持します。
   * @ko 음원 속성을 복사하며 현재 음원의 콘텐츠와 재생 상태를 유지합니다.
   */
  assign(source: SoundSource): this {
    if (!(source instanceof SoundSource)) {
      throw new TypeError('Expected a SoundSource');
    }
    if (source === this) return this;
    audioNative.assignAudioSource(this[audioHandle], source[audioHandle], false);
    return this;
  }
  /**
   * Set the pitch and playback rate multiplier; 1 is the original rate.
   * @zh 设置音高及播放速率倍率，1 为原速。
   * @ja ピッチと再生速度の倍率を設定します。1 は元の速度です。
   * @ko 음높이와 재생 속도 배율을 설정합니다. 1은 원래 속도입니다.
   */
  setPitch(value: number): void { this.set(0, value); }
  /**
   * Return the pitch multiplier.
   * @zh 返回音高倍率。
   * @ja ピッチの倍率を返します。
   * @ko 음높이 배율을 반환합니다.
   */
  getPitch(): number { return this.get(0); }
  /**
   * Set stereo pan: -1 is left, 0 is center, and 1 is right.
   * @zh 设置立体声声像，-1 为左、0 为中、1 为右。
   * @ja ステレオパンを設定します。-1 は左、0 は中央、1 は右です。
   * @ko 스테레오 팬을 설정합니다. -1은 왼쪽, 0은 중앙, 1은 오른쪽입니다.
   */
  setPan(value: number): void { this.set(1, value); }
  /**
   * Return the stereo pan.
   * @zh 返回立体声声像。
   * @ja ステレオパンを返します。
   * @ko 스테레오 팬을 반환합니다.
   */
  getPan(): number { return this.get(1); }
  /**
   * Set volume as a percentage; 0 is silent and 100 is the original volume.
   * @zh 设置音量百分比，0 为静音，100 为原始音量。
   * @ja 音量を百分率で設定します。0 は無音、100 は元の音量です。
   * @ko 볼륨을 백분율로 설정합니다. 0은 무음, 100은 원래 볼륨입니다.
   */
  setVolume(value: number): void { this.set(2, value); }
  /**
   * Return the volume percentage.
   * @zh 返回音量百分比。
   * @ja 音量の百分率を返します。
   * @ko 볼륨 백분율을 반환합니다.
   */
  getVolume(): number { return this.get(2); }
  /**
   * Enable or disable spatial effects from position, distance, and direction.
   * @zh 设置是否启用位置、距离和方向引起的空间音效。
   * @ja 位置・距離・方向による空間音響効果の有効・無効を設定します。
   * @ko 위치, 거리, 방향에 따른 공간 음향 효과의 활성화 여부를 설정합니다.
   */
  setSpatializationEnabled(value: boolean): void { this.set(3, flag(value)); }
  /**
   * Return whether spatialization is enabled.
   * @zh 返回是否启用空间音效。
   * @ja 空間音響効果が有効かどうかを返します。
   * @ko 공간 음향 효과의 활성화 여부를 반환합니다.
   */
  isSpatializationEnabled(): boolean { return this.get(3) !== 0; }
  /**
   * Set the 3D position using the same units as the listener and distances.
   * @zh 设置三维位置，单位须与监听者位置及距离参数一致。
   * @ja 3D 位置を設定します。単位はリスナー位置と距離パラメーターに合わせます。
   * @ko 3차원 위치를 설정합니다. 리스너 위치 및 거리 매개변수와 단위가 같아야 합니다.
   */
  setPosition(value: R<Vector3f>): void { this.setVector(4, value); }
  /**
   * Return a copy of the 3D position.
   * @zh 返回三维位置副本。
   * @ja 3D 位置のコピーを返します。
   * @ko 3차원 위치의 복사본을 반환합니다.
   */
  getPosition(): Vector3f { return this.getVector(4); }
  /**
   * Set the sound source's emission direction.
   * @zh 设置声源发声方向。
   * @ja 音源の発音方向を設定します。
   * @ko 음원의 소리 방출 방향을 설정합니다.
   */
  setDirection(value: R<Vector3f>): void { this.setVector(7, value); }
  /**
   * Return a copy of the emission direction.
   * @zh 返回发声方向副本。
   * @ja 発音方向のコピーを返します。
   * @ko 소리 방출 방향의 복사본을 반환합니다.
   */
  getDirection(): Vector3f { return this.getVector(7); }
  /**
   * Set the inner and outer cone angles and outer gain, updating the native
   * audio engine.
   * @zh 设置内外方向锥角度及外部增益，并更新原生音频引擎。
   * @ja 内側・外側コーンの角度と外側ゲインを設定し、
   * ネイティブ音声エンジンを更新します。
   * @ko 내부 및 외부 원뿔 각도와 외부 게인을 설정하고 네이티브 오디오 엔진을 갱신합니다.
   */
  setCone(value: Readonly<ConeInput>): void {
    const inner = angle(value.innerAngle);
    const outer = angle(value.outerAngle);
    const gain = float(value.outerGain);
    this.values.set([ inner, outer, gain ], 10);
    this.field(10, true);
  }
  /**
   * Return a copy of the directional cone parameters.
   * @zh 返回方向锥参数副本。
   * @ja 指向性コーンのパラメーターのコピーを返します。
   * @ko 지향성 원뿔 매개변수의 복사본을 반환합니다.
   */
  getCone(): Cone {
    this.field(10, false);
    return new Cone({ innerAngle: radians(this.values[10]),
      outerAngle: radians(this.values[11]), outerGain: this.values[12] });
  }
  /**
   * Set the 3D velocity for the Doppler effect, in position units per second.
   * @zh 设置三维速度，用于多普勒效应，单位为位置单位/秒。
   * @ja ドップラー効果用の 3D 速度を設定します。単位は位置単位/秒です。
   * @ko 도플러 효과에 사용할 3차원 속도를 설정합니다. 단위는 위치 단위/초입니다.
   */
  setVelocity(value: R<Vector3f>): void { this.setVector(13, value); }
  /**
   * Return a copy of the velocity.
   * @zh 返回速度副本。
   * @ja 速度のコピーを返します。
   * @ko 속도의 복사본을 반환합니다.
   */
  getVelocity(): Vector3f { return this.getVector(13); }
  /**
   * Set the Doppler effect multiplier; 0 disables it.
   * @zh 设置多普勒效应倍率，0 禁用。
   * @ja ドップラー効果の倍率を設定します。0 で無効になります。
   * @ko 도플러 효과 배율을 설정합니다. 0은 비활성화합니다.
   */
  setDopplerFactor(value: number): void { this.set(16, value); }
  /**
   * Return the Doppler effect multiplier.
   * @zh 返回多普勒效应倍率。
   * @ja ドップラー効果の倍率を返します。
   * @ko 도플러 효과 배율을 반환합니다.
   */
  getDopplerFactor(): number { return this.get(16); }
  /**
   * Set the factor controlling the source direction's effect on attenuation.
   * @zh 设置声源方向对衰减的影响因子。
   * @ja 音源の方向が減衰に与える影響の係数を設定します。
   * @ko 음원 방향이 감쇠에 미치는 영향 계수를 설정합니다.
   */
  setDirectionalAttenuationFactor(value: number): void { this.set(17, value); }
  /**
   * Return the directional attenuation factor.
   * @zh 返回方向衰减因子。
   * @ja 指向性減衰係数を返します。
   * @ko 지향성 감쇠 계수를 반환합니다.
   */
  getDirectionalAttenuationFactor(): number { return this.get(17); }
  /**
   * Set whether the position is relative to the listener; false uses world
   * coordinates.
   * @zh 设置位置是否相对于监听者；false 使用世界坐标。
   * @ja 位置をリスナー相対にするか設定します。false はワールド座標を使います。
   * @ko 리스너 기준 상대 위치 여부를 설정합니다. false는 월드 좌표를 사용합니다.
   */
  setRelativeToListener(value: boolean): void { this.set(18, flag(value)); }
  /**
   * Return whether listener-relative coordinates are used.
   * @zh 返回是否使用监听者相对坐标。
   * @ja リスナー相対座標を使うかどうかを返します。
   * @ko 리스너 기준 상대 좌표 사용 여부를 반환합니다.
   */
  isRelativeToListener(): boolean { return this.get(18) !== 0; }
  /**
   * Set the minimum reference distance at which maximum volume is maintained.
   * @zh 设置保持最大音量的最小参考距离。
   * @ja 最大音量を維持する最小基準距離を設定します。
   * @ko 최대 볼륨을 유지하는 최소 기준 거리를 설정합니다.
   */
  setMinDistance(value: number): void { this.set(19, value); }
  /**
   * Return the minimum reference distance.
   * @zh 返回最小参考距离。
   * @ja 最小基準距離を返します。
   * @ko 최소 기준 거리를 반환합니다.
   */
  getMinDistance(): number { return this.get(19); }
  /**
   * Set the maximum distance used for distance attenuation.
   * @zh 设置距离衰减使用的最大距离。
   * @ja 距離減衰に使う最大距離を設定します。
   * @ko 거리 감쇠에 사용할 최대 거리를 설정합니다.
   */
  setMaxDistance(value: number): void { this.set(20, value); }
  /**
   * Return the maximum distance.
   * @zh 返回最大距离。
   * @ja 最大距離を返します。
   * @ko 최대 거리를 반환합니다.
   */
  getMaxDistance(): number { return this.get(20); }
  /**
   * Set the minimum gain after distance attenuation.
   * @zh 设置距离衰减后的最小增益。
   * @ja 距離減衰後の最小ゲインを設定します。
   * @ko 거리 감쇠 후의 최소 게인을 설정합니다.
   */
  setMinGain(value: number): void { this.set(21, value); }
  /**
   * Return the minimum gain.
   * @zh 返回最小增益。
   * @ja 最小ゲインを返します。
   * @ko 최소 게인을 반환합니다.
   */
  getMinGain(): number { return this.get(21); }
  /**
   * Set the maximum gain after distance attenuation.
   * @zh 设置距离衰减后的最大增益。
   * @ja 距離減衰後の最大ゲインを設定します。
   * @ko 거리 감쇠 후의 최대 게인을 설정합니다.
   */
  setMaxGain(value: number): void { this.set(22, value); }
  /**
   * Return the maximum gain.
   * @zh 返回最大增益。
   * @ja 最大ゲインを返します。
   * @ko 최대 게인을 반환합니다.
   */
  getMaxGain(): number { return this.get(22); }
  /**
   * Set the distance attenuation factor; 0 disables distance attenuation.
   * @zh 设置距离衰减因子，0 禁用距离衰减。
   * @ja 距離減衰係数を設定します。0 で距離減衰が無効になります。
   * @ko 거리 감쇠 계수를 설정합니다. 0은 거리 감쇠를 비활성화합니다.
   */
  setAttenuation(value: number): void { this.set(23, value); }
  /**
   * Return the distance attenuation factor.
   * @zh 返回距离衰减因子。
   * @ja 距離減衰係数を返します。
   * @ko 거리 감쇠 계수를 반환합니다.
   */
  getAttenuation(): number { return this.get(23); }
  /**
   * Set whether playback loops after reaching the end.
   * @zh 设置到达末尾后是否循环播放。
   * @ja 末尾に達した後にループ再生するか設定します。
   * @ko 끝에 도달한 후 반복 재생할지 설정합니다.
   */
  setLooping(value: boolean): void { this.set(24, flag(value)); }
  /**
   * Return whether playback loops.
   * @zh 返回是否循环播放。
   * @ja ループ再生するかどうかを返します。
   * @ko 반복 재생 여부를 반환합니다.
   */
  isLooping(): boolean { return this.get(24) !== 0; }
  /**
   * Query the native engine's current playback status.
   * @zh 查询原生引擎的当前播放状态。
   * @ja ネイティブエンジンの現在の再生状態を取得します。
   * @ko 네이티브 엔진의 현재 재생 상태를 조회합니다.
   */
  getStatus(): SoundStatus { return this.get(25); }
  /**
   * Bind and retain an effect processor reference; undefined removes it.
   * @zh 绑定并保留效果处理器引用；undefined 移除处理器。
   * @ja エフェクトプロセッサーを関連付け、参照を保持します。undefined で解除します。
   * @ko 효과 처리기를 연결하고 참조를 유지합니다. undefined는 처리기를 제거합니다.
   */
  setEffectProcessor(processor?: EffectProcessor): void {
    if (processor !== undefined && !(processor instanceof EffectProcessor)) {
      throw new TypeError('Expected an EffectProcessor');
    }
    audioNative.setAudioEffect(this[audioHandle], processor?.[audioHandle]);
    this.effect = processor;
  }
  /**
   * Start or resume playback; if already playing, restart per SFML semantics.
   * @zh 开始播放或恢复暂停；已播放时按 SFML 语义重新开始。
   * @ja 再生を開始または再開します。再生中なら SFML の仕様に従い最初から再生します。
   * @ko 재생을 시작하거나 재개합니다. 이미 재생 중이면 SFML 동작에 따라 다시 시작합니다.
   */
  play(): void { this.command(0); }
  /**
   * Pause and retain the playback position.
   * @zh 暂停并保留播放位置。
   * @ja 再生位置を保持して一時停止します。
   * @ko 재생 위치를 유지한 채 일시 정지합니다.
   */
  pause(): void { this.command(1); }
  /**
   * Stop and reset the playback position to zero.
   * @zh 停止并将播放位置归零。
   * @ja 停止して再生位置をゼロに戻します。
   * @ko 정지하고 재생 위치를 0으로 되돌립니다.
   */
  stop(): void { this.command(2); }
  /**
   * Set the playback time relative to the beginning of the sound.
   * @zh 设置相对于声音起点的播放时间。
   * @ja 音声の先頭からの再生時刻を設定します。
   * @ko 소리 시작점 기준 재생 시간을 설정합니다.
   */
  setPlayingOffset(value: R<Time>): void {
    this.times[0] = duration(value);
    this.command(3);
  }
  /**
   * Return a copy of the current playback position as a time.
   * @zh 返回当前播放位置的时间副本。
   * @ja 現在の再生位置を表す時刻のコピーを返します。
   * @ko 현재 재생 위치를 나타내는 시간의 복사본을 반환합니다.
   */
  getPlayingOffset(): Time {
    this.command(4);
    return new Time(this.times[0]);
  }
  protected command(command: number): void {
    audioNative.audioSourceCommand(this[audioHandle], command);
  }
  protected field(field: number, write: boolean): void {
    audioNative.audioSourceField(this[audioHandle], field, write);
  }
  protected get(field: number): number {
    this.field(field, false);
    return this.values[field];
  }
  private set(field: number, value: number): void {
    this.values[field] = float(value);
    this.field(field, true);
  }
  private setVector(field: number, value: R<Vector3f>): void {
    vector(value);
    this.values[field] = value.x;
    this.values[field + 1] = value.y;
    this.values[field + 2] = value.z;
    this.field(field, true);
  }
  private getVector(field: number): Vector3f {
    this.field(field, false);
    return new Vector3f(this.values[field], this.values[field + 1],
      this.values[field + 2]);
  }
}
