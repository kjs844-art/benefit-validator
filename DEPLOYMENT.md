# 배포 및 외부 이전 가이드

이 문서는 남은혜택을 Lovable 밖으로 옮길 때 필요한 작업을 정리합니다.

> **중요:** 앱 설정 화면의 "내 데이터 내보내기"는 **사용자 한 명의 서비스·혜택 데이터**만
> JSON 으로 내보내는 기능입니다. 소스 코드, 데이터베이스 전체, 로그인 시스템, 서버 비밀키는
> 포함되지 않습니다. 서비스 자체를 옮기는 작업은 이 문서의 절차를 따라야 합니다.

---

## 0. 현재 구조

```text
브라우저 (React / TanStack Start)
   │  RLS 적용 공개 키로 직접 읽기·쓰기 (services, benefits)
   │  서버 함수 호출 (AI 분석, 내보내기) — Authorization 베어러 토큰 자동 첨부
   ▼
TanStack 서버 함수 (Cloudflare Worker 런타임)
   ├─ requireSupabaseAuth 로 인증·소유권 검사
   ├─ consume_ai_quota (service_role) 로 AI 호출 한도 적용
   └─ Lovable AI Gateway (openai/gpt-6-astra)
   ▼
PostgreSQL (Lovable Cloud / Supabase) + Auth
```

---

## 1. 프런트엔드만 외부 호스팅으로 옮기는 경우

백엔드(데이터베이스·인증)는 그대로 두고 화면만 다른 호스팅으로 옮기는 경로입니다.

1. GitHub 저장소로 코드를 내보냅니다(아래 4번).
2. 호스팅(예: Cloudflare Workers, Vercel, Netlify)에서 이 저장소를 연결합니다.
   이 앱은 SSR + 서버 함수를 쓰므로 **정적 호스팅만으로는 동작하지 않습니다.**
   Node 또는 Worker 런타임이 필요합니다.
3. 빌드 명령 `bun run build`, 산출물은 어댑터 기본 경로를 사용합니다.
4. 환경변수 7개(`README.md` 표)를 호스팅의 환경변수에 등록합니다.
5. 백엔드(Supabase/Cloud) 인증 설정의 **Site URL 과 Redirect URL** 에 새 도메인을 추가합니다.
   추가하지 않으면 가입 확인 메일 링크가 예전 주소로 돌아갑니다.
6. 남는 의존성: 데이터베이스, 인증, AI 호출은 여전히 Lovable Cloud 를 통해 동작합니다.

## 2. 백엔드까지 옮기는 경우

> **일반 PostgreSQL 서버만 준비한다고 해서 인증·파일 저장·서버 함수가 자동으로 대체되지 않습니다.**
> PostgreSQL 은 표(테이블) 저장만 담당합니다. 아래 항목은 각각 따로 준비해야 합니다.

| 구성 요소 | 현재 | 옮길 때 필요한 작업 |
| --- | --- | --- |
| 데이터베이스 | Lovable Cloud(Supabase) PostgreSQL | 새 PostgreSQL 에 `drizzle/migrations/` 적용 |
| 행 단위 보안(RLS) | `auth.uid()` 기반 정책 | 새 환경에도 동일 정책 필요. `auth.uid()` 가 없으면 서버에서 소유권 검사 코드로 대체 |
| 회원 인증 | Supabase Auth (`auth.users`) | Supabase 자체 호스팅, 또는 다른 인증 제공자로 교체 + 클라이언트 코드 수정 |
| 세션·토큰 검증 | `src/integrations/supabase/auth-middleware.ts` | 새 인증 제공자의 토큰 검증으로 교체 |
| 서버 함수 | TanStack `createServerFn` (Worker) | Node/Worker 런타임이 있는 호스팅 필요 |
| 파일 저장 | 사용하지 않음 (이미지는 저장하지 않고 분석 후 폐기) | 추가 작업 없음 |
| AI 호출 | Lovable AI Gateway | 다른 제공자로 교체 (아래 6번) |

### 데이터 이전

1. 스키마: `drizzle/migrations/0000_create_namun_hyetaek_core.sql` 을 새 데이터베이스에 실행합니다.
2. 데이터: `pg_dump` 로 `public.services`, `public.benefits`, `public.ai_usage` 를 옮깁니다.
3. 사용자 계정(`auth.users`)은 인증 제공자의 이전 절차를 따로 따라야 하며,
   비밀번호 해시를 옮길 수 없는 경우 사용자에게 재설정을 안내해야 합니다.

## 3. 데이터베이스 구조

```text
services (id, user_id, name, provider, plan_name, account_label, timezone,
          subscription_status, trial_ends_at, notes, created_at, updated_at)

benefits (id, user_id, service_id → services.id ON DELETE CASCADE,
          name, unit,
          granted_amount NULL 가능,      -- NULL = 모름, 0 = 실제 0
          remaining_amount NULL 가능,
          monthly_cap, extra_limit_note,
          reset_rule, reset_anchor,
          observed_at, observed_precision('minute'|'day'), observed_timezone,
          source_kind('manual'|'ai_text'|'ai_image'|'import'), source_note,
          created_at, updated_at)

ai_usage (user_id, usage_date, call_count)   -- 서버 전용 호출 한도 기록
```

- 모든 표에 RLS 활성화, 정책은 `auth.uid() = user_id` 로만 허용.
- `anon`(비로그인) 역할에는 어떤 표도 열려 있지 않습니다. 데모는 서버 데이터를 쓰지 않습니다.
- `consume_ai_quota(uuid, integer)` 함수는 `service_role` 만 실행할 수 있습니다.

## 4. GitHub 연동 (내 승인이 필요한 작업)

이 작업은 대신 수행할 수 없습니다. 직접 해 주셔야 합니다.

1. Lovable 편집기 오른쪽 위 **GitHub** 버튼 → **Connect to GitHub**.
2. GitHub 계정 인증 후 설치할 조직/계정을 선택합니다.
3. **Create Repository** 를 눌러 저장소를 만듭니다. 이후 변경 사항이 자동 반영됩니다.

연결 전까지는 GitHub 백업이 존재하지 않습니다.

## 5. 회원 인증과 리디렉션 설정

- 가입 확인 메일 링크는 `window.location.origin` 으로 돌아옵니다.
- 새 도메인을 쓰면 인증 설정의 Site URL / Redirect URL 목록에 해당 도메인을 추가해야 합니다.
- 비밀번호 재설정 화면은 아직 없습니다. 추가하려면 `/reset-password` 라우트와
  `supabase.auth.resetPasswordForEmail` 호출을 함께 구현해야 합니다.

## 6. AI 제공자·호출 경로 변경 지점

변경이 필요한 파일은 하나입니다: `src/lib/ai.functions.ts`

- `baseURL`: `https://ai.gateway.lovable.dev/v1`
- 인증 헤더: `Lovable-API-Key: ${LOVABLE_API_KEY}`
- 모델: `openai/gpt-6-astra`
- 호출 한도: `DAILY_AI_LIMIT`(사용자당 하루 20회) + `consume_ai_quota` 함수

다른 제공자로 옮기려면 위 네 가지와 환경변수 이름만 바꾸면 됩니다.
프롬프트와 결과 스키마는 그대로 재사용할 수 있습니다.

## 7. Lovable Cloud 에 남는 의존성

프런트엔드만 옮긴 경우에도 다음은 계속 Lovable Cloud 를 사용합니다.

- PostgreSQL 데이터베이스와 RLS 정책
- 회원 인증(`auth.users`, 이메일 발송)
- `SUPABASE_SERVICE_ROLE_KEY`, `LOVABLE_API_KEY` 등 서버 비밀키 보관
- AI Gateway 호출과 그 사용량 과금

## 8. 이전 후 확인 항목

- [ ] 첫 화면과 `/demo` 가 비로그인 상태에서 열린다
- [ ] 회원가입 → 확인 메일 링크 → 로그인이 새 도메인에서 동작한다
- [ ] 서비스 등록, 혜택 추가·수정·삭제가 저장된다
- [ ] 새로고침과 재로그인 후에도 데이터가 남아 있다
- [ ] 다른 계정으로 로그인하면 상대방 데이터가 보이지 않는다
- [ ] AI 분석이 동작하고, 하루 한도 초과 시 서버가 거부한다
- [ ] 내 데이터 내보내기 JSON 에 본인 데이터만 들어 있다
- [ ] 존재하지 않는 주소(`/없는주소`)에서 404 화면이 뜬다
- [ ] 모바일 화면 너비에서 주요 화면이 깨지지 않는다
