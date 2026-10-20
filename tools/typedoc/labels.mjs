/**
 * Localized interface copy; API identifiers remain identical across
 * languages.
 */
export const referenceLabels = {
  en: {
    overview: 'Overview',
    modules: 'Modules',
    members: 'Member directory',
    parameters: 'Parameters',
    returns: 'Returns',
    source: 'Source & inheritance',
    hierarchy: 'Type hierarchy',
    all: 'All APIs',
    other: 'Other exports',
    symbols: 'Symbol members',
    intro:
      'Windows, graphics, audio and networking for ' +
      'Node.js. Browse a module or search for an API ' +
      'by name.',
    moduleDescriptions: [
      'Time, vectors and streams. The foundations shared by every module.',
      'Windows, input and OpenGL contexts. Connect ' +
      'your application to the desktop.',
      'Textures, shapes, text and rendering. Build your 2D scene.',
      'Playback, recording and spatial audio. Work with sound in real time.',
      'Sockets, packets and protocols. Connect your ' +
      'application to the network.',
    ],
  },
  zh: {
    overview: '概览', modules: '模块', members: '成员目录', parameters: '参数',
    returns: '返回值', source: '源码与继承', hierarchy: '继承关系',
    all: '全部 API', other: '其他导出', symbols: '符号成员',
    intro: '用于 Node.js 的窗口、图形、音频与网络接口。按模块浏览，或直接搜索 API 名称。',
    moduleDescriptions: [
      '时间、向量与数据流，为各模块提供基础能力。',
      '窗口、输入与 OpenGL 上下文，连接应用与桌面环境。',
      '纹理、形状、文字与渲染，构建二维场景。',
      '播放、录音与空间音频，实时处理声音。',
      '套接字、数据包与通信协议，为应用接入网络。',
    ],
  },
  ja: {
    overview: '概要',
    modules: 'モジュール',
    members: 'メンバー一覧',
    parameters: '引数',
    returns: '戻り値',
    source: 'ソースと継承',
    hierarchy: '継承関係',
    all: 'すべての API',
    other: 'その他のエクスポート',
    symbols: 'シンボルメンバー',
    intro:
      'Node.js のためのウィンドウ、グラフィックス、オーディオ、ネットワーク API。モジュールから探すか、API 名で検索できます。',
    moduleDescriptions: [
      '時間、ベクトル、ストリーム。各モジュールを支える基盤。',
      'ウィンドウ、入力、OpenGL コンテキスト。デスクトップとの接点。',
      'テクスチャ、図形、テキスト、描画。2D シーンを構築。',
      '再生、録音、空間オーディオ。リアルタイムに音を処理。',
      'ソケット、パケット、通信プロトコル。ネットワークに接続。',
    ],
  },
  ko: {
    overview: '개요', modules: '모듈', members: '멤버 목록', parameters: '매개변수',
    returns: '반환값', source: '소스와 상속', hierarchy: '상속 관계',
    all: '모든 API', other: '기타 내보내기', symbols: '심볼 멤버',
    intro: 'Node.js를 위한 윈도우, 그래픽, 오디오, 네트워크 API입니다. 모듈별로 살펴보거나 API 이름으로 검색하세요.',
    moduleDescriptions: [
      '시간, 벡터, 스트림. 모든 모듈의 기반 기능.',
      '윈도우, 입력, OpenGL 컨텍스트. 데스크톱 환경과의 연결.',
      '텍스처, 도형, 텍스트, 렌더링. 2D 장면 구성.',
      '재생, 녹음, 공간 오디오. 실시간 사운드 처리.',
      '소켓, 패킷, 통신 프로토콜. 네트워크 연결.',
    ],
  },
};

/** Display order and introductory APIs for the five SFML modules. */
export const modules = [
  { id: 'system', name: 'System', featured: [ 'Clock', 'Time', 'Vector2f' ] },
  {
    id: 'window',
    name: 'Window',
    featured: [ 'Window', 'Event', 'VideoMode' ],
  },
  {
    id: 'graphics',
    name: 'Graphics',
    featured: [ 'RenderWindow', 'Texture', 'Sprite' ],
  },
  { id: 'audio', name: 'Audio', featured: [ 'Sound', 'SoundBuffer', 'Music' ] },
  {
    id: 'network',
    name: 'Network',
    featured: [ 'TcpSocket', 'Http', 'Packet' ],
  },
];
