# Roadmap

- [x] Gmail 읽기 전용 연결·해제와 메일 분석을 끝까지 구현
- [x] 메일에서 확인된 가입 서비스와 체험·쿠폰·크레딧·포인트·용량·결제·만료 정보를 근거와 신뢰도로 표시
- [x] 원문은 저장하지 않고 최소 분석 결과만 저장하며 사용자가 결과를 삭제 가능하게 구현
- [x] 데모에서 샘플 메일 분석 결과를 로그인 없이 유지
- [x] Google OAuth 설정값·Redirect URL·환경변수 문서화
- [x] Microsoft 메일 연결은 제출판에서 제외
- [x] 네이버·카카오 메일은 파일·캡처 가져오기로 지원하고 직접 연동은 보류
- [ ] 디자인 개선(텍스트 과다·PPT 느낌 정리 포함)은 제출 기능 완료 후로 보류
- [x] Google 서비스 연결 (Calendar/Drive/Sheets/Docs 등) — 빌더 계정 데이터 접근용
- [x] X(Twitter) 연결 — 사용자 요청으로 건너뜀
- [x] "구글 계정만으로 가입 사이트·잔여 크레딧 조회" 가능 범위 정리 (Google이 타사 가입 목록/크레딧 잔량 API를 제공하지 않음 — Gmail 메일 분석 방식으로 구현)
- [x] Gmail 연결 흐름 실검증: 가입→/gmail→연결 버튼→실제 Google 로그인 화면(accounts.google.com) 팝업 확인. Google 로그인 이후 동의~분석은 사용자 본인 계정 필요
- [x] 전체 화면 디자인 개선: taste 스킬 적용 — Libre Baskerville+IBM Plex Sans KR 글꼴, 잉크+민트 유지, 숫자 tabular 정렬, 카드 호버/그림자, 그레인 질감, 첫 화면 히어로 재구성. tsgo 통과, 데스크톱·모바일 캡처 확인, 넘침 없음, 콘솔 오류 없음
- [x] GitHub 코드 동기화(Git sync) 연결 — kjs844-art/benefit-validator 저장소 생성, 실시간 양방향 동기화 확인(최신 커밋 f7c05de 반영)
- [x] Google 연결 후 메일에서 발견한 혜택을 카테고리별로 바로 보여주는 주 흐름으로 개편
- [x] 수동 서비스 등록·별도 AI 분석을 주 흐름과 메뉴에서 제거
- [x] 로그인된 실제 계정으로 Google 연결→발견 결과 전체 흐름 검증 — kjs844@gmail.com 실제 연결·자동 스캔 성공: 21개 서비스 53건 발견(2026-09-20)
- [x] Google OAuth 일반 사용자 공개 전환 — 프로덕션 전환 완료(사용자 확인), Gmail 연결 403 해소
- [x] 공개 배포 완료 — https://benefit-buddy-check.lovable.app (고정 제출 링크)

## 제출 후 정식 제품화 (점진적)
- [ ] 도메인 연결 — 프로젝트 설정 → 도메인, 연결 후 Google 브랜딩 링크 3개(홈페이지·개인정보처리방침·약관) 갱신
- [ ] Google 앱 검증(verification) — gmail.readonly 민감 범위, 사용자 100명 초과 전 필요. 동의 화면 "확인되지 않은 앱" 경고 해소
- [ ] DB·서버 교체/수정 검토 — 현재 Lovable Cloud(Supabase). 외부 이전 시 export 형식(v2), RLS·암호화 키(APP_USER_CONNECTION_KEY_SECRET) 마이그레이션 포함 설계
- [ ] 디자인 심화 — og:image 전용 이미지(1200x630), favicon 교체, shadcn button/input 다듬기, MCP 동의·Gmail 복귀 화면 위계 정리, BenefitForm 3분할
- [ ] 사용자 피드백 기반 기능 고도화 (네이버·카카오 직접 연동 재검토 포함)

- [x] 심사위원용: 첫 화면에서 "로그인 없이 데모 보기"를 주요 버튼으로 노출 (구글 연결 없이 결과 확인 가능)
- [x] 구글 승인 대기 중 대안: 로그인 후 "메일 붙여넣어 찾기"(자료 분석)로 누구나 실제 분석 가능
- [ ] 구글 앱 검증(gmail.readonly 제한 권한) — 정식 서비스 단계에서 진행
