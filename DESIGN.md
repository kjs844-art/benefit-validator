# 남은혜택 디자인 시스템 / Lovable 인수인계

이 문서는 **Lovable에게 그대로 전달하기 위한 문서**입니다.
Claude Code가 디자인을 전면 정리했고, 이후 Lovable이 화면을 추가하거나 고칠 때
아래 규칙을 지켜야 화면이 다시 "AI가 찍어낸 티 나는" 상태로 돌아가지 않습니다.

맨 아래 **[7] Lovable에게 붙여넣을 프롬프트** 를 복사해서 Lovable 채팅창에 넣으면 됩니다.

---

## [1] 디자인 방향 한 줄

> 차분한 정밀함(calm precision). 이 제품은 "남은 것을 적어 두는 장부"이므로
> 명세서(statement)의 문법을 빌린다. 얇은 구분선, 표 형태 숫자, 메타데이터용 모노 서체,
> 그리고 **강조색은 단 하나**.

셋업 기준값: 레이아웃 변주 6 / 모션 3 / 정보 밀도 5 (10점 만점).
즉 화려함보다 정확함이 우선, 애니메이션은 등장 효과만.

---

## [2] 반드시 지켜야 할 규칙

### 색

| 규칙 | 내용 |
| --- | --- |
| 강조색은 하나뿐 | `--primary` (청자색 celadon). 다른 장식용 색을 새로 만들지 않는다. |
| sand = 의미 전용 | `--unknown` 는 **"값을 모름"** 에만 쓴다. 예쁘다고 장식에 쓰지 않는다. |
| clay = 의미 전용 | `--destructive` 는 삭제 등 되돌릴 수 없는 동작에만 쓴다. |
| 하드코딩 금지 | 컴포넌트에 `#hex` / `oklch(...)` 직접 쓰지 않는다. 항상 토큰(`bg-primary`, `text-unknown` 등). |
| 새 색이 필요하면 | 먼저 `src/styles.css` 의 `:root` 에 토큰으로 추가하고, 이유를 주석으로 남긴다. |
| 0은 강조색이 아니다 | 잔량 `0` 은 흰색, 양수만 청자색, `null` 은 sand("모름"). 이 규칙은 `<Amount />` 안에 이미 들어 있다. |

배경은 순수 검정(`#000`)을 쓰지 않는다. 이미 약간 푸른빛이 도는 중성 잉크 톤으로 맞춰져 있다.

### 서체 (한국어 UI 기준, 이 부분이 제일 자주 깨집니다)

| 규칙 | 이유 |
| --- | --- |
| 본문·제목 모두 **Pretendard** | 제목용 별도 서체를 쓰지 않는다. 굵기와 크기로만 위계를 만든다. |
| **세리프 금지** | 라틴 세리프에는 한글 글리프가 없어서 조용히 폴백된다. 즉 아무 효과가 없다. (이전 버전의 Libre Baskerville이 그랬다.) |
| **한글에 `font-mono` 금지** | 모노 서체에 한글이 없어 한글은 폴백되는데 **공백 문자만 모노로 남아** 단어 사이가 벌어진다. 모노는 숫자·날짜·이메일 등 라틴 문자에만. |
| `tracking-tighter`, `leading-none` 금지 | 영문 기준 값이다. 한글은 받침 때문에 더 넉넉한 행간이 필요하다. 제목 `line-height: 1.3`, 본문 `1.7` 이 기본값으로 걸려 있다. |
| `uppercase` / 넓은 `letter-spacing` 금지 | 둘 다 라틴 전용 장치다. 한글 라벨에 쓰면 그냥 글자가 흩어진다. |
| `word-break: keep-all` 유지 | `body` 에 걸려 있다. 지우면 한글이 단어 중간에서 잘린다. |

### 형태·여백

- 모서리: 패널/카드 `rounded-lg`(10px), 버튼/인풋 `rounded-md`(8px), 상태 칩만 `rounded-full`. **이 세 가지가 전부다.**
- 여백: 페이지 헤더 아래 `mt-6`~`mt-8`, 섹션 사이 `space-y-10`, 카드 안쪽 `p-5`, 큰 패널 `p-6`.
- 카드는 "위계가 실제로 있을 때"만 쓴다. 단순 묶음은 `border-t` / `divide-y` / 여백으로 처리한다.
- 긴 목록의 모든 행에 위아래 테두리를 다 넣지 않는다. 패널 하나 안에서 `divide-y` 하나만 쓴다.

### 모션

- 등장 애니메이션만. `rise`, `rise-1~3` 유틸리티 사용 (0.4초, 6px 이동).
- 무한 반복 애니메이션, 네온 글로우, 커스텀 마우스 커서 금지.
- `prefers-reduced-motion` 처리는 이미 전역으로 들어가 있다. 지우지 말 것.

### 하지 말아야 할 것 (이것만 피해도 티가 안 납니다)

- 보라/파랑 그라데이션 배경, 네온 글로우, 그라데이션 글자
- 똑같이 생긴 3단 기능 카드
- 이모지 (아이콘이 필요하면 `lucide-react`, `strokeWidth={1.5}` 로 통일)
- **em 대시(—) 사용 금지.** 쉼표, 마침표, 괄호, 줄바꿈으로 바꾼다.
- 가운뎃점(·) 남발 금지. 한 줄에 최대 1개. 여러 개를 나열해야 하면 `gap` 으로 띄운다.
  (단어를 잇는 용법인 "서비스·혜택"은 괜찮다.)
- `<div>` 로 만든 가짜 제품 화면 목업. 필요하면 **실제 스크린샷**을 쓴다.
- 장식용 색 점(dot), "Step 1 / Step 2" 라벨, 섹션 번호 eyebrow("01 / 소개"), 스크롤 유도 문구

---

## [3] 새로 만든 공용 컴포넌트 (새 화면은 이걸 조립해서 만든다)

| 파일 | 내보내는 것 | 용도 |
| --- | --- | --- |
| `src/components/brand.tsx` | `Wordmark`, `Mark` | 로고. 테두리 사각형 안에 아래쪽이 채워진 도형 = "남은 양". |
| `src/components/page.tsx` | `PageHeader`, `SectionHeading`, `EmptyState` | 모든 화면의 머리말과 빈 상태. 화면마다 여백을 새로 정하지 않기 위해 존재한다. |
| `src/components/figures.tsx` | `Amount`, `Meter`, `Chip`, `StatStrip`, `DetailRow` | 숫자와 라벨. **숫자는 반드시 `Amount` 를 거친다.** |
| `src/components/ServiceHeading.tsx` | `ServiceHeading` | 서비스 이름 + 상태 칩 + 메타 줄. |
| `src/components/AppShell.tsx` | `AppShell` | 로그인 후 공통 틀. 데스크톱은 좌측 레일, 1024px 미만은 상단 바 + 가로 스크롤 탭. |

### 새 화면 기본 뼈대

```tsx
<AppShell email={user?.email}>
  <PageHeader
    eyebrow="짧은 분류"
    title="화면 이름"
    description="이 화면이 무엇을 하는지 한 문장."
    actions={<Button>주요 동작</Button>}
  />

  {/* 숫자 요약이 필요하면 */}
  <div className="mt-6">
    <StatStrip items={[{ label: "회 합계", value: <Amount value={13} unit="회" tone="primary" size="lg" />, hint: "아는 값만 더합니다" }]} />
  </div>

  {/* 본문 */}
  <div className="mt-12 space-y-10">...</div>
</AppShell>
```

### 숫자를 표시할 때

```tsx
// null → "모름"(sand), 0 → 흰색, 양수 → 청자색. 이 판단은 컴포넌트가 한다.
<Amount value={benefit.remaining_amount} unit={benefit.unit} tone="primary" size="lg" />
```

직접 `{value ?? 0}` 같은 코드를 쓰지 않는다. **`null`(모름)과 `0`(실제 0)은 다른 값이다.**
이건 디자인 규칙이 아니라 이 제품의 핵심 규칙이다.

---

## [4] 이번에 바뀐 것 (요약)

- 디자인 토큰 전면 교체: 단일 강조색(청자색), 중성 잉크 배경, 의미 전용 sand/clay
- 서체 교체: Libre Baskerville + IBM Plex Sans KR → **Pretendard + IBM Plex Mono**
- 한국어 조판 규칙 추가: `word-break: keep-all`, 행간 1.7, 제목 행간 1.3
- 로그인 후 화면에 **좌측 레일 내비게이션** 추가 (기존: 상단 텍스트 링크 나열)
- 랜딩 전면 재구성: 히어로(실제 데모 스크린샷 사용), 찾는 방법, 기록 원칙, 되는 것/안 되는 것, 마지막 CTA, 푸터
- 혜택 카드를 명세서 형태로 재설계 (잔량이 가장 크게, 근거는 구분선 아래 라벨 크기로)
- 빈 상태·로딩 상태를 실제 레이아웃 모양에 맞춤
- 화면에 보이는 em 대시 전부 제거
- `hour12: false` 로 SSR 하이드레이션 불일치 해결 (아래 [5] 참고)

---

## [5] Lovable이 확인해 주었으면 하는 것 / 알아야 할 것

### 5-1. Pretendard CDN 렌더링 확인 필요 (중요)

Claude Code 작업 환경에서 `cdn.jsdelivr.net` 이 네트워크 정책으로 차단되어
**Pretendard가 실제로 적용된 화면을 확인하지 못했습니다.**

- 폴백은 정상 동작을 확인했습니다 (IBM Plex Sans KR로 떨어지며, 그 상태로도 레이아웃이 깨지지 않습니다).
- 배포 후 한 번만 확인해 주세요: 개발자도구 Network 탭에서
  `pretendardvariable-dynamic-subset.min.css` 가 200으로 오는지.
- 만약 CDN이 느리거나 막히면, Pretendard를 `public/fonts/` 에 셀프 호스팅하고
  `src/routes/__root.tsx` 의 링크를 교체하는 쪽이 더 안전합니다.

### 5-2. `public/preview-demo.png` 은 실제 화면 스크린샷입니다

랜딩 히어로 이미지는 `/demo` 화면을 1280×980으로 실제 캡처한 파일입니다.
가짜 목업이 아니기 때문에 **데모 화면 디자인이 바뀌면 이 이미지도 다시 캡처해서 교체해야 합니다.**
교체하지 않으면 랜딩과 실제 화면이 달라 보입니다.

### 5-3. `vite preview` 는 이 저장소에서 동작하지 않습니다 (기존 문제)

- `npx vite build` 는 성공합니다. 서버 번들은 `.output/server/` 에 생성됩니다.
- 그런데 TanStack Start의 preview 플러그인은 `dist/server/server.js` 를 찾아서 모든 요청이 500이 됩니다.
- **이번 디자인 변경과 무관한 기존 경로 불일치입니다.**
- 로컬 확인은 `vite dev`, 배포는 nitro(`npx nitro deploy --prebuilt`)를 쓰면 됩니다.
- 고칠 수 있으면 고쳐 주세요. 못 고쳐도 배포에는 지장이 없습니다.

### 5-4. lint 가 이미 깨져 있습니다 (이번 변경 이전부터)

`npx eslint .` 을 돌리면 **에러 437건**이 나옵니다. 대부분은 `eslint-plugin-prettier` 가
잡아내는 포맷 문제이고, 이번 디자인 변경 이전부터 `main` 에 있던 것입니다.
포맷 외 실제 에러는 아래 2건입니다.

```
src/integrations/supabase/previewAuthStorage.ts:54  'timer' is never reassigned. Use 'const'
src/routes/_authenticated/gmail.tsx:39              'poll' is never reassigned. Use 'const'
```

이번 변경에서 **새로 작성한 파일은 전부 포맷이 맞춰져 있습니다.**
저장소 전체에 `prettier --write` 를 돌리면 한 번에 정리되지만, 그러면 디자인 변경 diff가
포맷 변경 수백 줄에 묻히기 때문에 이번 PR에서는 일부러 건드리지 않았습니다.

**Lovable에게 부탁:** 이 PR이 머지된 뒤에 별도로
`npx prettier --write "src/**/*.{ts,tsx,css}"` 를 한 번 돌려서 포맷을 정리해 주세요.
그 다음부터 `npm run lint` 가 의미 있는 경고만 내게 됩니다.

### 5-5. 날짜 포맷은 24시간제로 고정했습니다

서버 런타임은 ko-KR 오전/오후를 `AM`/`PM` 으로, 브라우저는 `오전`/`오후` 로 렌더해서
React가 하이드레이션 때 트리를 버리고 다시 그리는 문제가 있었습니다.

**새로 날짜/시간 포맷을 추가할 때는 반드시 `hour12: false` 를 넣어 주세요.**

```ts
new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short", hour12: false })
```

### 5-6. 로그인 후 화면은 스크린샷으로 확인하지 못했습니다

`/dashboard`, `/services`, `/analyze`, `/gmail`, `/schedule`, `/settings` 는 인증이 필요해
임시 라우트로 `AppShell` + 대시보드 구성만 렌더해 확인했고, 그 임시 파일은 삭제했습니다.
타입 검사와 빌드는 모두 통과했지만, **실제 데이터가 들어간 상태는 한 번 눈으로 봐 주세요.**
특히 서비스 이름이 아주 길 때 `ServiceHeading` 의 줄바꿈을 확인해 주세요.

---

## [6] 앞으로 이 디자인을 유지하는 법

새 화면이나 컴포넌트를 만들 때 아래 질문에 전부 "예"가 나와야 합니다.

1. 색을 토큰으로만 썼는가? 강조색은 여전히 하나인가?
2. 한글에 모노 서체나 넓은 자간, uppercase를 쓰지 않았는가?
3. 모서리 반경이 10 / 8 / pill 세 가지 안에 있는가?
4. 숫자를 `Amount` 로 표시했는가? `null` 과 `0` 을 구분했는가?
5. 화면에 보이는 글에 em 대시(—)가 없는가?
6. 빈 상태와 로딩 상태를 만들었는가? 로딩은 최종 레이아웃 모양과 닮았는가?
7. 이모지, 장식용 색 점, "Step 1/2/3" 라벨이 없는가?

---

## [7] Lovable에게 붙여넣을 프롬프트

아래 내용을 그대로 복사해서 Lovable 채팅에 넣으세요.

```
이 프로젝트의 디자인 규칙은 저장소 루트의 DESIGN.md 에 정리되어 있습니다.
앞으로 화면을 추가하거나 수정할 때 DESIGN.md 를 먼저 읽고 그 규칙을 지켜 주세요.

특히 다음은 절대 어기지 마세요.
1. 강조색은 --primary(청자색) 하나뿐입니다. 새 장식용 색을 만들지 마세요.
   --unknown(sand)은 "값을 모름", --destructive(clay)는 삭제 동작에만 씁니다.
2. 색을 컴포넌트에 hex나 oklch로 직접 쓰지 말고 토큰(bg-primary 등)만 쓰세요.
3. 한글 텍스트에 font-mono, uppercase, 넓은 letter-spacing, tracking-tighter,
   leading-none 을 쓰지 마세요. 모노 서체는 숫자·날짜·이메일 같은 라틴 문자에만 씁니다.
4. 세리프 서체를 쓰지 마세요. 본문과 제목 모두 Pretendard이고 굵기로만 위계를 만듭니다.
5. 모서리 반경은 패널 rounded-lg, 버튼/인풋 rounded-md, 상태 칩만 rounded-full.
6. 숫자는 반드시 src/components/figures.tsx 의 <Amount /> 로 표시하세요.
   null은 "모름", 0은 실제 0이며 서로 다른 값입니다. 절대 섞지 마세요.
7. 화면에 보이는 글에 em 대시(—)를 쓰지 마세요. 쉼표나 마침표로 바꾸세요.
   가운뎃점(·)은 한 줄에 하나까지만 쓰세요.
8. 이모지, 보라/파랑 그라데이션, 네온 글로우, 똑같이 생긴 3단 카드,
   div로 만든 가짜 화면 목업을 쓰지 마세요. 아이콘은 lucide-react, strokeWidth 1.5로 통일합니다.
9. 새 화면은 PageHeader / SectionHeading / EmptyState / StatStrip / Chip /
   ServiceHeading / AppShell 을 조립해서 만드세요. 새로 비슷한 컴포넌트를 만들지 마세요.
10. 새 날짜 포맷에는 반드시 hour12: false 를 넣으세요.
    (서버와 브라우저의 ko-KR 오전/오후 표기가 달라 하이드레이션이 깨집니다.)

그리고 아래 세 가지를 확인해 주세요.
- 배포 후 Pretendard CDN(cdn.jsdelivr.net)이 정상 로드되는지
- vite preview 가 dist/server/server.js 를 찾는데 실제 빌드는 .output/server 에 나오는 문제
- lint 에러 437건 (대부분 prettier 포맷, 기존 문제). 이 PR 머지 후
  `npx prettier --write "src/**/*.{ts,tsx,css}"` 한 번 돌려서 정리
```
