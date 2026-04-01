# Change Log

All notable changes to the "lang-global-helper" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

## [0.0.23]

- JSON 보내기: **`all_language.json`**은 **`targetSheetNames`** 접두에 맞는 키만 포함. **`other_lang.json`**은 생성하지 않음. 접두와 맞는 키가 없으면 경고 후 저장하지 않음.

## [0.0.22]

- 내부: `src/shared`를 도메인별 폴더(`language-dictionary`, `sheet-data`, `code-inspection`, `http-url`, `workspace-export`)로 재구성. 확장 동작·설정은 변경 없음.

## [0.0.21]

- JSON 보내기: 코드 접두사별 `wd_lang.json`, `st_lang.json`, `cd_lang.json`, `other_lang.json`
- 저장 경로 **`workspaceExportJsonPath`**(필수, 비우면 보내기 오류); 상대 경로·`..` 검증 (`workspaceExportPath` 유틸)
- 단일 파일 설정 `workspaceExportJsonFileName` 제거
- `workspaceExportJsonPath` 설정 설명 간소화(예: `language`)

## [0.0.20]

- 워크스페이스 루트에 동기화 사전 JSON 보내기 명령 (`Export synced dictionary to workspace JSON`)
- CSV/JSON API URL에 `https://` 자동 보정 및 URL 형식 검증 (`urlHelper`)
- README / README.ko: 명령 팔레트, JSON 보내기, 전체 설정 표, 동기화·Output, 문제 해결 보강

## [0.0.19]

- 동기화 성공/실패 시 Output 채널("Sheet Language Global Helper")에 로그 출력 및 패널 표시 (Cursor 등에서 성공 알림이 보이지 않는 환경 대응)

## [0.0.18]

- Extension settings: Sheet Service Account Json, Sheet Json URL 등 설정 항목이 설정 UI에 노출되도록 포함된 버전 배포

## [0.0.17]

- Re-publish (version bump for marketplace)

## [0.0.16]

- Initial release