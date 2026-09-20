# KeyAtlas 기술 결정 기록

## Google 계정 기반 서비스 조회

Google 로그인(OpenID Connect)은 사용자 식별자, 이메일, 프로필 같은 승인된 클레임을 제공하지만 사용자가 Google로 가입한 모든 외부 사이트 목록이나 각 사이트의 무료체험·잔여 크레딧을 반환하지 않는다. Google 계정의 서드 파티 연결 목록은 사용자가 `myaccount.google.com/linkedapps`에서 검토할 수 있지만, KeyAtlas가 그 전체 목록을 읽는 일반 공개 API는 제공되지 않는다.

따라서 KeyAtlas의 안전하고 구현 가능한 수집 계층은 다음과 같다.

1. Google 로그인: 본인 확인과 KeyAtlas 계정 생성.
2. Gmail 읽기 전용 연결: 사용자가 별도로 승인한 경우 가입·환영·체험·크레딧·쿠폰·영수증·만료 메일에서 근거가 확인된 항목만 추출.
3. 서비스별 공식 API: 제공되는 서비스에 한해 실제 잔량과 상태를 조회하는 선택형 커넥터.
4. 직접 입력 및 캡처 분석: 메일이나 공식 API에 없는 항목을 사용자가 보완.

비공개 Google 계정 페이지를 스크래핑하거나 사용자의 비밀번호·세션을 수집하는 방식은 사용하지 않는다.

### 공식 근거

- Google OpenID Connect: 로그인 토큰은 `sub`, `email`, `profile` 등 요청한 인증 클레임을 제공한다. 외부 서비스 가입 목록은 클레임에 포함되지 않는다. https://developers.google.com/identity/openid-connect/openid-connect
- Google 계정 서드 파티 연결 관리: 연결 목록은 사용자가 Google 계정의 연결된 앱 화면에서 직접 검토·관리한다. https://support.google.com/accounts/answer/13533235?hl=ko
- Gmail API 권한: 메일 분석에는 별도의 Gmail OAuth 범위가 필요하다. https://developers.google.com/workspace/gmail/api/auth/scopes

## WebMCP

KeyAtlas는 기존 서버형 MCP(`/mcp`)와 별도로 브라우저 네이티브 WebMCP를 점진적 향상 방식으로 제공한다. WebMCP는 현재 제안 단계이며 Chrome 149부터 origin trial 대상이다. 로컬 개발에서는 Chrome 플래그가 필요할 수 있다.

브라우저 도구는 `document.modelContext.registerTool()`로 등록하며, JSON Schema 입력, `readOnlyHint`, `untrustedContentHint`, `consequentialHint`를 사용한다. KeyAtlas는 개인정보 최소화를 위해 메일 본문과 제목을 WebMCP 결과로 반환하지 않고, 서비스명·혜택명·날짜·수량·신뢰도만 제공한다. 모든 도구는 현재 로그인 사용자의 화면에 이미 로드된 데이터만 사용한다.

### 공식 근거

- Chrome WebMCP 개요 및 origin trial: https://developer.chrome.com/docs/ai/webmcp
- Imperative API: https://developer.chrome.com/docs/ai/webmcp/imperative-api
- 보안 지침: https://developer.chrome.com/docs/ai/webmcp/secure-tools
- WebMCP 초안 사양: https://webmachinelearning.github.io/webmcp
