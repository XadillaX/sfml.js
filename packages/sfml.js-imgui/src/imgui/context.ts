import { native } from '../internal/native';
import type { ImDrawData, ImGuiIO, ImGuiPlatformIO } from '../types';

/**
 * Access input and configuration state.
 *
 * @zh 访问输入和配置状态。
 * @ja 入力と設定の状態にアクセスします。
 * @ko 입력 및 설정 상태에 접근합니다.
 *
 * @remarks
 * access the ImGuiIO structure (mouse/keyboard/gamepad inputs, time, various
 * configuration options/flags)
 * @zh
 * 主要接口：访问 ImGuiIO 结构（鼠标、键盘、游戏手柄输入、时间以及各种配置选项和标志）。
 * @ja
 * 主要 API：ImGuiIO 構造体（マウス、キーボード、ゲームパッドの入力、時刻、各種設定オプションとフラグ）にアクセスします。
 * @ko
 * 주요 API: ImGuiIO 구조체(마우스, 키보드, 게임패드 입력, 시간, 각종 설정 옵션과 플래그)에 접근합니다.
 *
 * @returns Borrowed handle to the current context input, timing, and
 * configuration state.
 * @zh 当前上下文输入、计时和配置状态的借用句柄。
 * @ja 現在の入力・時刻・設定状態を参照する借用ハンドルです。
 * @ko 현재 컨텍스트의 입력, 시간 및 설정 상태를 참조하는 빌린 핸들입니다.
 */
export function GetIO(): ImGuiIO | null {
  return native.GetIO();
}

/**
 * Access platform and renderer integration hooks.
 *
 * @zh 访问平台和渲染器集成接口。
 * @ja プラットフォームとレンダラーの連携フックにアクセスします。
 * @ko 플랫폼 및 렌더러 연동 훅에 접근합니다.
 *
 * @remarks
 * access the ImGuiPlatformIO structure (mostly hooks/functions to connect to
 * platform/renderer and OS Clipboard, IME etc.)
 * @zh
 * 访问 ImGuiPlatformIO 结构（主要是连接平台、渲染器以及操作系统剪贴板、IME 等的钩子和函数）。
 * @ja
 * ImGuiPlatformIO 構造体（主にプラットフォーム、レンダラー、OS のクリップボードや IME などに接続するフックと関数）にアクセスします。
 * @ko
 * ImGuiPlatformIO 구조체(주로 플랫폼, 렌더러, OS 클립보드, IME 등에 연결하는 훅과 함수)에 접근합니다.
 *
 * @returns Borrowed handle to the current context platform/backend integration
 * state.
 * @zh 当前上下文平台及后端集成状态的借用句柄。
 * @ja 現在のプラットフォーム・バックエンド連携状態の借用ハンドルです。
 * @ko 현재 컨텍스트 플랫폼 및 백엔드 연동 상태의 빌린 핸들입니다.
 */
export function GetPlatformIO(): ImGuiPlatformIO | null {
  return native.GetPlatformIO();
}

/**
 * Start a new Dear ImGui frame.
 *
 * @zh 开始新的 Dear ImGui 帧。
 * @ja Dear ImGui の新しいフレームを開始します。
 * @ko 새 Dear ImGui 프레임을 시작합니다.
 *
 * @remarks
 * start a new Dear ImGui frame, you can submit any command from this point
 * until Render()/EndFrame().
 * @zh
 * 从此时起到 Render()/EndFrame() 之前，可以提交任意命令。
 * @ja
 * 新しい Dear ImGui フレームを開始します。
 *
 * この時点から Render()/EndFrame() まで任意のコマンドを送信できます。
 * @ko
 * 이 시점부터 Render()/EndFrame()까지 모든 명령을 제출할 수 있습니다.
 */
export function NewFrame(): void {
  native.NewFrame();
}

/**
 * End the current Dear ImGui frame.
 *
 * @zh 结束当前 Dear ImGui 帧。
 * @ja 現在の Dear ImGui フレームを終了します。
 * @ko 현재 Dear ImGui 프레임을 종료합니다.
 *
 * @remarks
 * ends the Dear ImGui frame.
 *
 * automatically called by Render().
 *
 * If you don't need to render data (skipping rendering) you may call EndFrame()
 * without Render()...
 *
 * but you'll have wasted CPU already!
 *
 * If you don't need to render, better to not create any windows and not call
 * NewFrame() at all!
 * @zh
 * 结束 Dear ImGui 帧。
 *
 * Render() 会自动调用此函数。
 *
 * 如果不需要渲染数据（跳过渲染），可以只调用 EndFrame() 而不调用 Render()……但此时已经浪费了 CPU！
 *
 * 如果不需要渲染，最好根本不要创建窗口，也不要调用 NewFrame()！
 * @ja
 * Dear ImGui フレームを終了します。
 *
 * Render() が自動的に呼び出します。
 *
 * データを描画する必要がない（描画をスキップする）場合は、Render() なしで EndFrame() を呼べますが、その時点ですでに CPU
 * を無駄に使っています！
 *
 * 描画が不要なら、ウィンドウを一切作成せず、NewFrame() も呼ばない方がよいでしょう！
 * @ko
 * Dear ImGui 프레임을 종료합니다.
 *
 * Render()가 자동으로 호출합니다.
 *
 * 데이터를 렌더링할 필요가 없다면(렌더링을 건너뛰는 경우) Render() 없이 EndFrame()을 호출할 수 있지만, 이미 CPU를
 * 낭비한 셈입니다!
 *
 * 렌더링이 필요 없다면 창을 만들지 않고 NewFrame()도 호출하지 않는 편이 좋습니다!
 */
export function EndFrame(): void {
  native.EndFrame();
}

/**
 * End the frame and finalize its draw data.
 *
 * @zh 结束当前帧并完成绘制数据。
 * @ja フレームを終了し、描画データを確定します。
 * @ko 프레임을 종료하고 그리기 데이터를 완성합니다.
 *
 * @remarks
 * ends the Dear ImGui frame, finalize the draw data.
 *
 * You can then get call GetDrawData().
 * @zh
 * 结束 Dear ImGui 帧并完成绘制数据。
 *
 * 随后可调用 GetDrawData() 获取数据。
 * @ja
 * Dear ImGui フレームを終了し、描画データを確定します。
 *
 * その後 GetDrawData() を呼んでデータを取得できます。
 * @ko
 * Dear ImGui 프레임을 종료하고 그리기 데이터를 확정합니다.
 *
 * 이후 GetDrawData()를 호출하여 데이터를 가져올 수 있습니다.
 */
export function Render(): void {
  native.Render();
}

/**
 * Get the draw data for the rendered frame.
 *
 * @zh 获取已渲染帧的绘制数据。
 * @ja 描画済みフレームの描画データを取得します。
 * @ko 렌더링된 프레임의 그리기 데이터를 가져옵니다.
 *
 * @remarks
 * valid after Render() and until the next call to NewFrame().
 *
 * this is what you have to render.
 * @zh
 * 在 Render() 之后到下次调用 NewFrame() 之前有效。
 *
 * 这就是需要渲染的数据。
 * @ja
 * Render() の後から次の NewFrame() 呼び出しまで有効です。
 *
 * これが描画すべきデータです。
 * @ko
 * Render() 이후부터 다음 NewFrame() 호출 전까지 유효합니다.
 *
 * 렌더링해야 하는 데이터입니다.
 *
 * @returns Borrowed draw-data handle after Render(), or null when no valid
 * rendered data exists; valid until the next NewFrame().
 * @zh Render() 后的借用绘制数据句柄，无有效渲染数据时为 null；有效期至下一次 NewFrame()。
 * @ja Render() 後の借用描画データです。有効な描画データがなければ null で、次の NewFrame() まで有効です。
 * @ko Render() 후의 빌린 그리기 데이터 핸들입니다. 유효한 데이터가 없으면 null이며 다음 NewFrame()까지 유효합니다.
 */
export function GetDrawData(): ImDrawData | null {
  return native.GetDrawData();
}

/**
 * Get the compiled Dear ImGui version string.
 *
 * @zh 获取编译后的 Dear ImGui 版本字符串。
 * @ja コンパイルされた Dear ImGui のバージョン文字列を取得します。
 * @ko 컴파일된 Dear ImGui 버전 문자열을 가져옵니다.
 *
 * @remarks
 * get the compiled version string e.g. "1.80 WIP" (essentially the value for
 * IMGUI_VERSION from the compiled version of imgui.cpp)
 * @zh
 * 获取编译版本字符串，例如 "1.80 WIP"（实质是已编译的 imgui.cpp 中 IMGUI_VERSION 的值）。
 * @ja
 * コンパイルされたバージョン文字列（例："1.80 WIP"）を取得します（実質的にはコンパイルされた imgui.cpp の IMGUI_VERSION
 * の値です）。
 * @ko
 * 컴파일된 버전 문자열(예: "1.80 WIP")을 가져옵니다(실제로는 컴파일된 imgui.cpp의 IMGUI_VERSION 값입니다).
 *
 * @returns Version string of the linked Dear ImGui library.
 * @zh 所链接 Dear ImGui 库的版本字符串。
 * @ja リンクした Dear ImGui ライブラリーのバージョン文字列です。
 * @ko 연결된 Dear ImGui 라이브러리의 버전 문자열입니다.
 */
export function GetVersion(): string | null {
  return native.GetVersion();
}

/**
 * Get global imgui time.
 *
 * @zh 获取 imgui 全局时间。
 * @ja imgui のグローバル時刻を取得します。
 * @ko imgui 전역 시간을 가져옵니다.
 *
 * @remarks
 * incremented by io.DeltaTime every frame.
 * @zh
 * 每帧增加 io.DeltaTime。
 * @ja
 * 毎フレーム io.DeltaTime だけ増加します。
 * @ko
 * 매 프레임 io.DeltaTime만큼 증가합니다.
 *
 * @returns ImGui elapsed time in seconds, accumulated from io.DeltaTime.
 * @zh ImGui 根据 io.DeltaTime 累计的经过秒数。
 * @ja io.DeltaTime を累積した ImGui の経過秒数です。
 * @ko io.DeltaTime에서 누적한 ImGui 경과 시간(초)입니다.
 */
export function GetTime(): number {
  return native.GetTime();
}

/**
 * Get global imgui frame count.
 *
 * @zh 获取 imgui 全局帧计数。
 * @ja imgui のグローバルフレーム数を取得します。
 * @ko imgui 전역 프레임 수를 가져옵니다.
 *
 * @remarks
 * incremented by 1 every frame.
 * @zh
 * 每帧增加 1。
 * @ja
 * 毎フレーム 1 ずつ増加します。
 * @ko
 * 매 프레임 1씩 증가합니다.
 *
 * @returns Number of frames started by NewFrame() in the current context.
 * @zh 当前上下文通过 NewFrame() 开始的帧数。
 * @ja 現在のコンテキストで NewFrame() が開始したフレーム数です。
 * @ko 현재 컨텍스트에서 NewFrame()으로 시작한 프레임 수입니다.
 */
export function GetFrameCount(): number {
  return native.GetFrameCount();
}
