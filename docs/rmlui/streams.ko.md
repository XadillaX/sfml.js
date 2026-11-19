# RmlUi 바이트 스트림

`StreamMemory`, `StreamFile`, `Stream`은 RmlUi 바이트 스트림을 구현합니다.
`context.loadDocument(stream)`과
`container.loadStyleSheetContainer(stream)`은 현재 커서에서 파싱합니다.
상대 RCSS, 이미지, 글꼴 경로의 기준이 되도록 파싱 전에 원본 URL을 설정하세요.
RML의 `<head>`가 로드된 문서에 이 URL을 저장합니다.

```js
const { StreamMemory, SeekOrigin, StyleSheetContainer } = require('sfml.js-rmlui');
const source = new StreamMemory(Buffer.from(
  '<rml><head/><body id="panel"/></rml>'));

source.setSourceURL('/application/assets/panel.rml');
const document = context.loadDocument(source);

const rules = new StreamMemory(Buffer.from('#panel { width: 240px; }'));

rules.setSourceURL('/application/assets/panel.rcss');
const container = new StyleSheetContainer();

container.loadStyleSheetContainer(rules);
document.setStyleSheetContainer(container);

source.seek(0, SeekOrigin.Set);
console.log(source.readString(5)); // <rml>
```

## 메모리와 파일

`new StreamMemory()`는 초기 용량 256바이트의 네이티브 쓰기 저장소입니다.
숫자로 용량을 지정해도 초기 길이는 0입니다.
`Uint8Array`는 뷰 바이트를 복사해 네이티브 소유 읽기 전용 사본을 만듭니다.
원본 뷰를 수정하거나 분리해도 스트림에 영향을 주지 않습니다.
읽기 전용 사본은 모든 수정 작업을 거부합니다.

`read(count)`와 `peek(count)`는 독립 배열을 반환합니다. 뷰 형식은 바이트 수를
반환하고 대상 뷰 범위만 수정합니다. `rawStream()`은 커서와 관계없이 사용 중인
모든 바이트를 복사합니다. 반환 배열은 재할당이나 shutdown 후에도 유효합니다.

`write(string)`은 내장 널을 유지하고 `writeCString(string)`은 첫 널에서 멈춥니다.
`readString(count, initial)`은 널을 포함한 UTF-8을 디코딩해 초기 문자열에 추가합니다.
수는 JavaScript 문자 수가 아닌 바이트 수입니다. 스트림 복사는 대상이 적게 써도
소비한 원본 바이트 수를 반환하는 네이티브 RmlUi 동작을 유지합니다.

메모리의 `seek(offset, SeekOrigin.End)`는 `length - offset`입니다.
파일은 `length + offset`이며 사용자 스트림은 콜백 규칙을 따릅니다.
메모리 삭제는 커서를 새 길이 안으로 제한합니다. 앞쪽 제거는 커서를 뒤로 이동하고
0 이상으로 제한합니다. 과도한 pop 수는 현재 길이로 제한합니다.
자르기는 메모리 커서를 새 끝으로 이동합니다.

`new StreamFile()`은 아직 열지 않은 상태입니다. `open(path)`는 이전 핸들을 해제하고
설치된 RmlUi 파일 인터페이스로 엽니다. 파일은 읽기 전용입니다. `close()` 후 읽기,
탐색, 커서 조회에는 다시 열기가 필요합니다. shutdown은 파일 인터페이스를
파괴하기 전에 모든 파일을 자동으로 닫습니다.

바이트 배치와 메모리 용량은 `[0, 2147483647]` 범위의 정수여야 합니다.
분리되거나 공유되거나 크기를 바꿀 수 있는 버퍼는 거부됩니다.
원본 URL은 내장 널이 없는 문자열이어야 합니다.
shutdown은 래퍼를 무효화하지만 반환한 바이트 사본은 유지됩니다.

## 사용자 동기 스트림

`new Stream(callbacks, sourceUrl, mode)`에 `length`, `tell`, `seek`, `read`,
`write`, `truncate`, `isReadReady`, `isWriteReady` 구현을 전달합니다.
URL 기본값은 빈 값이며 모드는 `StreamMode.Read + StreamMode.Write`입니다.

읽기 콜백은 독립 임시 `Uint8Array`와 최대 수를 받습니다. 허용 범위를 채우고
`[0, count]` 범위의 정수를 반환하세요. 임시 버퍼 분리나 크기 변경은 금지됩니다.
쓰기 콜백은 독립 사본을 받으므로 수정해도 파서나 원본 입력에 영향을 주지 않습니다.
길이, 위치, 제거 수는 음수가 아닌 안전한 정수이며 준비 상태와 seek는 불리언입니다.

선택 `peek`의 기본 동작은 읽기 후 커서 복원입니다. `pushBack`은 탐색, 쓰기,
커서 복원이며 `popBack`은 자르기입니다. `pushFront`와 `popFront`는 구현이 필요합니다.
`isEOS`는 기본적으로 `tell() >= length()`입니다. `close`는 명시적
`stream.close()`에서만 실행하며 GC나 shutdown에서는 호출하지 않습니다.

메서드는 한 번 캡처하므로 나중에 콜백 객체를 수정해도 교체되지 않습니다.
같은 스트림 호출과 shutdown을 포함한 네이티브 API 재진입은 거부됩니다.
예외는 원래 JS 객체로 전파됩니다. Promise는 동기적으로 거부하고 거부 핸들러를
연결합니다. 문서 읽기 실패 시 문서를 붙이거나 load 이벤트를 발생시키지 않습니다.
스타일 파싱 실패 시 이전에 파싱한 규칙은 남을 수 있습니다.

소유자 참조는 GC에서 확인할 수 있어 불필요한 콜백 순환 참조도 회수됩니다.
