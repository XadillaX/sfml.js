// Generated from the bundled SFML Network headers.
/**
 * FTP file transfer modes.
 * @zh FTP 文件传输模式。
 * @ja FTP のファイル転送モード。
 * @ko FTP 파일 전송 모드.
 */
export enum TransferMode {
  /**
   * Binary mode (file is transferred as a sequence of bytes)
   * @zh 二进制模式（文件以字节序列传输）
   * @ja バイナリモード（ファイルをバイト列として転送します）
   * @ko 바이너리 모드(파일을 바이트 시퀀스로 전송함)
   */
  Binary,
  /**
   * Text mode using ASCII encoding
   * @zh 使用 ASCII 编码的文本模式
   * @ja ASCII エンコーディングを使用するテキストモード
   * @ko ASCII 인코딩을 사용하는 텍스트 모드
   */
  Ascii,
  /**
   * Text mode using EBCDIC encoding
   * @zh 使用 EBCDIC 编码的文本模式
   * @ja EBCDIC エンコーディングを使用するテキストモード
   * @ko EBCDIC 인코딩을 사용하는 텍스트 모드
   */
  Ebcdic,
}
/**
 * FTP server response codes and client error codes.
 * @zh FTP 服务端响应码和客户端错误码。
 * @ja FTP サーバーの応答コードとクライアントのエラーコード。
 * @ko FTP 서버 응답 코드 및 클라이언트 오류 코드.
 */
export enum FtpStatus {
  /**
   * Restart marker reply
   * @zh 重启标记响应
   * @ja 再開マーカーの応答
   * @ko 재시작 마커 응답
   */
  RestartMarkerReply = 110,
  /**
   * Service ready in N minutes
   * @zh 服务将在 N 分钟后就绪
   * @ja サービスは N 分後に利用可能になります
   * @ko N분 후 서비스 준비 완료
   */
  ServiceReadySoon = 120,
  /**
   * Data connection already opened, transfer starting
   * @zh 数据连接已打开，正在开始传输
   * @ja データ接続は既に開かれており、転送を開始します
   * @ko 데이터 연결이 이미 열려 있으며 전송을 시작함
   */
  DataConnectionAlreadyOpened = 125,
  /**
   * File status ok, about to open data connection
   * @zh 文件状态正常，即将打开数据连接
   * @ja ファイルの状態は正常で、データ接続を開く準備ができています
   * @ko 파일 상태가 정상이며 데이터 연결을 열 예정
   */
  OpeningDataConnection = 150,
  /**
   * Command ok
   * @zh 命令成功
   * @ja コマンド成功
   * @ko 명령 성공
   */
  Ok = 200,
  /**
   * Command not implemented
   * @zh 命令未实现
   * @ja コマンドは実装されていません
   * @ko 명령이 구현되지 않음
   */
  PointlessCommand = 202,
  /**
   * System status, or system help reply
   * @zh 系统状态或系统帮助响应
   * @ja システム状態、またはシステムヘルプの応答
   * @ko 시스템 상태 또는 시스템 도움말 응답
   */
  SystemStatus = 211,
  /**
   * Directory status
   * @zh 目录状态
   * @ja ディレクトリの状態
   * @ko 디렉터리 상태
   */
  DirectoryStatus = 212,
  /**
   * File status
   * @zh 文件状态
   * @ja ファイルの状態
   * @ko 파일 상태
   */
  FileStatus = 213,
  /**
   * Help message
   * @zh 帮助信息
   * @ja ヘルプメッセージ
   * @ko 도움말 메시지
   */
  HelpMessage = 214,
  /**
   * NAME system type, where NAME is an official system name from the list in
   * the Assigned Numbers document
   * @zh NAME 系统类型，其中 NAME 是 Assigned Numbers 文档列表中的官方系统名称
   * @ja NAME システム種別。NAME は Assigned Numbers 文書の一覧にある正式なシステム名です
   * @ko NAME 시스템 유형. NAME은 Assigned Numbers 문서 목록에 있는 공식 시스템 이름
   */
  SystemType = 215,
  /**
   * Service ready for new user
   * @zh 服务已准备好接受新用户
   * @ja サービスは新しいユーザーを受け入れる準備ができています
   * @ko 서비스가 새 사용자를 받을 준비가 됨
   */
  ServiceReady = 220,
  /**
   * Service closing control connection
   * @zh 服务正在关闭控制连接
   * @ja サービスが制御接続を閉じています
   * @ko 서비스가 제어 연결을 닫는 중
   */
  ClosingConnection = 221,
  /**
   * Data connection open, no transfer in progress
   * @zh 数据连接已打开，当前没有传输
   * @ja データ接続は開いていますが、転送は行われていません
   * @ko 데이터 연결이 열려 있으나 진행 중인 전송이 없음
   */
  DataConnectionOpened = 225,
  /**
   * Closing data connection, requested file action successful
   * @zh 正在关闭数据连接，请求的文件操作已成功
   * @ja データ接続を閉じています。要求されたファイル操作は成功しました
   * @ko 데이터 연결을 닫는 중이며 요청한 파일 작업이 성공함
   */
  ClosingDataConnection = 226,
  /**
   * Entering passive mode
   * @zh 正在进入被动模式
   * @ja パッシブモードに移行します
   * @ko 수동 모드로 전환 중
   */
  EnteringPassiveMode = 227,
  /**
   * User logged in, proceed. Logged out if appropriate
   * @zh 用户已登录，可以继续；适当时注销
   * @ja ユーザーはログイン済みで、続行できます。必要に応じてログアウトします
   * @ko 사용자가 로그인했으므로 계속 진행. 필요한 경우 로그아웃됨
   */
  LoggedIn = 230,
  /**
   * Requested file action ok
   * @zh 请求的文件操作成功
   * @ja 要求されたファイル操作は成功しました
   * @ko 요청한 파일 작업이 성공함
   */
  FileActionOk = 250,
  /**
   * PATHNAME created
   * @zh 已创建 PATHNAME
   * @ja PATHNAME を作成しました
   * @ko PATHNAME이 생성됨
   */
  DirectoryOk = 257,
  /**
   * User name ok, need password
   * @zh 用户名有效，需要密码
   * @ja ユーザー名は有効です。パスワードが必要です
   * @ko 사용자 이름이 유효하며 비밀번호가 필요함
   */
  NeedPassword = 331,
  /**
   * Need account for login
   * @zh 登录需要账户信息
   * @ja ログインにはアカウント情報が必要です
   * @ko 로그인에 계정 정보가 필요함
   */
  NeedAccountToLogIn = 332,
  /**
   * Requested file action pending further information
   * @zh 请求的文件操作正在等待更多信息
   * @ja 要求されたファイル操作は追加情報を待っています
   * @ko 요청한 파일 작업이 추가 정보를 기다리는 중
   */
  NeedInformation = 350,
  /**
   * Service not available, closing control connection
   * @zh 服务不可用，正在关闭控制连接
   * @ja サービスを利用できないため、制御接続を閉じています
   * @ko 서비스를 사용할 수 없어 제어 연결을 닫는 중
   */
  ServiceUnavailable = 421,
  /**
   * Can't open data connection
   * @zh 无法打开数据连接
   * @ja データ接続を開けません
   * @ko 데이터 연결을 열 수 없음
   */
  DataConnectionUnavailable = 425,
  /**
   * Connection closed, transfer aborted
   * @zh 连接已关闭，传输已中止
   * @ja 接続が閉じられ、転送が中止されました
   * @ko 연결이 닫히고 전송이 중단됨
   */
  TransferAborted = 426,
  /**
   * Requested file action not taken
   * @zh 未执行请求的文件操作
   * @ja 要求されたファイル操作は実行されませんでした
   * @ko 요청한 파일 작업이 수행되지 않음
   */
  FileActionAborted = 450,
  /**
   * Requested action aborted, local error in processing
   * @zh 请求的操作已中止，处理过程中发生本地错误
   * @ja 処理中にローカルエラーが発生し、要求された操作が中止されました
   * @ko 처리 중 로컬 오류가 발생하여 요청한 작업이 중단됨
   */
  LocalError = 451,
  /**
   * Requested action not taken; insufficient storage space in system, file
   * unavailable
   * @zh 未执行请求的操作；系统存储空间不足，文件不可用
   * @ja 要求された操作は実行されませんでした。システムの記憶領域が不足し、ファイルを利用できません
   * @ko 요청한 작업이 수행되지 않음. 시스템 저장 공간이 부족하여 파일을 사용할 수 없음
   */
  InsufficientStorageSpace = 452,
  /**
   * Syntax error, command unrecognized
   * @zh 语法错误，无法识别命令
   * @ja 構文エラー。コマンドを認識できません
   * @ko 구문 오류로 명령을 인식할 수 없음
   */
  CommandUnknown = 500,
  /**
   * Syntax error in parameters or arguments
   * @zh 参数或实参存在语法错误
   * @ja パラメーターまたは引数に構文エラーがあります
   * @ko 매개변수 또는 인수에 구문 오류가 있음
   */
  ParametersUnknown = 501,
  /**
   * Command not implemented
   * @zh 命令未实现
   * @ja コマンドは実装されていません
   * @ko 명령이 구현되지 않음
   */
  CommandNotImplemented = 502,
  /**
   * Bad sequence of commands
   * @zh 命令顺序错误
   * @ja コマンドの順序が不正です
   * @ko 명령 순서가 잘못됨
   */
  BadCommandSequence = 503,
  /**
   * Command not implemented for that parameter
   * @zh 该命令尚未实现对该参数的支持
   * @ja そのパラメーターに対するコマンドは実装されていません
   * @ko 해당 매개변수에 대한 명령이 구현되지 않음
   */
  ParameterNotImplemented = 504,
  /**
   * Not logged in
   * @zh 尚未登录
   * @ja ログインしていません
   * @ko 로그인하지 않음
   */
  NotLoggedIn = 530,
  /**
   * Need account for storing files
   * @zh 存储文件需要账户信息
   * @ja ファイルの保存にはアカウント情報が必要です
   * @ko 파일 저장에 계정 정보가 필요함
   */
  NeedAccountToStore = 532,
  /**
   * Requested action not taken, file unavailable
   * @zh 未执行请求的操作，文件不可用
   * @ja ファイルを利用できないため、要求された操作は実行されませんでした
   * @ko 파일을 사용할 수 없어 요청한 작업이 수행되지 않음
   */
  FileUnavailable = 550,
  /**
   * Requested action aborted, page type unknown
   * @zh 请求的操作已中止，页面类型未知
   * @ja ページ種別が不明なため、要求された操作が中止されました
   * @ko 페이지 유형을 알 수 없어 요청한 작업이 중단됨
   */
  PageTypeUnknown = 551,
  /**
   * Requested file action aborted, exceeded storage allocation
   * @zh 请求的文件操作已中止，超出分配的存储空间
   * @ja 割り当てられた記憶領域を超えたため、要求されたファイル操作が中止されました
   * @ko 할당된 저장 공간을 초과하여 요청한 파일 작업이 중단됨
   */
  NotEnoughMemory = 552,
  /**
   * Requested action not taken, file name not allowed
   * @zh 未执行请求的操作，文件名不被允许
   * @ja ファイル名が許可されていないため、要求された操作は実行されませんでした
   * @ko 파일 이름이 허용되지 않아 요청한 작업이 수행되지 않음
   */
  FilenameNotAllowed = 553,
  /**
   * Not part of the FTP standard, generated by SFML when a received response
   * cannot be parsed
   * @zh 不属于 FTP 标准；SFML 无法解析收到的响应时生成
   * @ja FTP 標準には含まれません。受信した応答を解析できないときに SFML が生成します
   * @ko FTP 표준에 포함되지 않음. 수신한 응답을 구문 분석할 수 없을 때 SFML이 생성함
   */
  InvalidResponse = 1000,
  /**
   * Not part of the FTP standard, generated by SFML when the low-level socket
   * connection with the server fails
   * @zh 不属于 FTP 标准；与服务端的底层套接字连接失败时由 SFML 生成
   * @ja FTP 標準には含まれません。サーバーとの低レベルソケット接続に失敗したときに SFML が生成します
   * @ko FTP 표준에 포함되지 않음. 서버와의 저수준 소켓 연결에 실패했을 때 SFML이 생성함
   */
  ConnectionFailed = 1001,
  /**
   * Not part of the FTP standard, generated by SFML when the low-level socket
   * connection is unexpectedly closed
   * @zh 不属于 FTP 标准；底层套接字连接意外关闭时由 SFML 生成
   * @ja FTP 標準には含まれません。低レベルソケット接続が予期せず閉じられたときに SFML が生成します
   * @ko FTP 표준에 포함되지 않음. 저수준 소켓 연결이 예기치 않게 닫혔을 때 SFML이 생성함
   */
  ConnectionClosed = 1002,
  /**
   * Not part of the FTP standard, generated by SFML when a local file cannot be
   * read or written
   * @zh 不属于 FTP 标准；无法读取或写入本地文件时由 SFML 生成
   * @ja FTP 標準には含まれません。ローカルファイルを読み書きできないときに SFML が生成します
   * @ko FTP 표준에 포함되지 않음. 로컬 파일을 읽거나 쓸 수 없을 때 SFML이 생성함
   */
  InvalidFile = 1003,
}
/**
 * SFTP operation result codes.
 * @zh SFTP 操作结果码。
 * @ja SFTP 操作の結果コード。
 * @ko SFTP 작업 결과 코드.
 */
export enum SftpResultValue {
  /**
   * Operation completed successfully
   * @zh 操作成功完成
   * @ja 操作が正常に完了しました
   * @ko 작업이 성공적으로 완료됨
   */
  Success,
  /**
   * The TCP socket has been disconnected
   * @zh TCP 套接字已断开连接
   * @ja TCP ソケットが切断されました
   * @ko TCP 소켓의 연결이 끊어짐
   */
  Disconnected,
  /**
   * Operation timed out
   * @zh 操作超时
   * @ja 操作がタイムアウトしました
   * @ko 작업 시간이 초과됨
   */
  Timeout,
  /**
   * Connection refused
   * @zh 连接被拒绝
   * @ja 接続が拒否されました
   * @ko 연결이 거부됨
   */
  Refused,
  /**
   * Generic error
   * @zh 一般错误
   * @ja 一般的なエラー
   * @ko 일반 오류
   */
  Error,
  /**
   * Error during banner receive
   * @zh 接收协议标识信息时出错
   * @ja バナーの受信中にエラーが発生しました
   * @ko 배너 수신 중 오류 발생
   */
  BannerReceive,
  /**
   * Error during banner send
   * @zh 发送协议标识信息时出错
   * @ja バナーの送信中にエラーが発生しました
   * @ko 배너 전송 중 오류 발생
   */
  BannerSend,
  /**
   * Invalid message authentication code
   * @zh 无效的消息认证码
   * @ja メッセージ認証コードが無効です
   * @ko 유효하지 않은 메시지 인증 코드
   */
  InvalidMac,
  /**
   * Allocation failure
   * @zh 内存分配失败
   * @ja メモリの割り当てに失敗しました
   * @ko 메모리 할당 실패
   */
  AllocationFailure,
  /**
   * Error sending on socket
   * @zh 通过套接字发送时出错
   * @ja ソケットでの送信中にエラーが発生しました
   * @ko 소켓 전송 중 오류 발생
   */
  SocketSend,
  /**
   * Key exchange failed
   * @zh 密钥交换失败
   * @ja 鍵交換に失敗しました
   * @ko 키 교환 실패
   */
  KeyExchangeFailure,
  /**
   * Host key initialization failed
   * @zh 主机密钥初始化失败
   * @ja ホスト鍵の初期化に失敗しました
   * @ko 호스트 키 초기화 실패
   */
  HostKeyInitialization,
  /**
   * Host key signing failed
   * @zh 主机密钥签名失败
   * @ja ホスト鍵による署名に失敗しました
   * @ko 호스트 키 서명 실패
   */
  HostKeySign,
  /**
   * Decryption failed
   * @zh 解密失败
   * @ja 復号に失敗しました
   * @ko 복호화 실패
   */
  DecryptError,
  /**
   * SSH protocol error
   * @zh SSH 协议错误
   * @ja SSH プロトコルエラー
   * @ko SSH 프로토콜 오류
   */
  ProtocolError,
  /**
   * Password expired
   * @zh 密码已过期
   * @ja パスワードの有効期限が切れています
   * @ko 비밀번호가 만료됨
   */
  PasswordExpired,
  /**
   * File error
   * @zh 文件错误
   * @ja ファイルエラー
   * @ko 파일 오류
   */
  FileError,
  /**
   * No method found
   * @zh 未找到可用方法
   * @ja 利用可能な方式が見つかりません
   * @ko 사용 가능한 방식을 찾을 수 없음
   */
  MethodNone,
  /**
   * Authentication failed
   * @zh 身份验证失败
   * @ja 認証に失敗しました
   * @ko 인증 실패
   */
  AuthenticationFailed,
  /**
   * Public key unverified
   * @zh 公钥未通过验证
   * @ja 公開鍵が検証されていません
   * @ko 공개 키가 검증되지 않음
   */
  PublicKeyUnverified,
  /**
   * Channel out of order
   * @zh 通道顺序错误
   * @ja チャネルの順序が不正です
   * @ko 채널 순서가 잘못됨
   */
  ChannelOutOfOrder,
  /**
   * Channel failure
   * @zh 通道故障
   * @ja チャネルの障害
   * @ko 채널 실패
   */
  ChannelFailure,
  /**
   * Channel request denied
   * @zh 通道请求被拒绝
   * @ja チャネル要求が拒否されました
   * @ko 채널 요청이 거부됨
   */
  ChannelRequestDenied,
  /**
   * Channel unknown
   * @zh 未知通道
   * @ja 不明なチャネル
   * @ko 알 수 없는 채널
   */
  ChannelUnknown,
  /**
   * Channel window exceeded
   * @zh 超出通道窗口限制
   * @ja チャネルのウィンドウ制限を超えました
   * @ko 채널 윈도 제한을 초과함
   */
  ChannelWindowExceeded,
  /**
   * Channel packet exceeded
   * @zh 超出通道数据包大小限制
   * @ja チャネルのパケットサイズ制限を超えました
   * @ko 채널 패킷 크기 제한을 초과함
   */
  ChannelPacketExceeded,
  /**
   * Channel closed
   * @zh 通道已关闭
   * @ja チャネルが閉じられました
   * @ko 채널이 닫힘
   */
  ChannelClosed,
  /**
   * Channel EOF sent
   * @zh 已发送通道 EOF（数据结束）
   * @ja チャネルの EOF（データ終端）を送信しました
   * @ko 채널 EOF(데이터 끝)를 전송함
   */
  ChannelEofSent,
  /**
   * SCP protocol error
   * @zh SCP 协议错误
   * @ja SCP プロトコルエラー
   * @ko SCP 프로토콜 오류
   */
  ScpProtocol,
  /**
   * Zlib error
   * @zh Zlib 错误
   * @ja Zlib エラー
   * @ko Zlib 오류
   */
  ZlibError,
  /**
   * Request denied
   * @zh 请求被拒绝
   * @ja 要求が拒否されました
   * @ko 요청이 거부됨
   */
  RequestDenied,
  /**
   * Method not supported
   * @zh 不支持该方法
   * @ja この方式はサポートされていません
   * @ko 지원되지 않는 방식
   */
  MethodNotSupported,
  /**
   * Invalid data
   * @zh 无效数据
   * @ja 無効なデータ
   * @ko 유효하지 않은 데이터
   */
  InvalidData,
  /**
   * Public key protocol error
   * @zh 公钥协议错误
   * @ja 公開鍵プロトコルエラー
   * @ko 공개 키 프로토콜 오류
   */
  PublicKeyProtocol,
  /**
   * Buffer too small
   * @zh 缓冲区太小
   * @ja バッファーが小さすぎます
   * @ko 버퍼가 너무 작음
   */
  BufferTooSmall,
  /**
   * Bad usage
   * @zh 使用方式错误
   * @ja 使用方法が不正です
   * @ko 잘못된 사용
   */
  BadUse,
  /**
   * Compression error
   * @zh 压缩错误
   * @ja 圧縮エラー
   * @ko 압축 오류
   */
  CompressError,
  /**
   * Out of boundary
   * @zh 超出边界
   * @ja 境界外へのアクセス
   * @ko 경계를 벗어남
   */
  OutOfBoundary,
  /**
   * Agent protocol error
   * @zh 认证代理协议错误
   * @ja 認証エージェントのプロトコルエラー
   * @ko 인증 에이전트 프로토콜 오류
   */
  AgentProtocol,
  /**
   * Socket receive error
   * @zh 套接字接收错误
   * @ja ソケット受信エラー
   * @ko 소켓 수신 오류
   */
  SocketRecv,
  /**
   * Encryption failed
   * @zh 加密失败
   * @ja 暗号化に失敗しました
   * @ko 암호화 실패
   */
  EncryptError,
  /**
   * Bad socket
   * @zh 无效套接字
   * @ja 無効なソケット
   * @ko 잘못된 소켓
   */
  BadSocket,
  /**
   * Known hosts error
   * @zh 已知主机信息错误
   * @ja 既知のホスト情報のエラー
   * @ko 알려진 호스트 정보 오류
   */
  KnownHosts,
  /**
   * Channel window full
   * @zh 通道窗口已满
   * @ja チャネルのウィンドウが満杯です
   * @ko 채널 윈도가 가득 참
   */
  ChannelWindowFull,
  /**
   * Key file authentication failed
   * @zh 密钥文件认证失败
   * @ja 鍵ファイルによる認証に失敗しました
   * @ko 키 파일 인증 실패
   */
  KeyFileAuthenticationFailed,
  /**
   * End of file
   * @zh 文件结束
   * @ja ファイルの終端
   * @ko 파일 끝
   */
  EndOfFile,
  /**
   * No such file
   * @zh 文件不存在
   * @ja 該当するファイルがありません
   * @ko 해당 파일이 없음
   */
  NoSuchFile,
  /**
   * Permission denied
   * @zh 权限被拒绝
   * @ja アクセス権限がありません
   * @ko 권한이 거부됨
   */
  PermissionDenied,
  /**
   * Failure
   * @zh 失败
   * @ja 失敗
   * @ko 실패
   */
  Failure,
  /**
   * Bad message
   * @zh 消息格式错误
   * @ja 不正なメッセージ
   * @ko 잘못된 메시지
   */
  BadMessage,
  /**
   * No connection
   * @zh 尚未连接
   * @ja 接続がありません
   * @ko 연결이 없음
   */
  NoConnection,
  /**
   * Connection lost
   * @zh 连接已丢失
   * @ja 接続が失われました
   * @ko 연결이 끊어짐
   */
  ConnectionLost,
  /**
   * Operation unsupported
   * @zh 不支持该操作
   * @ja この操作はサポートされていません
   * @ko 지원되지 않는 작업
   */
  OperationUnsupported,
  /**
   * Invalid handle
   * @zh 无效句柄
   * @ja 無効なハンドル
   * @ko 유효하지 않은 핸들
   */
  InvalidHandle,
  /**
   * No such path
   * @zh 路径不存在
   * @ja 該当するパスがありません
   * @ko 해당 경로가 없음
   */
  NoSuchPath,
  /**
   * File already exists
   * @zh 文件已存在
   * @ja ファイルは既に存在します
   * @ko 파일이 이미 존재함
   */
  FileAlreadyExists,
  /**
   * Write protect
   * @zh 写保护
   * @ja 書き込み保護
   * @ko 쓰기 금지
   */
  WriteProtect,
  /**
   * No media
   * @zh 没有存储介质
   * @ja 記憶媒体がありません
   * @ko 저장 매체가 없음
   */
  NoMedia,
  /**
   * No space on filesystem
   * @zh 文件系统空间不足
   * @ja ファイルシステムに空き領域がありません
   * @ko 파일 시스템에 여유 공간이 없음
   */
  NoSpaceOnFileSystem,
  /**
   * Quota exceeded
   * @zh 超出配额
   * @ja クォータを超過しました
   * @ko 할당량을 초과함
   */
  QuotaExceeded,
  /**
   * Unknown principal
   * @zh 未知安全主体
   * @ja 不明なセキュリティプリンシパル
   * @ko 알 수 없는 보안 주체
   */
  UnknownPrincipal,
  /**
   * Lock conflict
   * @zh 锁冲突
   * @ja ロックの競合
   * @ko 잠금 충돌
   */
  LockConflict,
  /**
   * Directory not empty
   * @zh 目录非空
   * @ja ディレクトリが空ではありません
   * @ko 디렉터리가 비어 있지 않음
   */
  DirectoryNotEmpty,
  /**
   * Not a directory
   * @zh 不是目录
   * @ja ディレクトリではありません
   * @ko 디렉터리가 아님
   */
  NotADirectory,
  /**
   * Invalid filename
   * @zh 无效文件名
   * @ja 無効なファイル名
   * @ko 유효하지 않은 파일 이름
   */
  InvalidFilename,
  /**
   * Link loop
   * @zh 链接循环
   * @ja リンクの循環
   * @ko 링크 순환
   */
  LinkLoop,
  /**
   * Generic SFTP error
   * @zh 一般 SFTP 错误
   * @ja 一般的な SFTP エラー
   * @ko 일반 SFTP 오류
   */
  SftpError,
}
/**
 * SSH server host public key types.
 * @zh SSH 服务端主机公钥类型。
 * @ja SSH サーバーのホスト公開鍵の種類。
 * @ko SSH 서버 호스트 공개 키 유형.
 */
export enum SftpHostKeyType {
  /**
   * Unknown key type
   * @zh 未知密钥类型
   * @ja 不明な鍵の種類
   * @ko 알 수 없는 키 유형
   */
  Unknown,
  /**
   * RSA
   * @zh RSA
   * @ja RSA
   * @ko RSA
   */
  Rsa,
  /**
   * DSA
   * @zh DSA
   * @ja DSA
   * @ko DSA
   */
  Dsa,
  /**
   * NIST P-256 ECDSA
   * @zh NIST P-256 ECDSA
   * @ja NIST P-256 ECDSA
   * @ko NIST P-256 ECDSA
   */
  Ecdsa256,
  /**
   * NIST P-384 ECDSA
   * @zh NIST P-384 ECDSA
   * @ja NIST P-384 ECDSA
   * @ko NIST P-384 ECDSA
   */
  Ecdsa384,
  /**
   * NIST P-521 ECDSA
   * @zh NIST P-521 ECDSA
   * @ja NIST P-521 ECDSA
   * @ko NIST P-521 ECDSA
   */
  Ecdsa521,
  /**
   * ED25519
   * @zh ED25519
   * @ja ED25519
   * @ko ED25519
   */
  Ed25519,
}
