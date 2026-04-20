# Change Log

All notable changes to the "lang-global-helper" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

- **코드**: Output 채널 이름·생성 로직을 `src/shared/extension-output/sheetLanguageHelperOutputChannel.ts`로 통합; 동기화·JSON 보내기에서 공유.
- **동기화**: 원격 가져오기 실패 시(일반 Sync, `throwOnFetchFailure` 없음) **`langData`를 비우고 `{}` 반환** — 이전 사전을 “동기화된 것처럼” 돌려주지 않음.
- **JSON 보내기 로그**: 생성 폴더 경로·총계·`JSON별 키 수`(파일별 줄바꿈)·저장 완료; Debug Console은 동일 정보를 짧은 여러 줄로.
- **문서**: README / README.ko — 명령 설명, 실패 시 동작, 로그 형식 반영.

## [0.0.29]

- **JSON 보내기(Export) 안정화**: 시트에서 가져온 직후 **반환된 사전만** 워크스페이스 JSON에 쓰고, `throwOnFetchFailure`로 가져오기 실패 시 **파일을 쓰지 않음**(이전 데이터 잔류 방지). 동기화 큐는 그대로 유지.
- **동기화 로그**: `languageHelper.targetSheetNames`에 적힌 탭만 탭별 행 수 로그에 표시(`allSheetNames`로 전체 탭을 가져올 때도).
- **동기화 로그**: 동기화 완료·탭별 줄을 Output과 동일 내용으로 **Debug Console(`console.log`)**에도 출력.
- **명령 팔레트**: JSON 보내기 명령 제목을 **Sheet Language Global Helper: Sheet Sync to JSON**으로 정리.

## [0.0.28]

- **JSON 보내기(Export) 수정**: Export 실행 시 **Sheet Connect Sync와 완전히 동일한 코드 경로**(`runQueuedSyncJob`)로 최신 데이터를 가져온 뒤 JSON에 기록. 별도 Sync 실행 없이 항상 시트의 현재 상태가 반영됨. 이전 구현에서 다른 옵션으로 동기화를 호출하여 발생하던 구 데이터 잔류 문제 해결.
- **동기화 로그 강화**: 시트 탭별 전체 행 수 및 A열(첫 열) 값이 있는 행 수를 Output 채널에 출력.
- **Export 진단 로그**: 받은 키 수 → prefix 매칭 후 키 수 → 최종 언어 필터 후 키 수를 Output 채널("Sheet Language Global Helper")에 단계별 기록.
- **명령 팔레트 제목 변경**: `Export synced dictionary to workspace JSON` → `Sheet Sync to JSON` (시트 가져오기 포함 동작 명칭 반영).

## [0.0.27]

- **JSON 보내기(Export)**: 실행 시 **Sheet Connect Sync와 동일한** 원격 가져오기·검증·파싱·`globalState` 저장을 한 번 수행한 뒤, 그 스냅샷만 워크스페이스 JSON에 기록. 가져오기 실패 시 **JSON 파일은 쓰지 않음**(경고만 표시; 상세 오류는 동기화와 동일하게 표시).
- **동기화(`syncLanguageData`)**: Export 전용 옵션 `suppressSuccessToast` / `throwOnFetchFailure` 추가(성공·미설정 토스트 억제, 실패 시 재throw).
- 명령 팔레트 제목: Export 동작을 **“시트를 먼저 가져온 뒤 JSON으로 보냄”**에 맞게 문구 조정.

## [0.0.26]

- JSON 보내기: 시트(동기화 데이터)에 **실제로 존재하는 언어 열만** 키로 출력. 확장 허용 목록과 교집합하며, 시트에 없는 언어 코드는 JSON에 **포함하지 않음** (행이 나뉘면 열 이름은 전체 합집합 기준).

## [0.0.25]

- 설정 **`languageHelper.japaneseLanguageCode`** (`ja` | `jp`, **기본 `ja`**): 시트·JSON에 선택한 이름의 일본어 **열·필드**가 있어야 하며, 맞지 않으면 **동기화·JSON 보내기**에서 오류.
- 저장·워크스페이스 JSON export에는 일본어 키 **하나만** 포함 (`ja` 또는 `jp`).
- 인라인 번역 언어에 `ja`·`jp` 선택지 유지.

## [0.0.24]

- 언어 코드: 설정·Export 기준을 **`jp`**로 통일(기존 시트/API의 **`ja` 열은 가져올 때 `jp`로 정규화**). 워크스페이스 JSON 보내기에는 **확장에서 선언한 언어 코드만** 포함.
- 동기화가 느릴 때 Export가 **이전 데이터**를 쓰지 않도록, **진행 중인 동기화가 끝난 뒤** JSON 보내기가 실행되도록 함. Sync 요청은 **순차 큐**로 처리.
- 테스트: `compile-tests` 전 `out` 정리, JSON URL 테스트의 axios 모킹을 동일 모듈 인스턴스로 수정.

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