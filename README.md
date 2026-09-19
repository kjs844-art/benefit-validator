# 남은혜택 (Namun Hyetaek)

구독 서비스의 **남은 혜택**을 직접 기록하고, 결제 안내문이나 화면 캡처를 AI로 정리해
한눈에 확인하는 개인 기록 도구입니다.

> 남은혜택은 외부 서비스 계정에 로그인하거나 잔량을 **자동으로 조회하지 않습니다.**
> 모든 값은 사용자가 직접 입력했거나, 사용자가 붙여넣은 자료에서 추출한 것입니다.

## 실제 구현된 기능

- 비로그인 데모 체험 (`/demo`) — 브라우저 안에서만 동작하고 저장되지 않는 예시 데이터
- 이메일·비밀번호 회원가입 / 로그인 / 로그아웃
- Google·Microsoft 소셜 로그인
- 서비스(구독 계정) 등록·수정·삭제
- 혜택 직접 입력·수정·삭제 (단위, 지급량, 남은 양, 월 상한, 리셋 주기, 확인 시점, 출처)
- AI 자료 분석 — 텍스트 붙여넣기 + 화면 캡처 이미지 업로드
- AI 결과 검토 화면 — 항목 선택·값 수정·기존 서비스 또는 새 서비스로 저장
- 대시보드 (단위별 합계, 다시 확인이 필요한 항목)
- 일정 화면 (리셋 예정, 무료 체험 종료 예정)
- 내 데이터 JSON 내보내기
- MCP 서버 (`/mcp`) — ChatGPT·Claude 같은 AI 클라이언트가 사용자 계정으로 혜택을 조회·기록 (OAuth 동의 화면 포함)
- 새로고침·재로그인 후 데이터 유지 (서버 데이터베이스에 저장)

## 아직 없는 기능

- 외부 서비스 자동 연동 / 자동 잔량 조회 / 동기화
- 이메일·푸시 알림 발송 (일정은 화면에서만 확인)
- 팀·가족 공유, 다중 사용자 협업
- 데이터 가져오기(import) — 내보내기만 지원
- 네이버·카카오·GitHub·Facebook 소셜 로그인 (플랫폼이 기본 지원하지 않음)
- 외부 사이트에 로그인한 계정을 대신 조회해 주는 기능 (각 서비스의 공식 API 연동이 필요하고, "자동 조회 안 함" 원칙과 상충)
- 비밀번호 재설정 화면(`/reset-password`)
- 자동화 테스트 스위트 (아래 "테스트" 참고)

## 정확성 규칙 (의도된 동작)

| 규칙 | 구현 위치 |
| --- | --- |
| `null`(모름)과 `0`(실제 0)을 구분 | `src/lib/benefits.ts` (`formatAmount`, `isUnknown`), 입력 폼의 빈 칸 = 모름 |
| 지급량과 남은 양을 분리 저장 | `benefits.granted_amount` / `benefits.remaining_amount` |
| 단위가 다르면 합산하지 않음 | `sumByUnit()` — 단위별로만 합계 |
| 아는 값만 합산 (모름은 제외) | `sumByUnit()` |
| 확인 시점(관찰 시점)을 보존 | `observed_at` + `observed_precision`(`day`/`minute`) + `observed_timezone` |
| 날짜만 있는 자료에 가짜 시각을 붙이지 않음 | AI 저장 경로에서 `observed_precision = "day"` 로 기록 |
| 리셋 시각이 지나도 잔량을 자동 증가시키지 않음 | `isObservationStale()` — 값은 그대로 두고 "다시 확인 필요"만 표시 |
| 월 상한 등 추가 제한 보존 | `monthly_cap`, `extra_limit_note` |
| 무료 체험 종료 ≠ 계정 종료 | 상태값 `trial_ended` 라벨 및 일정 화면 안내 문구 |
| 데모 데이터와 실제 데이터 분리 | 데모는 `src/lib/demo-data.ts` 에서 브라우저 메모리에만 생성 |

## 기술 구성

- TanStack Start (React 19, Vite) — SSR + 서버 함수
- Lovable Cloud (PostgreSQL + 인증 + 서버 비밀키 관리)
- Tailwind CSS v4 + shadcn/ui
- Lovable AI Gateway (`openai/gpt-6-astra`) — 서버 함수에서만 호출

## 로컬 실행

```bash
bun install
cp .env.example .env    # 값 채우기
bun run dev             # http://localhost:8080
bun run build           # 프로덕션 빌드
bun run lint            # 린트
bunx tsgo --noEmit      # 타입 검사
```

## 환경변수

`.env.example` 참고. 실제 비밀값은 저장소에 커밋하지 마세요.

| 이름 | 위치 | 설명 |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | 브라우저 | 백엔드 URL (공개 값) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | 브라우저 | 공개 키 (RLS 로 보호됨) |
| `VITE_SUPABASE_PROJECT_ID` | 브라우저 | 프로젝트 식별자 |
| `SUPABASE_URL` | 서버 | 서버 함수용 백엔드 URL |
| `SUPABASE_PUBLISHABLE_KEY` | 서버 | 서버 함수용 공개 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 (비밀) | RLS 우회 관리자 키 — AI 사용량 기록에만 사용 |
| `LOVABLE_API_KEY` | 서버 (비밀) | AI Gateway 호출 키 |

Lovable Cloud 환경에서는 위 값들이 자동으로 주입됩니다. 외부로 옮길 때는 `DEPLOYMENT.md` 참고.

## 테스트

자동화 테스트 스위트는 아직 없습니다. 현재 검증 수단은 다음과 같습니다.

```bash
bunx tsgo --noEmit    # 타입 검사 (통과 확인됨)
bun run build         # 프로덕션 빌드 (통과 확인됨)
bun run lint          # 린트
```

수동 확인 항목은 `DEPLOYMENT.md` 의 "이전 후 확인 항목" 목록을 사용하세요.

## 데모 체험 방법

1. 앱 첫 화면에서 **"로그인 없이 데모 보기"** 를 누릅니다 (`/demo`).
2. 예시 서비스 3개와 혜택 5개가 표시됩니다. 값이 없는 항목은 "모름"으로,
   리셋 시각이 지난 항목은 "다시 확인 필요"로 표시됩니다.
3. 데모 화면의 "데모 데이터 내보내기"로 내려받은 파일에는 `"dataset": "demo"` 가 기록됩니다.
4. 데모 데이터는 저장되지 않으며 실제 계정 데이터와 섞이지 않습니다.
