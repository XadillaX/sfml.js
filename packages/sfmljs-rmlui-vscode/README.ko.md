# VS Code용 RmlUi

[English](README.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · **한국어**

RmlUi 6.3 RML／RCSS의 구문 강조, 코드 조각, 자동 완성, 호버 설명, 진단 및 색상
미리보기를 제공합니다. 언어 서버가 포함되어 실행 시 `node_modules`가 필요하지 않습니다.

## 빌드와 설치

기존 저장소에서 `node tools/bootstrap.cjs`를 실행한 뒤 다음 명령을 사용합니다.

```sh
npm --prefix packages/sfmljs-rmlui-language-server test
npm --prefix packages/sfmljs-rmlui-vscode test
npm --prefix packages/sfmljs-rmlui-vscode run vsix -- --out rmlui.vsix
code --install-extension packages/sfmljs-rmlui-vscode/rmlui.vsix
```

VSIX 출력 경로를 필요에 맞게 지정합니다. VS Code 1.80 이상이 필요합니다.
`.rml` 또는 `.rcss` 파일을 열면 확장이 활성화됩니다.

## 명령과 설정

명령 팔레트에서 RML／RCSS 설명서, 속성 색인, 데이터 바인딩 설명서와
**RmlUi: Restart RmlUi language server**를 사용할 수 있습니다.
`rmlui` 설정은 알 수 없는 속성, 태그, 의사 클래스 진단, 작업 공간 ID／class 자동 완성,
서버 추적을 제어합니다. 사용자 정의 태그는 네이티브 instancer가 제공할 수 있으므로
알 수 없는 태그는 힌트로 표시합니다.

## 검증

이 패키지의 `npm run test:editor`는 설치된 `code` CLI와 현재 빌드로 실제 활성화,
명령, 자동 완성, 진단, 호버, 색상 및 서버 재시작을 확인합니다. 저장하지 않은 문서를
사용하며 별도 편집기 프로필을 만들거나 VS Code를 다운로드하거나 저장소를 복사하지
않습니다. CLI 이름이 다르면 `VSCODE_CLI`를 설정합니다.

`python tools/packaging/verify-vsix.py <archive.vsix>`로 아카이브를 확인합니다.
포함된 파일을 현재 빌드와 바이트 단위로 비교하고 소스, 테스트, 의존성 및 소스 맵이
포함되지 않았는지 확인합니다.
