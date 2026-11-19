# 공유 저장소, 배치 처리와 프리로드

Native가 모델 저장소, 리소스, 평가, 레이아웃과 렌더링을 소유합니다.
수치 뷰와 명령 배열을 프레임 사이에 유지하고 JavaScript로 쓴 뒤 한 번 알리거나 제출합니다.
[데이터 모델](data-models.ko.md)과 [측정 보고서](audit/6.3/architecture-performance-results.md)를 참고하세요.

## 수치 요소 명령

`new rmlui.ElementCommandBuffer(context, elements)`로 요소 슬롯을 한 번 등록합니다.
유지된 배열의 `opcodes`에 `ElementCommandOpcode.SetNumeric`,
`properties`에 `PropertyId.Width`, `units`에 `Unit.PX`를 설정합니다.
`elements[i]`는 슬롯, `numbers[i]`는 수치이며 마지막에 `submit(count)`를 호출합니다.
요소마다 `"2px"`를 만들고 해석할 필요가 없습니다.

Native는 앞부분 전체를 검증하고 스냅샷을 만든 뒤 순서대로 처리합니다. 조회는 이전 쓰기를 반영합니다.
검증 실패는 명령을 소비하지 않고 실행 실패는 완료분을 `consumed`에 남깁니다.
확장, 수집, shutdown 뒤에도 이전 뷰의 바이트를 안전하게 유지할 수 있습니다.

## 명시적인 데이터 뷰 배치

연결된 많은 요소에 같은 JS 수치 계산이 필요하면
`new rmlui.DataBatchView(model, elements, expressions, update, options)`를 사용합니다.
식마다 고정 슬롯을 등록하고 콜백에서 `slots`와 `inputs`의 변경 구간을 읽어
`commands`에 결과를 쓰고 명령 수를 반환합니다. 코드는 [영문 가이드](performance.md)에 있습니다.

기존 네이티브 스케줄러 순서를 유지하며 다른 그룹과 기존 뷰가 구간을 나눌 수 있습니다.
모든 문서에서 한 번만 콜백을 실행한다고 보장하지 않습니다. 의존성에 맞춰 `sortOffset`을 선택하세요.
예제의 `999`는 같은 깊이의 기본 속성 뷰 뒤에 배치합니다. 예외 발생 시 반환 명령을 적용하지 않습니다.
JS getter, transform과 기존 API의 개별 콜백 및 부수 효과는 유지됩니다.

## 창을 표시하기 전에 준비하기

먼저 초기화하고 창을 숨긴 다음 모든 리소스를 기다립니다.

```js
window.setVisible(false);
await rmlui.preloadResources({
  textures: [ 'images/menu.png' ],
  fonts: [{ source: 'fonts/menu.ttf', family: 'Menu' }],
});
document.show();
context.update();
window.clear(sfml.Color.Black);
window.flush();
context.render();
window.display();
window.setVisible(true);
```

텍스처 경로는 문서 또는 스타일시트의 해석된 경로와 같아야 합니다.
Native 작업 스레드가 파일 읽기, 이미지 디코딩, 알파 사전 곱셈을 수행합니다.
GPU 업로드와 글꼴 등록은 소유 스레드에서 실행합니다. 아틀라스는 레이아웃과 렌더링 중에 생성되므로
표시 전 프레임으로 준비합니다. 동일한 병렬 요청은 준비와 커밋을 공유합니다.
`signal`로 요청을 취소하고 `renderInterface`로 텍스처 캐시 소유자를 선택할 수 있습니다.

실패하면 Promise를 거부하지만 먼저 성공한 커밋은 유지합니다. 해당 리소스 해제와 shutdown은
대기 중인 커밋을 무효화합니다. 글꼴 바이트는 shutdown까지 Native가 소유하며
살아 있는 텍스처 핸들은 캐시 제거 후에도 리소스를 유지합니다.

## 렌더링 경계와 측정 범위

Context는 연속된 호환 지오메트리를 Native에서 합칩니다. 텍스처, 변환, 클립, shader,
레이어, 캡처 및 콜백 경계 전에 제출합니다. 직접 geometry를 그리는 API는 즉시 실행합니다.
정적 캐시는 다시 업로드하지 않고 같은 형태의 변경은 청크의 영향을 받은 범위를 업로드합니다.
상태가 바뀌면 여러 draw가 필요할 수 있습니다.

측정은 macOS arm64의 전체 CPU 프레임을 다룹니다. GPU 시간, 엔진 전체의 무할당이나
RmlUi 6.3 전체 API 완성을 증명하지는 않습니다.
