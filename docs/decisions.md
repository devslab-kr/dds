# DDS Decision Log

파운데이션·아키텍처 결정 기록 (CLAUDE.md 컨벤션, asklinq Decision Log 형식).
새 엔트리는 위에 추가.

---

## D-035 — 링크가 닿는 모든 `id`는 붙는 헤더 아래에 멈춘다: 루트 `scroll-padding`이 아니라 대상의 명시도 0 `scroll-margin` (2026-10-06)

**결정.** `styles.css`에 `:where(.site-header ~ [id], .site-header ~ * [id]) { scroll-margin-block-start: calc(var(--site-header-block-size, 64px) + 1px + var(--dds-space-16)) }`. 킷 헤더 뒤(`MarketingShell`의 `<main>`·바닥글과 그 안)의 `id` 요소는 링크로 이동하면 헤더(64px) + 테두리(1px) + 16px, 즉 뷰포트 위에서 81px에 멈춘다. 섹션·히어로의 기존 8px 간격(`site-sections.css`)은 그대로다.

**계기.** 2026-10-06 프로덕션: 동의 바의 "자세히 보기"(`/ko/privacy#analytics`)로 들어가면 제목이 붙는 헤더(65px) 밑에 깔렸다 — TraceLinq 0px, AskLinq 48px. 섹션에만 간격이 있었고 일반 제목에는 없었다. BookLinq는 자기 `app.css`에 `[id]` `scroll-margin`을 따로 두고 있었다 — 같은 고침이 제품마다 하나씩 생기는 모양.

**근거.**
- **루트 `scroll-padding`을 반려한 이유.** `scroll-padding`은 대상의 `scroll-margin`과 더해진다. `html`에 헤더 높이만큼 주면 이미 `scroll-margin`이 있는 섹션이 72px → 153px로 밀린다. 섹션 쪽을 `:has()`로 0으로 되돌리는 규칙을 더하면 두 규칙이 서로를 알아야 한다. 또 `html`에 둔 값은 `.site-shell`에 정한 `--site-header-block-size`를 읽지 못한다(README가 허락한 위치).
- **대상의 `scroll-margin`, 형제 결합자, 명시도 0.** `.site-header ~` 는 `MarketingShell` 구조(헤더 다음에 `<main>`·바닥글)만으로 "킷 헤더가 있는 페이지"를 고르므로 `:has()`가 필요 없고, 값을 섹션과 같은 자리(`.site-shell` 아래)에서 읽는다. `:where()`라 섹션 규칙(0,1,0)이 더해지지 않고 이기며, 제품 규칙도 이긴다(D-032와 같은 이유).
- **16px.** 섹션은 자기 안쪽 여백(64px)이 있어 8px로 충분했지만 제목은 여백이 없어 헤더 선에 붙어 보인다.

**측정(Playwright, 실제 `MarketingShell` dist, 360·390·1440px).** 닫힌 헤더 아래 끝은 세 폭 모두 65px. 고치기 전: `#analytics`·`#retention` 제목 위 끝 −0.2 ~ −0.4px(헤더 밑). 고친 뒤: 80.6 ~ 80.8px. 섹션 `#faq`는 전후 모두 71.5px.

**트레이드오프.** 닫힌 헤더 높이 기준이다. 데스크톱에서 메뉴가 줄바꿈되어 헤더가 두 줄이 되는 제품은 그 폭에서 `--site-header-block-size`를 올려야 한다(킷은 실제 헤더 높이를 재지 않는다 — 하이드레이션 전, 첫 스크롤에 이미 맞아야 하므로 CSS만). `MarketingShell` 없이 헤더와 본문을 형제가 아닌 구조로 짠 제품에는 적용되지 않는다.

**재검토 시점.** 헤더가 여러 줄이 되는 제품이 생길 때, `MarketingShell`의 헤더·`<main>` 구조가 바뀔 때.

---

## D-034 — 분석은 옵트인: 허용 전에는 구글에 닿는 것이 없고, 동의는 site-kit이 한 벌로 싣는다 (2026-10-05)

**결정.** 소유자 결정(2026-10-05): 가족 사이트의 분석은 옵트인이다. 방문자가 현재 정책 버전에 대해 분석을 허용하기 전에는 Tag Manager 로더·gtag·GA 쿠키 어느 것도 돌지 않고, 동의하지 않아도 서비스는 그대로 동작한다. `@devslab/site-kit`이 그 동의를 한 벌로 싣는다.

- 코어(프레임워크 중립, 의존성 0, `src/core/consent.mjs`): `createConsentManager`(쿠키 읽기·쓰기, Consent Mode, 허용 시 Tag Manager 동적 로드, 철회), `readConsentCookie`·`consentCookieGrantsAnalytics`(서버·브라우저 공통), `consentHeadScript`, `postConsentRecord`·`parseConsentRecord`·`isSameOriginRequest`(기록), 기본 문구 `CONSENT_MESSAGES_KO`·`CONSENT_MESSAGES_EN`.
- Solid: `ConsentBanner`(아래 바 + 설정 대화상자), `ConsentSettingsButton`, `SiteFooter`의 `consentSettings`(바닥글 "쿠키 설정").
- TanStack 어댑터: `toTanStackHead(metadata, { consent: { policyVersion, gtm, cookie } })`와 `consentHeadEntry`. 요청 쿠키가 현재 버전의 허용일 때만 로더를 싣고, 아니면 Consent Mode 기본값(전부 denied)만 싣는다.
- 기존 `gtm` 옵션·`gtmHeadEntry`(D-031)는 호환으로 남긴다. 묻지 않고 로드하므로 가족 제품은 `consent`로 옮긴다(README). 둘을 같이 주면 `TypeError`.

**약속(코드와 테스트가 고정).**
- 항목은 둘. *필수*는 정보로만 보여 주고 조작 요소가 없다(설정 대화상자에서 체크박스가 아니라 배지). *분석*은 기본 꺼짐, 미리 체크하지 않음. 광고 항목이 없으므로 `ad_storage`·`ad_user_data`·`ad_personalization`은 늘 denied.
- 쿠키 `site_consent=v=<정책>&a=<0|1>&t=<유닉스 초>&id=<16진 32자>`: 퍼스트파티, `Path=/`, `SameSite=Lax`, `Secure`, 12개월, `HttpOnly` 아님. 파서는 이 네 키만 받는다. `t`가 12개월보다 오래됐거나 미래면 결정이 없는 것으로 본다.
- 정책 버전이 다르면 다시 묻고, 답하기 전에는 아무것도 로드하지 않는다. 익명 id는 이어진다.
- 허용: `consent update {analytics_storage: granted}` 뒤에 Tag Manager를 한 번, 페이지의 nonce(`csp-nonce` meta, 없으면 첫 `[nonce]` 요소의 `.nonce` 속성)로 로드한다.
- 철회: `denied`로 업데이트, `ga-disable-<측정 ID>`, 호스트와 모든 상위 도메인에서 `_ga`·`_ga_*`·`_gid`·`_gat*` 삭제. `gtm`을 주는 매니저는 `measurementIds`가 필수다(비면 `RangeError`). 이미 초기화된 GA4 태그는 자체 리스너(히스토리 페이지뷰·스크롤·외부 링크 클릭)로 `dataLayer` 게이트를 거치지 않고 새로고침 전까지 쿠키 없는 핑을 보내므로, 그것을 멈추는 유일한 스위치인 `ga-disable-<id>`를 빠뜨릴 수 없게 했다.
- 캐시: head가 요청 쿠키로 달라지므로 `consent`를 쓰는 응답은 모두 `CONSENT_RESPONSE_HEADERS`(`Cache-Control: private, no-store`, `Vary: Cookie`)를 보낸다. 공유 캐시가 허용한 방문자의 HTML(로더 포함)을 저장해 동의하지 않은 방문자에게 주면 허용 전에 구글에 닿는다. 캐시되어야 하는 라우트는 거부 쪽 head만 렌더하고 하이드레이션 뒤에 매니저가 로드한다(정적 내보내기와 같은 길).
- `dataLayer` 게이트: 분석이 허용되지 않은 동안 페이지의 `dataLayer.push`는 동의 명령만 통과시키고 나머지는 버린다. 동의 전에 쌓인 이벤트가 나중에 로드되는 Tag Manager로 흘러가지 않고, 철회 뒤의 이벤트는 이미 로드된 Tag Manager에 닿지 않는다.
- 닫기(✕·Esc)는 결정이 아니다. 쿠키를 쓰지 않고, 다음 방문에 다시 묻는다.
- 바의 세 선택(모두 허용·거부·설정)과 대화상자의 세 버튼은 같은 tone(secondary), 같은 트랙 폭이다. 브라우저 테스트가 폭·높이·색·굵기가 같음을 잰다.
- 배너는 서버에서도 하이드레이션 중에도 렌더하지 않고 마운트 뒤에 나온다. 자바스크립트가 없으면 바도 분석도 없다.
- 기록: 결정마다 `{policyVersion, analytics, action, anonymousId, decidedAt, source, path}`를 제품 백엔드로 POST(같은 출처 경로만 허용). action은 `grant`(이 버전에서 허용됨)·`deny`(첫 결정이 거부)·`withdraw`(허용 → 거부)·`update`(같은 선택 재저장). 네트워크·429·5xx 실패는 `localStorage`에 남겼다가 다음 `start()`에서 다시 보낸다. 서버의 `parseConsentRecord`는 일곱 키 정확히, `analytics`와 맞는 action, 쿼리 없는 경로, 31일 이내 `decidedAt`만 받는다. 참고 테이블(추가 전용)과 "유효 기간 + 3년" 정리 SQL은 README에 있다. 주체(로그인 사용자 id·로그인 id 사본)·IP·UA는 서버가 붙인다.

**계기.** GTM을 가족 네 사이트와 devslab.kr에 실은 날(D-031, devslab.kr #83–#88) 소유자가 동의 팝업과 동의 기록을 요구했다. 네 제품이 각자 만들면 네 가지 쿠키 형식, 네 가지 "필수" 표현, 네 가지 철회 동작이 생긴다 — 파비콘(D-026)과 같은 모양이고, 여기서는 잘못 만든 쪽이 법적 문제가 된다.

**근거.**
- **기본값만이 아니라 로더 자체를 막는다.** Consent Mode의 "고급" 방식(Tag Manager는 늘 로드하고 denied 상태에서 쿠키 없는 핑을 보냄)은 동의 전에 `gtm.js` 요청과 핑이 구글로 간다 — 옵트인 계약 위반. 그래서 기본값(전부 denied)은 이중 장치일 뿐이고, 주 장치는 "허용 전에는 로더를 그리지도 넣지도 않는다"이다. 테스트가 거부 쪽 head 문자열에 구글 호스트가 없음을, 브라우저에서 구글 요청이 0건임을 잰다.
- **로더는 서버가 쿠키를 보고 고르고, 브라우저가 허용 순간에 넣는다.** 서버 렌더는 요청 쿠키로, 하이드레이션은 `document.cookie`로 같은 스크립트를 낸다(`createIsomorphicFn`). 허용 순간에는 매니저가 같은 페이지에서 새로고침 없이 `gtm.js`를 넣는다. 둘 다 `gtm.js`가 이미 있으면 건너뛰어 한 번만 로드된다.
- **nonce.** 동적으로 넣는 `gtm.js`는 nonce CSP(가족 제품 전부)에서 nonce가 있어야 돈다. 헤더 CSP 아래에서 브라우저는 `getAttribute('nonce')`를 숨기지만 `.nonce` 속성은 남는다(D-031). 브라우저 테스트가 `script-src 'nonce-…'`만 있는 CSP 아래에서 `gtm.js`가 실행됨을 확인한다.
- **배너는 마운트 뒤에.** 서버 렌더면 제품마다 쿠키를 넘기는 방식에 배너가 묶이고, 하이드레이션 키 위험(D-027/D-028)을 새로 진다. 비용은 바가 한 프레임 늦게 뜨는 것뿐이다. 개발 빌드 하이드레이션 테스트가 바닥글 버튼이 서버 것 그대로 채택되고 잃은 키가 0임을 고정한다.
- **같은 무게.** 개인정보 보호법의 선택 동의는 따로 받고, 미리 체크하지 않고, 서비스와 묶지 않는다. 허용만 강조색인 바는 그 취지에 어긋난다.

**반려한 대안.**
- **기존 `gtm` 옵션을 동의 게이트로 바꿈** — 0.x minor에서 소비자 네 곳의 동작이 조용히 바뀐다. 명시적 `consent` 옵션 + 둘 다 주면 에러로 간다.
- **localStorage에 동의 저장** — 서버가 읽지 못해 로더를 서버에서 걸러낼 수 없다.
- **철회 시 페이지 새로고침** — 확실하지만 작성 중인 입력을 잃는다. 대신 게이트 + `ga-disable` + 콘솔의 추가 동의 설정.
- **기록 엔드포인트를 킷이 소유** — 제품마다 백엔드(D1·Supabase·Spring)가 다르다. 킷은 보내기·검증·참고 스키마까지.
- **제3자 동의 관리 플랫폼(CMP)** — 처리자와 스크립트가 하나 더 늘고, 항목이 둘뿐인 사이트에 과하다.

**트레이드오프.**
- 동의 전 이벤트는 버려진다(재생 없음). 허용한 페이지의 통계는 `gtm.js`가 로드된 뒤부터다.
- 철회 뒤에도 Tag Manager는 그 페이지의 메모리에 남는다. 게이트가 `dataLayer`를 막지만 Tag Manager 내부 리스너까지 막는다고 장담하지 않는다 — 그래서 GA4 태그마다 "태그 실행에 추가 동의 필요: `analytics_storage`" 콘솔 설정이 필요하다(소유자 작업, README).
- 저장소가 막히고 POST가 계속 실패하면 쿠키에는 결정이 있는데 기록이 없을 수 있다.
- 상위 도메인(`.devslab.kr`)의 GA 쿠키를 지우면 같은 쿠키를 쓰는 형제 하위 도메인의 GA 식별자도 지워진다.
- 정적 내보내기 사이트(devslab.kr)는 빌드 때 쿠키를 모르므로 허용한 방문자도 하이드레이션 뒤에야 로드된다.

**재검토 시점.** 광고 항목이 생길 때, 로그인 제품이 이 킷을 쓸 때(기록 주체가 사용자), 구글이 Consent Mode 요구를 바꿀 때, 동의율 데이터가 쌓여 바 문구·위치를 다시 볼 때.

**추가(2026-10-06) — 첫 제품 적용(BookLinq)에서 나온 결함 둘.**
- **루트가 선언한 export가 실행 시 없었다.** `index.d.mts`는 `consent.mjs`를 통째로(`export *`) 다시 내보내는데 `index.mjs`는 손으로 쓴 목록이었고, 그 목록에 10개가 빠졌다(`CONSENT_RECORD_MAX_BYTES`·`CONSENT_MAX_AGE_SECONDS`·`CONSENT_POLICY_VERSION_PATTERN`·`CONSENT_ANONYMOUS_ID_PATTERN`·`CONSENT_ACTIONS`·`GA_COOKIE_PATTERN`·`parseConsentCookie`·`formatConsentCookie`·`serializeConsentCookie`·`normalizeConsentPath`). 타입 검사는 통과하고 값은 `undefined` — README의 `content-length > CONSENT_RECORD_MAX_BYTES`는 늘 거짓이라 크기 검사가 한 번도 걸리지 않았다. 고침: `index.mjs`를 `index.d.mts`와 같은 문장(모듈마다 `export *`)으로. 다른 일곱 모듈은 목록이 이미 전부였으므로 실행 결과는 같다. 재발 방지: `verify-site-kit-release.mjs`가 tarball을 새 소비자에 설치하고, 진입점마다 tsc가 읽은 선언(`keyof typeof ns` — 소비자가 import할 수 있는 값 export 그대로)과 그 진입점이 가리키는 파일마다의 실제 export(`./solid`는 브라우저 빌드와 서버 빌드를 각각, 해당 조건으로 자식 프로세스에서 import)를 양방향으로 비교한다. 수정 전 코드에서 정확히 이 10개를 이름으로 대며 실패한다. 소스 단계 테스트도 `consent.mjs`의 모든 export가 루트에 같은 값으로 있는지, 두 배럴의 문장이 같은지 본다 — 고른 몇 개만 확인하던 것이 이 구멍이었다.
- **390px 세 칸에서 라벨이 단어 중간에서 끊겼다.** 제품 라벨(독일어 "Einstellungen", 스페인어 "Configuración", 포르투갈어 "Configurações", 타밀어 "நிராகரிக்கவும்", 텔루구어 "తిరస్కరించండి")이 킷 기본 문구보다 길다. 원인은 둘: dds.css 버튼의 `overflow-wrap: anywhere`(버튼 라벨이 어디서든 끊김), 그리고 휴대폰 폭의 세 칸(라벨 폭 약 80px). 고침:
  - 동의 버튼만 `overflow-wrap: normal; word-break: normal`, `:lang(ko)`는 `word-break: keep-all` — 줄은 공백에서만 바뀐다. 페이지 뿌리 규칙(D-030)과 상관없이 버튼이 스스로 정한다. keep-all은 한국어만(일본어·중국어는 글자 사이가 줄바꿈 자리, D-030과 같은 이유). dds.css의 버튼 규칙은 그대로 둔다 — 모든 제품의 모든 버튼에 걸린다.
  - 배치는 바 자신의 너비(컨테이너 쿼리 `site-consent`)로 세 단계: 60rem 초과는 한 줄(문구·선택·✕, 선택 트랙은 `fit-content(50%)`), 60rem 이하는 문구 아래 세 칸 한 줄, 36rem 이하는 세 선택을 세로로 쌓는다 — 전체 너비, `grid-auto-rows: 1fr`로 줄이 다른 라벨도 같은 높이. 설정 대화상자는 자기 내용 너비(`site-consent-dialog`, 패딩 제외) 32rem 이하에서 쌓는다. 340px 미디어 쿼리는 없앴다.
  - 한 줄 경계 720px → 60rem: 한 줄 바의 선택 트랙이 `auto`라 긴 라벨의 max-content를 다 가져갔고, 768px 타밀어에서 문구 칸이 약 80px로 눌려 버튼과 겹쳤다(수정 전 CSS의 브라우저 측정·스크린샷).
- **근거.** 임계값은 넉넉하게: 36rem에서 세 칸 라벨 폭 142px, 대화상자 32rem에서 131px — 실측 최장 단어(타밀어 111px, Windows Chromium)보다 크다. 라벨을 재서 고르는 JS는 마운트 뒤 한 번 더 배치하고 테스트 표면이 는다; 요청도 임계값이었다. 컨테이너인 이유: 바는 지금 뷰포트 전체 폭이라 미디어 쿼리와 같지만, 대화상자는 뷰포트보다 좁고(36rem 상한) 문제는 그 안의 칸 폭이다. `overflow-wrap: normal`이면 칸보다 긴 단어는 끊기는 대신 넘친다 — 그래서 브라우저 테스트가 넘침을 같이 잰다.
- **검증.** `tests/browser/site-kit-consent.spec.ts`: 여섯 언어(위 다섯 + 일부러 쌓여도 줄이 바뀌는 긴 한국어) × 320·360·390px에서 단어 중간 줄바꿈 0(`Intl.Segmenter` 단어마다 Range의 줄 수), 같은 크기·같은 칠, 세로로 쌓임, 가로 넘침 0 — 바와 대화상자 모두. 600·768·1024·1280px에서는 한 줄에 셋, 문구 18rem 이상, 문구와 겹치지 않음. 수정 전 CSS에서 15개 실패("Einstellungen" 등 단어 분리, 문구 0px), 한국어 `keep-all` 줄을 빼면 3개 실패("허용합니다" 분리).
- **트레이드오프.** 킷 기본 라벨(모두 허용·거부·설정)도 576px 이하에서 쌓인다(전에는 340px 이하) — 휴대폰에서 바가 약 96px 높아진다. 721–960px 화면(세로 태블릿)은 한 줄 대신 두 줄 바다.
- **재검토.** 36rem 세 칸에서도 넘치는 라벨이 나오면 — 그 문자열을 브라우저 테스트에 넣고 임계값을 올리거나 라벨 측정으로 간다.
- **바 문구는 짧게, 고지는 제품의 방침에(소유자 결정 2026-10-06).** 소유자: 바의 본문이 "너무 적나라"하다. 최종 결정:
  - 바: 한국어 "이용 통계 수집 동의 (선택)" / "서비스를 더 낫게 만들기 위해 이용 통계를 수집합니다. 동의는 선택이며, 동의하지 않아도 모든 기능을 쓸 수 있습니다." + "자세히 보기", 영어 "Analytics (optional)" / "We collect usage statistics to improve the service. It's optional, and everything works without it." + "Learn more". 세 버튼은 그대로.
  - "자세히 보기"는 제품의 개인정보처리방침에서 이용 통계·국외 이전을 다루는 절로 가는 **링크**(본문 안의 평범한 링크 — 세 버튼과 무게를 다투지 않는다)다. 대화상자를 열거나 바 안에서 펼치지 않는다. 주소는 제품이 주는 필수 prop `learnMoreHref`이고, `#fragment`가 없으면 배너가 `RangeError`를 던진다 — `measurementIds`와 같은 이유로, 방침 첫머리에 조용히 떨어지는 링크보다 렌더(서버 포함)에서 크게 실패하는 쪽을 택했다.
  - 설정 대화상자는 최소한: 필수(항상 사용, 한 줄), 분석(꺼진 스위치, 한 줄), 방침 링크(`privacyHref`), 같은 무게의 버튼 둘 — 취소(✕·Esc처럼 저장 없이 닫기)·선택 저장. 위 **약속**의 "대화상자의 세 버튼"은 이제 두 버튼이다. 모두 허용·거부는 바에 남고, 대화상자에서는 스위치 + 저장으로 같은 결정을 한다.
  - 킷 기본 문구에서 Google LLC·미국·14개월 등 고지 문장을 뺐다(테스트가 그런 말이 없음을 고정). 고지는 제품의 방침 절이 한다 — 제품마다 받는 곳·보관 기간이 다를 수 있고, 기본 문구가 그것을 말하면 제품의 방침이 말하지 않아도 그럴듯하게 보인다. 대화상자의 안내 한 줄은 철회 경로(바닥글의 쿠키 설정)만 남긴다.
  - 제품 할 일(체인지셋): `learnMoreHref` 넘기기, 그 절에 전체 고지(Google Analytics 4, Google LLC, 미국 이전, 보관 기간, 광고 미사용, 철회 방법)가 있는지 확인, 다른 로케일을 같은 톤으로 맞추고 `learnMore`·`cancel` 키 추가.
  - 트레이드오프: 바에서 바로 읽히던 받는 곳·국가·기간이 한 번의 이동 뒤로 간다. 동의 시점의 고지가 충분한지는 링크된 절의 내용에 달렸다 — 킷이 아니라 제품의 방침이 그 책임을 진다.

---

## D-033 — 가족 서체 파일은 site-kit이 한 번 싣고, face 이름은 토큰 이름 그대로 (2026-10-05)

**결정.** `@devslab/site-kit`이 가족 서체의 woff2와 `@font-face`를 싣는다(소유자 결정 "공용 글꼴 패키지로 통일").

- `fonts.css`(새 진입점 `@devslab/site-kit/fonts.css`) + `fonts/{geist,geist-mono,pretendard}/*.woff2` + 디렉터리마다 `LICENSE.txt`(SIL OFL 1.1) + `fonts/manifest.json`(원본 패키지·버전·tarball integrity·파일별 크기·sha256·unicode-range). `exports`에 `./fonts.css`와 `./fonts/*`.
- **face 이름 = 토큰 이름.** `"Geist"`·`"Geist Mono"`·`"Pretendard"`. 토큰(`--dds-font-family-sans` = `Geist, Pretendard, …`, `-mono` = `'Geist Mono', …`)은 바꾸지 않는다. 스타일시트를 불러오면 D-032의 뿌리 규칙과 토큰을 쓰는 모든 곳이 이름을 바꾸지 않고 이 파일로 이어진다.
- 파일: Geist·Geist Mono는 `@fontsource-variable/geist{,-mono}@5.3.0`의 문자권별 normal 서브셋(5개·6개, 가변 100–900), Pretendard는 `pretendard@1.3.9`의 **저작자 동적 서브셋** 92개(가변 45–920). 모두 `unicode-range`, `font-display: swap`, `format("woff2")`, url은 `fonts.css` 기준 상대 경로.
- `fonts.css`는 매니페스트에서 생성한다(`scripts/build-fonts.mjs`). `--check`(site-kit `check`와 소스 단계 계약 테스트)는 의존성 없이 파일·라이선스·스타일시트가 매니페스트와 일치하는지, 매니페스트 밖 파일이 없는지 본다. `--vendor`는 버전을 올릴 때 npm 레지스트리에서 원본 tarball을 받아 sha512 integrity를 확인하고 다시 쓴다.
- 미리 받기는 옵트인: 코어 `fontPreloadLinks(href)`·`FAMILY_FONT_PRELOAD_FILE`, `toTanStackHead(metadata, { fontPreload })`. href는 제품 번들러가 준 같은 도메인 경로(`?url` import)이고 `crossorigin="anonymous"`를 붙인다.

**계기.** 네 제품이 같은 서체를 네 가지로 다루고 있었다. BookLinq는 스크립트로 `public/fonts/`에 복사(그중 Pretendard는 2 MB 단일 파일), TraceLinq는 빌드 스크립트 복사 + 자체 `@font-face`(Pretendard 역시 2 MB 단일 파일), VisionLinq는 `@fontsource-variable/geist` 스타일시트를 링크하고 Pretendard는 기기에 맡김, AskLinq는 글꼴 파일이 없다. 그리고 셋 다 `"Geist Variable"`·`"Pretendard Variable"`로 등록해 토큰의 `Geist`·`Pretendard`와 이름이 달랐다 — 자체 호스팅 face가 토큰 스택에 잡히지 않는다. D-032가 재검토 조건으로 적은 바로 그 상황이다.

**근거.**
- **이름을 토큰에 맞추고 토큰은 그대로.** 토큰 값을 `"Geist Variable", …`로 바꾸면 소비자 사본(D-009, `check-consumers`)이 모두 낡고, 그 이름은 원본 패키지가 자기 사본에 붙인 이름일 뿐 서체의 이름이 아니다. 반대로 face를 토큰 이름으로 등록하면 토큰을 쓰는 모든 곳이 바뀌지 않고, 제품이 옮겨 올 때 할 일은 자기 리터럴 스택의 이름 셋을 바꾸는 것(또는 지우는 것)뿐이다. 브라우저 테스트가 실제 Chromium에서 토큰 스택으로 세 패밀리가 `loaded` 됨을 고정하고, face 이름을 `"Geist Variable"`로 바꾸는 뮤테이션은 실패한다.
- **site-kit에.** 이미 제3자 자산을 라이선스와 함께 싣고 생성·`--check`하는 패키지다(국기, D-017/D-020). 네 제품이 모두 의존하고, D-032가 페이지 뿌리 서체를 site-kit에 두었다. 새 패키지는 npm Trusted Publisher를 패키지마다 소유자가 등록해야 한다(0.12.2 발행 사고).
- **Pretendard는 저작자의 동적 서브셋.** OFL의 예약 글꼴 이름(Reserved Font Name "Pretendard") 때문에 우리가 잘라 낸 서브셋은 Pretendard라는 이름을 쓸 수 없다. 저작자가 배포한 서브셋을 수정 없이 재배포하면 쓸 수 있다. 크기: 단일 `PretendardVariable.woff2` 2,057,688 B 대신, 한국어 랜딩이 실제로 받는 양은 Chromium 실측 getasklinq.app 12개 305 KB, gettracelinq.app/ko 14개 347 KB, getbooklinq.app 16개 424 KB, 이 결정 로그 2만 자 21개 527 KB. 서브셋 범위는 서로 겹치지 않고 한글 음절 11,172자와 호환 자모를 모두 덮는다(테스트).
- **Geist는 문자권별 서브셋.** 전체 가변 파일 69.6 KB 대신 latin 29.4 KB(Mono 71.4 KB 대신 23.1 KB). 베트남어(가족 로케일 vi)·라틴 확장·키릴은 그 글자가 있을 때만 받는다.
- **상대 url + 번들러.** Vite(TanStack Start)는 `@import "@devslab/site-kit/fonts.css"`의 url을 `node_modules`에서 따라가 제품 자기 `/assets/`에 해시 이름으로 낸다 — `font-src 'self'`가 그대로다. 모든 face가 Vite 기본 인라인 한도 4,096 B보다 크다(최소 5,812 B) — 작으면 `data:` URI가 되어 CSP에 막힌다. 테스트가 이 하한을 고정한다. 릴리스 검증이 실제 tarball을 새 소비자에 설치해 Vite로 빌드하고, face 103개가 `dist/assets`에 있고 스타일시트가 그것만 가리키며 `?url` preload가 같은 파일임을 확인한다.

**반려한 대안.**
- **토큰을 `"Geist Variable"`·`"Pretendard Variable"`로** — 위의 소비자 사본 낡음, 그리고 원본 패키지 사정에 토큰을 맞추는 일.
- **두 이름 모두 등록(별칭 `@font-face`)** — 규칙 206개, 옮겨 오지 않은 제품이 옛 이름을 계속 써도 아무 신호가 없다. 옮겨 오는 일은 제품당 이름 셋 바꾸기다.
- **새 패키지 `@devslab/dds-fonts`** — 위의 Trusted Publisher 등록 부담. 모바일 앱 등 site-kit 밖 소비자가 생기면 다시 본다.
- **`styles.css`가 `fonts.css`를 `@import`** — 지금 기기 글꼴만 쓰는 제품(AskLinq: 개인정보처리방침이 "기기에 이미 있는 글꼴"이라고 적음)이 다음 올림에서 요청 없이 3 MB 자산과 내려받기를 얻는다. 옵트인.
- **Pretendard 단일 가변 파일** — 한국어 한 페이지에 2 MB. 형제 둘이 지금 이렇게 한다.
- **의존성(`pretendard`, `@fontsource-variable/*`)으로 두고 url을 그 패키지로** — 소스 단계(의존성 미설치)에서 검사할 수 없고, 제품마다 이 세 패키지의 버전이 따로 놀게 된다. `pretendard` 패키지는 97 MB다.
- **`src: local(...)`** — 기기의 다른 버전 Pretendard가 섞이고 지문 채취 표면이다.

**트레이드오프.**
- site-kit tarball이 약 3 MB 커진다(woff2 3,104,592 B). 옵트인한 제품의 빌드 산출물도 103개 파일 약 3 MB가 늘지만, 방문자는 쓰는 서브셋만 받는다.
- `fonts.css`는 57 KB(gzip 13.6 KB) — Pretendard `unicode-range` 목록이 대부분. 제품 CSS에 합쳐져 렌더를 막는 CSS가 그만큼 는다.
- `font-display: swap`은 descriptor라 제품이 덮을 수 없다. BookLinq가 CLS 때문에 `optional`을 썼던 이력이 있다(BookLinq 5f213c4) — 필요해지면 그 제품은 이 파일을 쓰면서 자기 `@font-face`를 다른 이름으로 둔다.
- 기울임꼴 face는 싣지 않는다(브라우저가 기울여 그림). 가족 제품에 기울임 본문이 생기면 fontsource의 `wght-italic` 서브셋을 더한다.
- 한국어 페이지가 Pretendard를 새로 받게 되는 제품(VisionLinq — 지금은 기기 글꼴)은 첫 방문에 수백 KB가 는다. 대신 기기에 Pretendard가 없는 대부분의 방문자도 같은 글자를 본다.

**재검토 시점.** 원본(Geist·Pretendard)이 새 버전을 낼 때(`--vendor`로 올림), site-kit 밖의 소비자(모바일 앱, 콘솔 전용 앱)가 같은 파일을 원할 때(그때 별도 패키지), 또는 한 제품이라도 `swap` 대신 다른 표시 전략이 필요할 때.

---

## D-032 — 페이지 뿌리의 가족 서체는 site-kit이 명시도 0으로 준다 (2026-10-05)

**결정.** `@devslab/site-kit`의 `styles.css`에 한 줄을 둔다.

```css
:where(html) { font-family: var(--dds-font-family-sans); }
```

`.site-shell`이 아니라 뿌리에, `:where()`로 명시도 0. 제품이 `html`·`:root`·`body`·`:lang()`에 둔 서체 규칙은 소스 순서와 상관없이 이긴다. `tests/browser/site-kit.spec.ts`가 실제 Chromium에서 두 방향을 고정한다 — 제품 규칙이 없으면 `html`·`body`·`.site-shell`·`h1`·`p`의 계산된 서체가 토큰 스택과 같고, 형제 제품이 쓰는 네 모양(`html {}`·`:root {}`·`html:lang(ko) body {}`·`:lang(ko) {}`)을 **킷보다 앞에** 두어도 제품 서체가 이긴다.

**계기.** AskLinq 공개 페이지 전부(`/`·`/privacy`·`/terms`·`/signup`·`/admin` 로그인)가 라틴 글자를 브라우저 기본 세리프로 그리고 있었다 — 헤드리스 Chromium에서 `body`와 `h1`이 `"Times New Roman"`. 한국어 페이지는 Chrome의 한국어 기본 글꼴(맑은 고딕) 덕에 고딕으로 보였을 뿐이다. `dds.css`는 모든 규칙을 `dds-*` 클래스에 한정하고, site-kit의 `.site-shell`은 배경·글자색은 칠하지만 서체는 정하지 않는다. 그래서 클래스 없는 텍스트는 뿌리에서 서체를 받을 곳이 없었고, 킷의 섹션 원시 컴포넌트(`HeroSplit`·`SectionHead`)의 `h1`·`h2`·`p`도 마찬가지였다. 형제 셋은 각자 손으로 막아 두었다(VisionLinq·BookLinq `:root`, TraceLinq `html`, 셋 다 자기 리터럴 스택) — 네 제품 중 하나가 빠뜨린 것이고, 빠뜨리면 아무 신호 없이 세리프가 된다.

**근거.**
- **뿌리에, `.site-shell`이 아니라.** 셸에 직접 선언하면 상속값을 무조건 이긴다. VisionLinq의 `html:lang(ko) body`(한국어는 Pretendard 먼저)와 TraceLinq·VisionLinq가 자체 호스팅하는 `"Geist Variable"`이 토큰의 `Geist`로 바뀌어, 그 이름의 글꼴이 설치되지 않은 기기에서는 시스템 글꼴로 떨어진다. 뮤테이션으로 확인: `.site-shell` 버전은 두 테스트 모두 실패.
- **명시도 0.** 맨 `html {}`은 제품 CSS가 킷 **뒤에** 올 때만 진다. 테스트 픽스처가 제품 CSS를 킷 앞에 두므로 맨 `html {}`은 실패하고 `:where(html)`만 통과한다.
- **D-030과의 관계.** D-030은 뿌리 기본값(한국어 keep-all)을 dds.css에 싣지 않았다 — 다음 올림에서 제품들의 줄바꿈이 요청 없이 바뀌기 때문이다. 이번 규칙은 그 반론에 걸리지 않는다: 형제 셋은 모두 이기는 규칙이 이미 있어 렌더가 바뀌지 않고, 바뀌는 것은 규칙이 없던 제품(세리프였던 제품)뿐이다. 그리고 dds.css가 아니라 페이지 셸을 맡은 site-kit에 둔다 — dds.css는 여전히 클래스 밖을 건드리지 않는다.
- **내려받기 없음.** 토큰 스택은 기기에 설치된 글꼴 이름뿐이다(`Geist, Pretendard, -apple-system, …, 'Malgun Gothic', sans-serif`). `@font-face`는 제품 몫으로 남는다(AskLinq은 개인정보처리방침이 "기기에 이미 있는 글꼴"이라고 적고 CSP가 `font-src 'self'`).

**반려한 대안.**
- **`.site-shell { font-family: … }`** — 위의 형제 회귀.
- **AskLinq에만 한 줄** — 고치는 것은 그 제품뿐이고, 다음 제품과 킷 자신의 섹션 원시 컴포넌트는 여전히 규칙 하나를 기억해야 세리프를 피한다. 네 제품이 네 모양으로 같은 일을 하던 것이 이미 신호다(D-026 파비콘과 같은 모양).
- **`dds.css`(base.css)의 `:where(html)`** — 효과는 같지만 dds.css는 컴포넌트 라이브러리이고 D-030이 뿌리를 건드리지 않는다고 정했다. 페이지 바탕(배경·글자색)을 이미 맡은 site-kit이 서체도 맡는다.

**트레이드오프.**
- site-kit `styles.css`를 콘솔 화면에서도 불러오는 제품은 그 화면도 뿌리 서체를 받는다. 지금 그런 제품은 모두 자기 뿌리 규칙이 있어 바뀌지 않는다.
- 줄 길이가 바뀐다 — 세리프에서 산세리프로 가는 제품은 375px 확인이 필요하다(AskLinq은 소비 PR에서 확인).

**재검토 시점.** 가족이 자체 호스팅 글꼴(`Geist Variable` 등)을 공용으로 싣게 될 때 — 그때 토큰 스택의 이름과 제품들의 리터럴 스택을 하나로 합치고 제품 뿌리 규칙을 걷어낸다. D-030의 keep-all을 site-kit으로 올릴지 볼 때 같이 본다.

---

## D-031 — Google Tag Manager 스니펫은 site-kit이 한 번 쓰고, nonce는 라우터가 찍는다 (2026-10-05)

**결정.** `@devslab/site-kit`에 Tag Manager 도구를 둔다.

- 코어(프레임워크 중립): `gtmHeadScript(id)`(head 로더 본문 — `<script>` 태그·nonce 없음), `gtmNoscriptIframe(id)`(`<noscript>` 안의 iframe HTML), `GTM_CSP_SOURCES`(지시어별 CSP 출처), `GTM_CONTAINER_ID_PATTERN`(`/^GTM-[A-Z0-9]+$/`).
- TanStack 어댑터: `toTanStackHead(metadata, { gtm })`가 로더를 `scripts[0]`으로 더하고(생략하면 `scripts` 키 자체가 없음), `gtmHeadEntry(id)`는 head를 직접 만드는 라우트를 위한 같은 항목.
- 로더는 구글 "Use Tag Manager with a Content Security Policy"(https://developers.google.com/tag-platform/security/guides/csp)의 **nonce 대응 스니펫**을 바이트 그대로 쓴다. 테스트가 가이드의 원문을 고정해 두고 비교한다.
- ID는 스크립트 문자열에 들어가기 전에 패턴으로 검사하고, 맞지 않으면 `RangeError`. `""`도 거부 — "Tag Manager 없음"은 `undefined`.
- 항목에는 nonce를 넣지 않는다. 라우터의 `HeadContent`가 항목 속성을 펼친 **뒤에** `router.options.ssr.nonce`를 찍으므로, 넣어도 덮인다.
- body의 noscript는 컴포넌트로 내지 않는다. 셸(`MarketingShell` 등)은 `<body>` 안을 그릴 뿐 `<body>`를 소유하지 않으므로, 제품 루트 문서가 `<noscript innerHTML={gtmNoscriptIframe(id)} />`를 `<body>` 첫 자식으로 렌더한다(README에 패턴).

**계기.** 가족 네 사이트(AskLinq·BookLinq·VisionLinq·TraceLinq, 모두 TanStack Start + Solid + nonce CSP)가 공개 마케팅·법적 페이지에 각자 컨테이너 ID로 Tag Manager를 실어야 한다. 콘솔·대시보드·채팅 위젯은 제외이고 어느 라우트인지는 제품이 정한다. 파비콘 링크가 네 가지로 갈라졌던 것(D-026)과 같은 일이 생기기 전에, head를 만드는 자리에 한 번 둔다.

**근거.**
- **nonce 대응 변형.** 표준 스니펫에 문장 하나(`var n=d.querySelector('[nonce]'); n&&j.setAttribute('nonce',n.nonce||n.getAttribute('nonce'))`)를 더해 페이지의 nonce를 `gtm.js` 요소에 옮긴다. 구글 가이드: Tag Manager는 그 nonce를 자기가 추가하는 스크립트에 넘긴다. 네 제품 모두 nonce CSP라 이 변형이 맞고, nonce 없는 페이지에서는 `[nonce]` 요소가 없어 아무 일도 안 한다. 브라우저는 헤더 CSP 아래에서 `getAttribute('nonce')`를 `""`로 숨기지만 `n.nonce`가 원래 값을 준다 — Chromium에서 직접 확인했고, jsdom 테스트가 로더를 실행해 `gtm.js` 요소에 nonce가 옮겨지는 것을 고정한다.
- **nonce는 라우터 한 곳에서.** 실제 라우터로 서버 렌더하는 테스트(`tanstack-head.ssr.test.tsx`)가 `ssr.nonce`가 있으면 로더가 그 nonce로, 없으면 nonce 없이 렌더됨을 고정한다. 따라서 제품의 요구 사항은 이미 있는 것(asklinq#427 — 라우터 생성 시 `ssr.nonce`)과 같다.
- **클라이언트 `ssr.nonce`는 `""`.** 라우터의 `Script`는 하이드레이션 때 같은 본문·type·nonce 속성을 가진 인라인 스크립트를 찾고, 없으면 사본을 붙인다. 서버가 렌더한 로더는 nonce 숨김 때문에 `nonce=""`로 읽히므로, 클라이언트 `ssr.nonce`가 `""`(AskLinq 방식)여야 원본을 찾는다. 다른 값이면 사본이 붙고 CSP가 막아 페이지마다 위반이 기록된다(두 번 로드되지는 않음 — Chromium 확인).
- **CSP 출처는 구글 목록 그대로.** Tag Manager 컨테이너 + "Ads 기능 없는 Google Analytics" + noscript iframe용 `frame-src`. `connect-src`의 `https://*.google.com`은 구글이 적은 항목이고 `www.google.com`과 GA4의 `*.analytics.google.com`도 덮는다(CSP 와일드카드는 하위 도메인 깊이와 무관). 구글은 `script-src-elem`으로 적지만 가족 제품은 `script-src`에 nonce를 두므로 키는 `script-src`(`-elem`이 없으면 `script-src`로 넘어감).
- **noscript 패턴도 검증.** 컴포넌트를 내지 않으니, README가 권하는 JSX 자체를 Solid의 실제 컴파일러(babel-preset-solid, ssr/dom 모두 hydratable)로 컴파일해 개발 빌드로 하이드레이션하는 테스트(`tests/site-kit-gtm-noscript-hydration.test.mjs`, `verify:site-kit:ui`)를 둔다 — 불일치 0, 잃은 키 0, 뒤따르는 요소는 서버 것을 그대로 채택, 스크립트가 켜져 있으면 iframe 없이 텍스트.

**반려한 대안.**
- **표준(비 nonce) 스니펫** — 요청서의 원안. `gtm.js` 자체는 `script-src` 호스트 허용으로 어차피 로드되지만, `gtm.js` 요소에 nonce가 없으니 Tag Manager가 자기가 추가하는 스크립트에 넘길 nonce도 없다. 구글이 CSP 페이지용으로 따로 게시한 변형이 있으니 그쪽을 쓴다.
- **항목이 nonce를 받음(`gtmHeadEntry(id, nonce)`)** — 라우터가 덮어쓰므로 죽은 인자이고, 제품이 라우터와 다른 nonce를 넘길 여지만 만든다.
- **`GtmNoscript` Solid 컴포넌트** — 한 줄짜리를 감쌀 뿐이고, 셸이 `<body>`를 소유하지 않아 "body 첫 자식"을 보장할 수 없다. 공개 API를 늘리는 대신 패턴을 문서화하고 그 패턴을 테스트로 고정한다.
- **CSP 헤더 문자열을 만드는 헬퍼** — 네 제품의 CSP 조립 방식이 달라(문자열·객체·미들웨어) 출처 목록이 공통분모다.
- **미리보기 모드·맞춤 JS 변수·Ads 출처 포함** — 미리보기는 `tagmanager.google.com`·`gstatic`·Google Fonts까지 열고, 맞춤 JS 변수는 `'unsafe-eval'`을 요구하며, Ads는 doubleclick·googlesyndication 등을 연다. 필요한 컨테이너만 같은 가이드에서 더한다.

**트레이드오프.**
- 로더는 head 끝(라우터가 meta·link·style 다음에 head 스크립트를 렌더)에 온다. 구글은 "가능한 한 head 위쪽"을 권하지만 `async`라 파싱을 막지 않는다.
- 로더가 없는 라우트에서 클라이언트 내비게이션으로 로더가 있는 라우트에 들어오면 Tag Manager가 로드되지 않는다(라우터가 붙이는 사본은 CSP에 막힘). 전체 페이지 로드에서만 확실하다. 반대로 로더 있는 페이지에서 떠나는 내비게이션은 Tag Manager를 유지하므로 페이지뷰는 History Change 트리거로 잡는다.
- 빈 문자열 ID도 던진다 — 환경 변수가 비면 공개 페이지 렌더가 실패한다. 조용히 빠지는 것보다 낫다고 판단했다(제품은 `undefined`로 끈다).

**재검토 시점.** 구글이 컨테이너 스니펫이나 CSP 가이드를 바꿀 때(테스트의 원문 고정이 그 신호를 드러냄), 가족 사이트가 `<body>`를 소유하는 공용 문서 셸을 갖게 될 때(그때 noscript를 셸 옵션으로), 또는 Ads·미리보기를 쓰는 제품이 둘 이상이 될 때(그때 출처 목록에 단계 추가).

---

## D-030 — 한국어 줄바꿈은 dds.css가 아니라 각 페이지의 언어 뿌리에서: 쇼케이스 3페이지부터 (2026-09-25)

**결정.** 한국어를 음절이 아니라 어절에서 끊는 두 줄을 쇼케이스 세 페이지(`preview/index.html`·`components.html`·`icons.html`)의 인라인 `<style>`에 둔다.

```css
:where([lang|="ko"]) { word-break: keep-all; overflow-wrap: break-word; }
:where([lang]:not([lang|="ko"])) { word-break: normal; overflow-wrap: normal; }
```

`dds.css`에는 싣지 않는다 — D-029가 한국어 키커 자간을 각 제품 뿌리에 맡긴 것과 같은 판단이다. 스펙 3.2절에 소비자가 둘 규칙과 이유를 적고, `tests/foundation-contracts.test.mjs`가 세 페이지의 규칙·요소별 `word-break` 없음·`dds-css/src`에 `keep-all` 없음을 함께 고정한다.

**계기.** devslab.kr가 자기 페이지에 같은 규칙을 넣은 뒤(jlc488/devlab.kr#73) 남은 정적 하위 사이트를 Edge에서 글자 단위로 쟀더니, `devslab.kr/dds/`(이 쇼케이스의 사본)가 여전히 한글 음절 사이에서 줄을 바꿨다 — 375px/1440px에서 index 22/5곳, components 3/1곳, icons 3/0곳("브랜드 면 위 텍 / 스트는", "미달합 / 니다"). 브라우저 기본 CJK 규칙은 한글 음절 사이 어디서든 끊는다.

**근거.**
- 요소가 아니라 **언어를 선언한 뿌리**에 걸고 상속시킨다. 요소별 keep-all은 표 칸·목록을 놓치고, 요소별 `word-break: normal`이 그것을 되돌린다 — 같은 날 GitLinq 가이드(devslab.kr)가 휴대폰 미디어 쿼리 안에서 그렇게 풀어 375px에서 265곳이 쪼개졌다.
- 전역 keep-all이 아니라 `[lang|="ko"]`: 일본어·중국어는 단어 사이 공백이 없어 keep-all이면 줄바꿈 자리가 사라진다. 다른 언어를 선언한 조각은 두 번째 줄이 기본값으로 되돌린다.
- `overflow-wrap: break-word`이지 `anywhere`가 아니다: anywhere는 라틴 단어의 최소 폭까지 한 글자로 줄여 좁은 flex 칸에서 단어를 쪼갠다(devslab.kr에서 "cya / n"). break-word는 넘칠 때만 끊는다.
- `:where()`로 명시도 0 — 페이지·컴포넌트의 어떤 규칙에도 진다.
- 실측(320–1440px 8개 폭): 세 페이지 모두 음절 사이 줄바꿈 0, 가로 넘침·박스 밖 글자 증가 0. `icons.html` 320px의 가로 넘침(상단 nav 링크가 336px)은 규칙 전에도 같다.

**반려한 대안.**
- **`dds.css`(base.css) 기본값** — 쇼케이스 첫 페이지는 dds.css를 불러오지 않아 그것만으로는 고쳐지지 않고, dds.css를 쓰는 모든 제품(VisionLinq·AskLinq·BookLinq·TraceLinq·FM덴탈)의 한국어 줄바꿈이 다음 DDS 올림에서 요청 없이 바뀐다. keep-all은 한국어 칸의 최소 폭을 어절 길이로 늘리므로 표 칸·칩 폭이 달라질 수 있어 제품마다 375px 확인이 필요하다. D-029가 `html:lang(ko)` 키커 자간을 반려한 것과 같은 이유.

**트레이드오프.**
- 좁은 화면에서 줄 끝 여백이 는다(어절 단위로만 끊으므로). devslab.kr가 받아들인 것과 같은 대가.
- Chromium의 keep-all은 글자·숫자끼리만 붙인다 — 닫는 따옴표·말줄임표·괄호 뒤 조사는 여전히 줄 머리로 갈 수 있다("‘내 변경’ / 으로").
- 두 줄이 세 페이지에 복제된다. index는 dds.css를 쓰지 않는 단일 파일 페이지라 공유할 곳이 없다 — 테스트가 셋을 같은 모양으로 고정한다.

**재검토 시점.** devslab.kr 다음으로 가족 제품이 하나 더 자기 뿌리에 같은 규칙을 넣을 때 — 그때 dds.css(또는 site-kit)의 기본값으로 올리고 각 제품의 375px을 함께 확인한다. D-029의 키커 자간 재검토와 같이 본다.

---

## D-029 — 한 언어 랜딩과 사업자 정보 바닥글: 헤더·푸터 선택 props 9가지 (2026-09-24)

**결정.** `SiteHeader`·`SiteFooter`에 선택 옵션을 더한다. 아무것도 넘기지 않는 소비자는 전과 같은 마크업을 받는다(모든 소비자에 적용되는 기본값 변화는 트레이드오프에).

1. `SiteHeader.locale`을 선택으로 — 없으면 언어 메뉴를 그리지 않는다(푸터 `locale`과 같은 `<Show>`).
2. `SiteBrand.label` → 헤더 브랜드 링크의 `aria-label`. 워드마크를 `logo`로 넘기고 `name: ""`이면 이름이 두 번 찍히지 않고, 푸터도 빈 `<strong>`을 그리지 않는다.
3. 좁은 화면 메뉴: Esc로 닫고 메뉴 버튼으로 포커스 복귀, 안의 링크를 따라가면 닫힘(같은 페이지 앵커 포함). 버튼(테마 전환)과 새 탭·새 창으로 여는 링크(`target`·수정 키)는 닫지 않는다. 헤더 안 요소의 핸들러가 이미 처리한 Esc(`defaultPrevented` — 국기 메뉴)와 `aria-modal` 요소 안에서 온 Esc(문서에 리스너를 다는 DDS Dialog는 이 핸들러 뒤에 돈다)는 그 컨트롤에 맡긴다.
4. 터치(`pointer: coarse`)에서 브랜드 링크·헤더·푸터·푸터 언어 링크 44px, 720px 이하 열린 메뉴의 링크는 44px 줄(간격 0 — 16px 간격의 글줄과 거의 같은 피치), 닫힌 좁은 헤더의 첫 줄은 버튼 크기와 무관하게 64px.
5. 붙는 헤더 아래에 섹션이 멈추게: `.site-hero, .site-section { scroll-margin-block-start: calc(var(--site-header-block-size, 64px) + space-8) }`. 헤더 높이는 사용자 속성 하나(`--site-header-block-size`, 기본 64px).
6. 히어로 키커의 자간·굵기를 사용자 속성으로: `--site-hero-eyebrow-tracking`(기본 `.18em`), `--site-hero-eyebrow-weight`(기본 `normal`).
7. `SiteFooter.details`(JSX) — 브랜드 줄 아래 블록(`.site-footer__identity` > `.site-footer__details`, 줄 간격 4px·자식 여백 0). 이때 행은 첫 줄 기준선 정렬(`first baseline`), 푸터 링크 줄은 기준선 정렬 — 터치에서 44px 링크의 글자가 브랜드·저작권 글자와 같은 높이. 푸터 로고의 16px 크기는 이름(`<strong>`) 옆 아이콘 마크에만(`:has(> strong)`) — `name: ""` 워드마크는 자기 크기.
8. `SiteFooter.linksLabel` — 링크 목록을 `<nav aria-label>`로 감싼다.
9. `SiteLink.emphasis` — 링크를 굵게(700, `text-primary`). 헤더 내비·푸터 링크·패밀리 링크 모두.

그리고 헤더·푸터가 `brand`(푸터는 `details`도)를 `createMemo`로 한 번만 읽는다 — 셸 밖에서 직접 마운트해도 D-027·D-028의 규칙이 지켜지게.

**계기.** FM덴탈서비스(부산 치과기공물 수거·배송, 가족 밖 첫 site-kit 소비자) 랜딩의 디자인 리뷰가 확인한 36건 중 9건이 "지금 kit으로는 그릴 수 없음"이었다. 한국어만 쓰는데 헤더가 언어 메뉴를 늘 그리고(`locale` 필수), 워드마크 링크에 이름을 줄 방법이 없고, 좁은 화면 메뉴가 Esc·링크 클릭에 닫히지 않아 `#contact`로 가도 열린 메뉴가 섹션을 가렸다. 바닥글에는 사업자 정보·주소를 둘 자리가 없고(브랜드 줄은 인라인 `<p>`라 `<address>`를 넣을 수 없음), 링크 묶음에 이름을 줄 수 없고, 개인정보처리방침을 다른 링크와 구분해 눈에 띄게 할 수 없었다(한국 사이트에서 요구되는 표시). 한글 키커에 `.18em` 모노 자간이 그대로 걸렸다.

**근거.**
- props는 **선택·가산**이다: 기존 소비자(VisionLinq·AskLinq·BookLinq·TraceLinq)의 마크업은 바뀌지 않는다 — `locale`을 넘기면 메뉴가 그대로 그려지고, `details`·`linksLabel`이 없으면 행 구조(`.site-footer__row > .site-footer__brand` + `ul`)도 그대로다. 테스트가 이 두 경로를 회귀 가드로 고정한다. 기하·동작 기본값은 모든 소비자에 적용된다(트레이드오프).
- 메뉴 닫힘은 모든 소비자의 결함이었다 — 같은 페이지 앵커 내비게이션은 문서를 바꾸지 않아 열린 메뉴가 남는다. 링크에서만 닫고 버튼에서는 두는 것은 "독자가 어딘가로 갔는가"로 가른 것.
- 44px은 스펙 §6의 모바일 최소선이고 버튼은 이미 `button.css`의 거친 포인터 규칙으로 44px이다(D-025와 같은 원리: 터치에서는 하한이 이긴다). 좁은 화면 메뉴 줄은 포인터와 무관하게 44px — 줄 목록이라 간격 16px의 글줄(약 40px 피치)과 시각 변화가 거의 없다.
- 키커 자간은 `:lang(ko)` 규칙이 아니라 사용자 속성으로 열었다: 한국어 키커를 쓰는 다른 가족 제품(AskLinq·VisionLinq)의 현재 모습을 이 결정이 바꾸지 않게. 각 제품이 자기 랜딩 뿌리에서 정한다.
- `details`·`brand`를 메모로 한 번 읽는 것은 D-027(셸)·D-028(StatusBanner)의 "kit은 받은 JSX를 한 번만 읽는다"를 헤더·푸터 자체로 넓힌 것 — `tests/site-kit-landing-chrome-hydration.test.mjs`가 게터 props로 직접 마운트한 헤더·푸터를 **개발 빌드**로 하이드레이션해 예외 0·잃은 키 0을 고정한다(메모를 직접 읽기로 바꾸면 `Hydration Mismatch`로 실패함을 확인).

**반려한 대안.**
- **FM이 자기 헤더·푸터를 그림** — 가족 셸을 벗어나면 D-027의 하이드레이션 규율·국기 메뉴·스킵 링크를 다시 구현하게 되고, 메뉴 닫힘 같은 전 소비자 결함은 kit에 남는다.
- **`messages`에 `footerLinksLabel` 키 추가** — 필수 키라 모든 소비자의 카탈로그가 깨진다(런타임 폴백은 금지 규칙). 선택 prop으로.
- **한글 키커 자간을 `html:lang(ko)`로 0** — 타이포로는 맞지만 다른 제품의 현재 랜딩을 소리 없이 바꾼다. 필요해지면 그 제품들과 함께 기본값을 바꾼다.
- **`SiteLink.emphasis`를 `<strong>`으로** — 링크 안 강조 요소는 이름에 섞여 읽힐 뿐 뜻을 더하지 않는다. 클래스(`site-link--emphasis`)로 모양만.

**트레이드오프.** 모든 소비자에 적용되는 기본값이 있다 — 사전 리뷰가 소비자별로 잰 값:
- 좁은 화면의 닫힌 헤더는 위아래 패딩 대신 첫 줄 높이(64px)로 만든다. `.site-header__inner`는 dds 클래스가 아니라 전역 `box-sizing: border-box` 리셋이 없는 제품에서는 content-box라, 휴대폰 헤더가 **89px → 65px**(TraceLinq·BookLinq, 이전엔 64px 최소 높이 + 위아래 12px 패딩), 메뉴 버튼이 44px인 제품은 69px → 65px(AskLinq 터치, VisionLinq). 데스크톱(65px)과 같아지고 스크롤 간격도 맞게 되지만, 두 제품의 휴대폰 모양이 요청 없이 바뀐다 — 올릴 때 375px 시각 확인이 필요하다. 64px보다 큰 로고를 쓰는 소비자는 `--site-header-block-size`를 올리고, **`:root`나 `.site-shell`에 정해야** 섹션 간격까지 따라온다(`.site-header`에 정하면 헤더만 바뀜).
- 열린 메뉴: 링크는 간격 0의 44px 줄, 컨트롤 줄 아래 12px(이전엔 헤더 전체 패딩). 첫 링크가 헤더 윗변에서 조금 더 내려간다.
- 터치 기기에서 가족 전 제품의 브랜드 링크·바닥 링크가 44px 누르는 면(이전엔 글줄 높이) — 바닥 링크 줄이 높아진다. 브랜드 링크는 inline에서 inline-flex(가운데 정렬)로.
- 메뉴가 Esc·링크 따라가기로 닫힌다(전 소비자의 결함 수정).
- **타입 변경**: `SiteHeaderProps["locale"]`이 선택이 되어, 그 값을 `SiteHeaderProps`에서 읽는 코드는 좁혀야 한다 — BookLinq `MarketingFrame`의 `props.header.locale.locale`이 `tsc --strict`에서 TS18048. 필수로 두고 컴포넌트 인자만 넓히는 안은 FM이 셸의 `header`로 `locale`을 빼고 넘길 수 없어 반려; 대신 changeset에 적고 BookLinq는 올릴 때 `SiteHeaderProps & { locale: LocaleState }`로 좁힌다(늘 넘기므로 정확). 브라우저 기하는 `tests/browser/site-kit.spec.ts`가 마우스·터치 두 포인터로 고정한다(main의 CSS로 돌리면 5개 실패 확인).

**재검토 시점.** 한국어 키커를 쓰는 두 번째 제품이 자간 0을 원할 때(그때 `:lang(ko)` 기본값), 헤더가 두 줄 이상 높이를 가져야 하는 소비자가 나올 때, 또는 TraceLinq·BookLinq가 휴대폰 헤더의 이전 높이를 원할 때(그때 패딩 경로를 옵션으로).

---

## D-028 — 부품은 `children`도 한 번만 읽는다: `StatusBanner`의 이중 읽기 (2026-09-16)

**결정.** `StatusBanner`가 `props.children`을 `createMemo`로 한 번 읽어, 진위 검사와
삽입이 같은 해석값을 쓴다. D-027이 셸의 `header`/`footer`에 세운 규칙("kit은 받은
것을 한 번만 읽는다")을 자식에도 적용한 것이다. `tests/site-kit-status-banner-hydration.test.mjs`가
배너 둘을 인라인 `<ul><For>…</For></ul>` children으로 서버 렌더 → **Solid 개발 빌드**
(`--conditions=browser --conditions=development`)로 jsdom 하이드레이션까지 돌려
예외 0·잃은 서버 키 0을 고정한다(`verify:site-kit:ui`).

**계기.** BookLinq가 D-027 규율을 자기 셸에 적용하고 브라우저 하이드레이션 게이트를
새로 돌리자(jlc488/booklinq#51) `/status`가 `vite dev`에서 site-kit의 에러 레이아웃을
그렸다. 원인은 `{props.children && <div>{props.children}</div>}` — 컴파일된 JSX
children은 게터라 첫 읽기가 목록과 그 아래 `<li>` 전부를 만들어 버렸고, 그 요소들은
서버 HTML에 없는 하이드레이션 키를 소모했다. BookLinq는 목록을 const로 한 번 만들어
넘기는 우회로 출하하고 kit 건으로 넘겼다.

**재현이 가르쳐 준 것.** 프로덕션 빌드로는 이 버그가 *보이지 않는다*. 서버와
클라이언트가 버려지는 읽기에서 같은 수의 키를 낭비하므로 카운터는 어긋나지 않고,
클라이언트가 없는 키를 조회하면 `getNextElement`가 조용히 템플릿을 복제한다 —
잃은 키 0, 화면 정상. 첫 두 판의 테스트(평문 `<p>`, 그다음 BookLinq와 같은 `For`
목록)가 미수정 kit에서 초록이었던 이유다. 개발 빌드는 같은 자리에서 `Hydration
Mismatch`를 던진다(`web/dist/dev.js`). 그래서 이 테스트는 개발 빌드로 하이드레이션한다
— 낭비된 키에 대해 진실을 말하는 쪽이 그쪽이고, 모든 소비자의 dev 서버가 도는 빌드도
그쪽이다. 수정 전 빨강(`hydration key: 0010`), 수정 후 초록 확인.

**대안.** ① 소비자가 children을 const로 만들어 넘기기(BookLinq의 우회) — 규율은
잊히고, 부품이 한 번만 읽으면 규율 없이도 맞다. ② `children()` 헬퍼(solid-js) — 배열
평탄화까지 하지만 여기선 필요 없고, 셸과 같은 `createMemo` 관용구 하나가 낫다.
③ 진위 검사 제거(항상 `<div>` 렌더) — 자식 없는 배너에 빈 상자가 남는다.

**트레이드오프.** 메모는 children이 신호에 의존하면 그때 재평가된다(소비자 패턴의
원래 비용). 기존 `tests/site-kit-hydration.test.mjs`는 여전히 프로덕션 빌드로
돈다 — D-027의 결함은 프로덕션에서도 키가 어긋나는 종류라 그쪽이 맞고, 이 테스트는
개발 빌드만이 잡는 종류라 그쪽이 맞다.

**재검토.** `NotFoundLayout`·`ErrorLayout`·`LegalLayout`은 children을 한 번만 읽는다
(삽입만). 조건부 렌더가 새로 붙는 부품은 같은 메모 관용구를 쓰고 이 테스트 모양으로
고정한다. npm 발행이 OIDC E404로 막혀 있어(소유자 액션) 이 수정은 0.12.2에 실린다.

---

## D-027 — 셸은 header/footer를 한 번만 읽고, 빈 스프라이트는 스스로 본문을 로드한다 (2026-09-16)

**결정.** `MarketingShell`이 `props.header`·`props.footer`를 `createMemo`로 한 번
읽어 `SiteHeader`/`SiteFooter`에 펼친다. `FlagSprite`의 브라우저 분기는
"하이드레이션 중인가"(`sharedConfig.context`)가 아니라 "엘리먼트에 자식이
있는가"로 서버 HTML 유무를 판정하고, 비어 있으면 `loadFlagBodies`를 부른다.
`tests/site-kit-hydration.test.mjs`가 서버 빌드로 렌더 → 브라우저 빌드로 jsdom
하이드레이션까지 돌려 헤더 요소가 하나도 재생성되지 않고 심볼 14개가 살아남는지
고정한다(stage3-4 게이트).

**계기.** AskLinq가 site-kit 0.12.0을 소비하자(D-026 파비콘 작업의 부수 bump)
국기 메뉴가 모든 브라우저에서 빈 칸이 됐다. 서버 HTML엔 심볼 10개가 있었고,
라이브 DOM에선 `<details class="site-locale-flag">`만이 아니라 헤더 요소 대부분에
`data-hk`가 없었다 — 즉시 만들어진 `actions` 앵커 둘만 키가 맞았다. 원인:
`header={{ …, actions: <>…</> }}`는 게터로 컴파일되고, 셸이 `{...props.header}`로
펼치면 prop을 읽을 때마다 리터럴이 재평가되며 그 안의 즉시 JSX가 매번 다시
만들어져 하이드레이션 키를 소모한다. 서버(문자열, 소수 읽기)와 클라이언트(반응형,
다수 읽기)의 횟수가 달라 그 뒤 키가 전부 어긋났다. 스프라이트 이전(≤0.9,
`<select>` 변형)에서도 같은 재생성이 있었을 테지만 재생성된 `<select>`는
멀쩡히 동작하므로 아무도 못 봤다 — 스프라이트는 서버 HTML에만 사는 첫 부품이었다.

**대안.** ① 소비자에게 `get actions()` 규율 요구(AskLinq 셸은 `logo`에 이미 그
주석을 달아 두고 `actions`에서 어겼다 — 규율은 잊히고, 셸이 한 번만 읽으면 규율
없이도 맞다). ② `FlagSprite`의 uid를 국가 목록 해시로 결정적으로 만들기 — 재생성
자체를 막지 못한다. ③ D-020을 되돌려 브라우저 번들에 본문 재탑재 — 115KB를
되돌리는 데다 근본 원인(키 드리프트)은 남는다.

**트레이드오프.** 메모는 `props.header`가 신호에 의존하면 그때 재평가되고 즉시
JSX도 다시 만들어진다(소비자 패턴의 원래 비용). 빈 스프라이트 로드는 드리프트가
남은 소비자에게 110KB 청크 fetch로 국기를 살린다 — 증상 완화이지 드리프트 해소는
아니라서, 테스트는 "재생성 0"을 별도로 단언한다.

**재검토.** Solid 2/dom-expressions가 하이드레이션 키 부여 방식을 바꾸면 테스트가
먼저 알린다. 셸 밖에서 `SiteHeader`를 직접 쓰는 소비자는 여전히 자기 props를
한 번만 읽어야 한다(README).

---

## D-026 — 파비콘 `<link>` 묶음은 site-kit이 정하고, 파일은 linq-brand가 만든다 (2026-09-14)

**결정.** `@devslab/site-kit`에 `brandIconLinks({ basePath })`와 `BRAND_ICON_FILES`를
두고, `toTanStackHead(metadata, { icons })`가 옵트인으로 덧붙인다. 묶음은 넷으로
고정: `favicon.svg`(먼저), `mark-48.png`(`48x48`), `favicon.ico`(`16x16 32x32 48x48`),
`apple-touch-icon.png`(`180x180`). 파일 자체는 계속 `@devslab/linq-brand`가
`dist/<product>/`에 만든다 — site-kit은 그 이름을 부를 뿐 그리지 않는다.

**계기.** AskLinq 검색 결과 파비콘이 마크 교체(D-125, 2026-09-03) 열흘 뒤에도 옛
물음표였다. 프로덕션 파일은 이미 새 마크였고, 원인은 둘: web-next 컷오버가 레거시
head의 `<link rel="icon">`을 옮기지 않아 크롤러가 `/favicon.ico` 폴백만 봤고, 그
파일이 32px PNG라 구글 권장(48px 초과)에 미달했다. 그리고 확인해 보니 가족 넷이
각자 다른 조합이었다 — VisionLinq는 svg+ico(`any`)+apple, BookLinq는
svg+32png+ico(`48x48`)+apple+manifest, TraceLinq는 자기 head, AskLinq는 없음.
같은 패키지 파일을 네 가지로 부르고 있었으니 공통 자리는 head를 만드는 site-kit이다.

**대안.** ① linq-brand 레지스트리에 링크 목록을 싣기 — 레지스트리는 프레임워크
중립 자산 목록이고 `<link>` 속성(rel/sizes/type)은 head의 어휘라 반려. ② 각 제품이
계속 자기 head에 쓰기 — 지금 네 가지로 갈라진 그 상태. ③ `toTanStackHead`가 항상
아이콘을 내기 — 제품이 파일을 어디서 서빙하는지 어댑터가 모르고, 404 나는
아이콘을 링크한 head는 안 링크한 head보다 나쁘므로 옵트인.

**트레이드오프.** `basePath`는 같은 오리진 경로만 받는다(CDN URL은 RangeError) —
아이콘은 제품이 직접 서빙한다는 전제를 코드로 둔다. manifest 링크는 묶음에 넣지
않았다: PWA 매니페스트는 제품마다 내용이 달라 링크만 공통화해도 파일은 못 만든다.

**재검토.** linq-brand가 파일 이름이나 크기 세트를 바꾸면 `BRAND_ICON_FILES`와
같은 PR에서 움직여야 한다(두 레포라 자동 게이트 없음 — 소비자 테스트가 서빙
바이트의 sha를 패키지 checksums와 대조하는 것이 유일한 그물). 구글이 요구 크기를
바꾸면 `mark-48.png` 항목만 바뀐다.

---

## D-025 — 테이블 안 버튼: 행 높이는 고정, 터치에서는 하한이 이긴다 (2026-09-13)

**결정.** VisionLinq(VL-058)가 DDS 0.11.0으로 옮긴 뒤에도 제품 쪽에 남겨 둔
테이블 규칙 네 가지를 DDS의 일반형으로 `packages/dds-css/src/table.css`에
올린다: 셀 안 `<code>`는 13px 모노, 행 액션(`.dds-table__actions .dds-btn`)은
크기 수식자와 무관하게 32px·줄바꿈 금지·액션 셀 세로 패딩 4px,
`.dds-btn--sm`을 담은 셀도 패딩 4px, `.dds-table--dense`에서는 행 액션과
모든 `.dds-btn--sm`이 24px(패딩 0), `.dds-table-wrap--tall`은
`border-collapse: separate`. 그리고 `@media (pointer: coarse)`에서 이
버튼들을 전부 44px로 되돌린다.

**근거.** 행 높이가 제각각인 표는 깨져 보인다 — VisionLinq에서 버튼이 있는
행이 약 53px로 이웃 40px 행을 밀어 균일 행 높이 하네스를 깨뜨렸다. 그런데
이 규칙들(특이도 0,2,0·0,3,0)은 `button.css`의 거친 포인터 규칙
`.dds-btn, .dds-btn--sm { min-block-size: 44px }`(0,1,0)을 특이도로 이긴다.
여기서 다시 선언하지 않으면 테이블이 폰에서 모든 액션을 스펙 §6의 44×44
아래로 **조용히** 줄인다 — 규칙 텍스트만 봐서는 보이지 않는 결과라서
`tests/browser/table.spec.ts`가 실제 캐스케이드로 고정한다(거친 포인터 블록을
지우면 32px이 나와 실패함을 확인). VisionLinq의 제품 규칙은 `min-block-size`만
줬지만 일반형은 패딩까지 정한다: 기본 크기 버튼은 8+8px 패딩 때문에
`min-block-size: 32px`로도 34px이고, `--sm`은 4+4px 패딩 때문에 24px로
안 내려간다(26px) — 수치는 브라우저 측정으로 확인. 액션 셀 밖의 `--sm`
버튼(id 옆 복사 버튼)도 같은 문제라 그 셀도 패딩을 줄인다
(`td:has(.dds-btn--sm)`): 기본 밀도에서는 10px 패딩으로 53px 행이 되고, 밀집
표에서도 24px 버튼+6px 패딩+1px 테두리가 37px로 36px 행을 1px 넘는다(첫
스크린샷 검토에서 긴 래퍼 표의 복사 버튼 행이 튀어나와 발견). VisionLinq의 `.console-copy`처럼 제품
클래스에 묶지 않고 `--sm`에 건 것은 VisionLinq의 복사·행 버튼이 전부
`dds-btn--sm`이기 때문이다.

**반려한 대안.**
- **터치에서도 32/24px 유지** — 행 높이 균일성은 시각 규칙이고 44px은
  접근성 최소선이다. 둘이 부딪히면 최소선이 이긴다.
- **VisionLinq 규칙 그대로(`min-block-size`만)** — 그 제품의 `--sm` 버튼에서만
  참이고, DDS 일반형으로는 기본 크기 버튼에서 거짓이 된다.
- **`.console-copy` 같은 복사 버튼 전용 클래스 신설** — 컴포넌트가 아닌
  배치에 이름을 붙이는 셈이고, 같은 치수가 필요한 행 버튼에는 적용되지
  않는다.

**트레이드오프.** 거친 포인터에서는 버튼 있는 행이 더 크다(44px + 8px 패딩) —
그 화면의 균일 행 높이는 터치 기기에서 보장되지 않는다. `.dds-table--dense`
안의 `--sm` 버튼은 액션 셀 밖에서도 24px이 되므로, 밀집 표에서 32px 작은
버튼을 원하면 `--sm`을 쓰면 안 된다. `:has()`에 기대므로 `:has()` 미지원
브라우저에서는 셀 패딩이 줄지 않는다(행이 몇 px 커질 뿐 기능은 그대로).

**재검토 시점.** 터치 표면에서 쓰는 콘솔이 나와 행 높이 요구가 실제로
생길 때, 또는 두 번째 소비자가 밀집 표에서 24px이 아닌 작은 버튼을 필요로 할 때.

---

## D-024 — `ConsoleShell` 드로어의 40px 터치 타깃: 이식 그대로 두고 기록만 (2026-09-13)

**결정.** `docs/design-system.ko.md` §6은 모바일 터치 타깃 최소 44×44를
못박는다. 900px 미만 드로어에서 `.dds-console-rail__toggle`은 2.5rem(40px,
`console-shell.css:142`)이고 `.dds-console-rail__item`도
`min-block-size: var(--dds-space-40)`(`console-shell.css:270-272`)이다 —
둘 다 이 규칙에 못 미친다. 두 값 모두 VisionLinq가 실제로 출하한 콘솔에서
그대로 가져온 것이고, 이번 결정은 **그 기하를 바꾸지 않고 이탈만 기록**하는
것이다.

**근거.** 이번 단계의 존재 이유는 VisionLinq 콘솔 컴포넌트를 DDS로
"이식"하는 것이지 재설계하는 것이 아니다 — 치수를 지금 바꾸면 이식이
아니라 변형이 되고, 이 세션에는 드로어를 실제로 렌더링해 시각 확인할
방법이 없다(리뷰 코멘트 그대로: "화면 포크 금지, 기술자 한 곳에서 파생"과
같은 정신으로, 검증 못 한 채 고치는 것이 검증된 이식을 그대로 두는 것보다
더 위험하다). 44px로 늘리면 레일 폭·아이템 줄바꿈·배지 정렬이 달라질 수
있는데 이 세션은 그 결과를 눈으로 확인할 수 없다.

**트레이드오프.** DDS가 자기 §6 최소선을 스스로 어기는 컴포넌트를 낸다 —
모바일 드로어에서 토글 버튼과 내비 항목이 명목상 44px 터치 타깃에 못
미친다. 다음에 이 컴포넌트를 실제 터치 화면에서 쓰는 제품이 이 갭을
물려받는다.

**재검토 시점.** `ConsoleShell`을 실제 터치 표면(모바일 웹 콘솔 등)에서
쓰는 첫 제품이 나오거나, 드로어에 대한 시각 검증 패스가 도는 시점 — 둘 중
먼저 오는 쪽에서 40px을 44px로 올릴지, 아니면 이 규칙에 명시적 예외를
등재할지 결정한다.

---

## D-023 — 카나리의 first-party 의존성 예외: `workspace:` + 정확한 링크 버전 (2026-09-12)

**결정.** compatibility-canary의 의존성 게이트(`verify-dependencies.mjs`)는
`@devslab/*` 이름을 compatibility-matrix 바이트 비교에서 면제하되, 그 대신
`workspace:` 프로토콜을 쓰면서 **현재 링크된 lockstep 버전과 정확히 같은
값**을 명시해야 통과하도록 좁힌다 — `workspace:*`나 `workspace:^0.10.0`처럼
`pnpm add --workspace`가 기본으로 쓰는 범위 표기는 실패한다.

**근거.** `workspace:` 문자열 자체는 서드파티 호환성 정보를 담지 않으므로
compatibility-matrix와 바이트 단위로 비교할 대상이 없다 — 이게 면제의
근거다. 하지만 면제가 핀을 빼는 길이 되면 안 된다: `@devslab/dds-table`을
카나리에 추가하면서, `workspace:` 프로토콜을 쓰는지만 확인하던 기존 규칙이
`workspace:*`나 `workspace:^0.10.0`도 조용히 통과시킨다는 것이 드러났다.
그건 이 가족의 버전 이야기(lockstep semver — 소비자는 자기가 소비하는
정확한 버전을 안다)가 기대는 보증을 깨는 구멍이다.

**트레이드오프.** 검사가 하나 늘었다 — lockfile의 specifier 확인에 더해,
`node_modules`에 실제로 링크된 패키지의 `version`을 읽어 선언된 핀과
대조한다. dds 패키지를 릴리스할 때마다 카나리의 `workspace:` 핀도 그 버전
문자열을 따라가야 한다(이미 lockstep이 강제하던 규율을 이제 카나리 스스로도
검증한다는 뜻).

**재검토 시점.** 없음 — 이 검사가 실패하는 유일한 경우는 실제로 핀이
드리프트한 경우다.

---

## D-022 — StatusPill: 닫힌 도메인은 throw, 열린 도메인은 원문 렌더 (2026-09-12)

**결정.** `dds-solid`의 `createStatusPill`이 tone도 label도 없는 미지 값
(`domain.value`)을 만나면 두 갈래로 갈린다: 그 도메인이 `openDomains`에
없으면(닫힌 도메인) throw, 있으면(열린 도메인) 값을 알파벳 그대로 `<code
data-status>`로 렌더링한다.

**근거.** 프로덕션 크래시가 이 규칙을 가르쳤다 — VisionLinq의 역할 알약이
조직 역할 5개만 알고 나머지는 throw했는데, 실제로는 그 필드가 열린 문자열
계약이라 API 키의 `project.*` 스코프 같은 값이 멤버십 행에 섞여 들어왔고,
API 키를 한 번이라도 발급한 고객의 화면이 통째로 깨졌다(에러 경계가 엉뚱한
화면 이름을 띄우고 재시도 버튼은 영원히 실패). 닫힌 도메인의 미지 값은
스키마가 새 케이스를 얻었는데 카탈로그가 못 따라간 것이므로, 조용히 넘기면
잘못된 상태를 사실처럼 보여주는 셈이라 throw가 맞다. 열린 도메인의 미지
값은 고객 데이터이고, 화면을 죽여선 안 된다.

**트레이드오프.** `openDomains`는 `tones`가 이미 선언한 도메인 중에서만
고를 수 있다(`NoInfer<D>`로 강제) — 이 옵션이 도메인 집합 자체를 넓히거나
좁히는 문이 되면 "닫힌 도메인"이라는 말 자체가 무너진다. 대신 도메인이
열려 있는지 닫혀 있는지는 소비자가 매번 선언해야 하고, 닫아야 할 도메인을
실수로 열어 두면 스키마 드리프트를 조용히 놓치는 대가를 치른다.

**재검토 시점.** 열린 도메인의 원문 렌더링이 실제로 사용자를 혼란스럽게
한다는 신호가 나오면 — 원문 대신 "알 수 없음" 같은 사람 말 폴백을 검토한다.

---

## D-021 — `@devslab/dds-table`: 정렬은 타입이 정하고, 페이징은 링크, 접기는 CSS (2026-09-12)

**결정.** `@devslab/dds-table`을 새 패키지로 추가한다. `DataTable` 하나와
`Column<T>`/`DataTableLabels` 타입만 내보낸다. TanStack Table을
`@tanstack/solid-table@9.2.4`에 캐럿이 아니라 정확히 고정한다. 컴포넌트 안에서
넷을 확정한다 — 정렬은 타입(`sort: "client" | { statedOrder: string }`)이
정하고, 페이징은 버튼이 아니라 링크(`page.nextHref`)이고, 컬럼 접기는
JavaScript가 아니라 CSS(`fold: true`)이고, 어휘(`DataTableLabels`의 모든
필드)는 소비자가 주입한다. 테이블 CSS(`.dds-table*`)는 `dds-table` 패키지가
아니라 `dds-css`(`packages/dds-css/src/table.css`)에 둔다. `@devslab/dds-table`을
`.changeset/config.json`의 `fixed` 그룹에 추가해 dds-tokens·dds-css·
dds-icons·dds-solid·site-kit과 같은 버전 열차로 움직이게 한다.

**근거.** dds-table은 compatibility-canary가 이미 검증해 둔 프레임워크
스택 위에 얹히는 컴포넌트이므로, 그 스택의 patch/minor 자유도를 스스로
가질 이유가 없고 캐너리가 한 번도 보지 못한 TanStack 버전이 슬쩍 들어오는
길을 정확한 핀이 원천 차단한다. `"client"` 정렬은 테이블이 전체 목록을
메모리에 들고 있다는 뜻이라 정렬 버튼이 안전하다(재정렬 대상이 곧 표시
대상 전체이므로). `{ statedOrder }`는 서버가 정렬해 커서로 페이징한 한
페이지만 보여준다는 뜻 — 이때는 `sortBy`가 있는 컬럼이라도 버튼을
렌더링하지 않는다. 한 페이지만 재정렬하면서 "전체를 정렬했다"처럼 보이는
버튼은 데이터를 조용히 거짓 보고하는 것이기 때문이다. 대신 실제 순서를
`statedOrder` 문장으로 테이블 위에 찍는다. 커서 페이징 목록은 결국 쿼리
문자열만 다른 URL이므로, 진짜 링크여야 JavaScript가 꺼져 있어도, 하이드레이션
전에도, 브라우저의 "새 탭에서 열기"에서도 그대로 동작한다. 컬럼 접기는
`dds-css`의 미디어 쿼리(`@media (max-width: 56.25rem)`)가 `[data-fold]`를
숨기는 것으로 충분하다 — resize observer도, 뷰포트별 재렌더도, 정렬·페이징
상태와 맞춰야 할 동기화 비용도 없다. DDS는 소비자 사용자가 어떤 언어를
읽는지 알 수 없으므로, 방문자가 읽는 어떤 단어도 컴포넌트가 스스로
렌더링하지 않는다. 테이블 CSS를 `dds-css`에 두는 것은 이 레포의 다른
프레임워크 컴포넌트 전부가 시각 언어를 그 자리에 두는 기존 패턴을 그대로
따른 것이고, CSS만 필요한 소비자가 `dds-table`(과 그 TanStack 의존성) 전체를
끌어올 필요를 없앤다.

**반려한 대안.**
- **프리미티브(`Th`/`Td`/`useDataTable`) 노출** — 소비자가 하나뿐인 지금
  API 표면을 두 벌 유지할 이유가 없다. 두 번째 소비자가 `DataTable`의
  props로 표현 안 되는 모양을 요구할 때로 미룬다(`tests/dds-table-contracts.test.mjs`가
  소스 레벨로 고정 — `Th`·`Td`·`useDataTable`이 `index.ts`에 등장하면
  실패).
- **`stockFeatures`(TanStack의 기본 기능 묶음)** — 페이지네이션·필터링
  기능이 통째로 딸려 들어오는데, 이 컴포넌트를 부르는 곳은 언제나 메모리
  전체 목록(`sort="client"`)이거나 이미 페이지가 나뉜 서버 응답
  (`page.nextHref`)이라 그 기능이 발화할 일이 없다 — 모든 소비자의 번들
  무게만 늘린다.
- **TanStack의 페이지네이션 기능** — 그 기능을 쓰면 "다음"이 클라이언트
  상태를 바꾸는 버튼이 된다. 이 컴포넌트가 원하는 건 정반대(JavaScript
  없이도 동작하는 링크)라 애초에 채택할 수 없다.

**트레이드오프.** `@devslab/dds-table`을 `fixed` 그룹에 넣은 대가: dds-table
하나만 바뀐 패치도 dds-tokens·dds-icons·dds-css·dds-solid·site-kit **다섯
개를 전부 함께 올린다.** 그 다섯 중 아무것도 가져다 쓰지 않는 소비자도
자기가 손댈 수 없는 버전 처올림을 받고, 릴리스 노트는 실제로는 바뀌지
않은 패키지 이름을 나열하게 된다. 이 값은 "우리는 전부 0.11.0이다"를
검증 가능한 사실로 만들기 위한 것이고, 이 계획의 전역 제약("DDS 패키지는
한 버전 열차로 움직인다")이 요구하는 값이라 감수한다 — `fixed` 그룹에
넣기로 판단한 시점(이 패키지를 그룹에 넣으라고 정한 결정)에서 이미
치르기로 한 대가였는데 그 결정 당시엔 이 엔트리에 적히지 않았다. 두
번째: TanStack을 캐럿이 아니라 정확한 값으로 고정했으므로, 라이브러리가
움직여도 자동으로 따라가지 않는다 — compatibility-canary가 새 버전을
검증한 뒤에만 사람이 직접 핀을 올려야 한다.

**재검토 시점.** 두 번째 소비자가 `DataTable`의 props로 표현 못 하는 테이블
모양을 요구할 때 — 프리미티브 노출을 다시 본다. `fixed` 그룹의 버전 처올림이
소비자에게 실제 마찰(체크아웃마다 5개 패키지를 이유 없이 다시 받는 것)로
측정되면 — 그룹 분리(dds-table을 자기 버전 라인으로 빼는 것)를 다시 본다.

---

## D-020 — 국기 아트워크는 서버가 쓰고 브라우저는 `<use>`한다 (2026-09-08)

**결정.** `LocaleMenu variant="flag"`는 메뉴당 `<symbol>` 스프라이트 하나(나라당
본문 하나)를 렌더링하고 모든 국기를 `<svg><use href="#…">`로 참조한다. 스프라이트
마크업은 **서버 빌드만** 쓴다(`src/solid/flag-bodies.server.ts`, 서버 Vite·Vitest
설정이 alias). 브라우저 빌드(`dist/solid.js`)는 본문을 정적으로 import하지 않고
동적 `import()`(자기 청크 `dist/flag-bodies.js`)로만 닿으며, 그마저 서버 HTML 없이
렌더링될 때(하이드레이션이 아닐 때 — `sharedConfig.context` 부재)만 실행한다.
생성기는 `flags.mjs` 하나 대신 `flag-countries.mjs`(로케일→나라, 300바이트)와
`flag-bodies.mjs`(본문 110 KB)로 나누고 `flags.mjs`는 둘을 합친 공개 서브패스로
남는다(API 무변경, `flagCountryFor`·`FLAG_VIEWBOX` 추가). `pnpm check`가 최소
소비자(`fixtures/bundle-probe`)를 실제 Vite로 빌드해 본문이 메인 청크로 돌아오면
실패한다.

**근거.** TraceLinq 랜딩(D-017 첫 소비자)의 클라이언트 메인 청크가 빈 스캐폴드
대비 ~147 KB 커졌고, 그 크기가 `dist/solid.js` 통째(138 KB)와 같아 tree-shaking
실패로 보였다. 최소 소비자로 재현하니 **tree-shaking은 되고 있었다** — 전부
import해도 헤더만 import한 것보다 13 KB 클 뿐. 남은 115 KB는 국기 SVG 14개
(스페인 문장 하나가 85 KB)로, `LocaleMenu`가 `variant`를 **런타임에** 분기하므로
`select` 변형을 쓰는 소비자도 헤더 하나로 국기 전부를 실었고, `Flag`가 effect
안에서 `innerHTML`을 다시 써서 하이드레이션에도 본문이 필요했다. 즉 패키징이
아니라 **데이터가 있는 자리**의 문제다. `preserveModules`나 컴포넌트별
서브패스는 이 바이트를 한 개도 못 뺀다 — 헤더가 정당하게 그 분기에 닿기 때문.

**측정.** 최소 소비자(Vite + vite-plugin-solid, `SiteHeader`만): 147.5 KB /
gzip 38.8 KB → 42.8 KB / gzip 15.1 KB. `dist/solid.js`: 138.2 KB / gzip 32.5 KB →
28.7 KB / gzip 8.2 KB. TraceLinq 랜딩 실측은 changeset에.

**트레이드오프.** ① 스프라이트는 `display:none`이 아니라 0×0 절대배치 — 참조된
clipPath·그라디언트가 `display:none` 트리에서는 해석되지 않는 브라우저가 있다.
② 클라이언트 전용 렌더(서버 HTML 없음)는 국기가 한 박자 늦게 찬다 — 가족 제품은
전부 SSR이라 실제 경로가 아니며, jsdom 테스트는 `await`한다. ③ 서버 HTML에는
본문이 여전히 실린다(메뉴당 나라마다 한 번 — 이전엔 현재 로케일이 두 번).
페이지 무게 ~115 KB는 그대로다; 국기를 **가져오는 파일**(`<img src>`, 브라우저
캐시)로 옮기면 그것도 사라지지만 소비자마다 정적 파일 서빙이 필요한 API 변경이라
별도 결정. ④ D-017의 "제품은 아트워크를 싣지 않는다"는 유지 — 여전히 site-kit
데이터, 자리만 바뀜.

**재검토 시점.** 서버 HTML 무게가 문제로 측정되거나 SSR 없는 소비자가 생기면
(그때 `<img src>` + 소비자 정적 서빙 헬퍼를 검토한다).

## D-019 — SSR에서 선택 상태는 `<option selected>`, `<select value>`가 아니다 (2026-09-05)

**결정.** `SelectLocaleMenu`가 `<select value={...}>` 대신 현재 로케일의
`<option>`에 `selected`를 단다.

**근거.** `<select>`에는 `value` 콘텐츠 속성이 **존재하지 않는다** — DOM
프로퍼티일 뿐이다. 브라우저에서는 Solid가 프로퍼티로 대입해 동작하지만,
SSR은 마크업이 문자열이라 `value="en"`이 브라우저가 무시하는 속성으로
직렬화된다. 결과적으로 **모든 방문자가 모든 언어에서 `option[0]`을 자기
현재 언어로 봤고**, 그 컨트롤을 건드리면 방금 자기 언어였던 것이 아니라
첫 번째 언어로 바뀌었다. BookLinq 배포 워커에서 발견 — 유닛/SSR 테스트는
전부 초록이었다.

**트레이드오프.** 없다. `selected`는 실제 콘텐츠 속성이고 클라이언트 동작도
동일하다.

**재검토 시점.** 없음. 회귀 테스트가 SSR 마크업에 직접 어설션한다
(`ssr.test.tsx`, "marks the current option selected").

---

## D-018 — 제품은 가족 밖 언어를 가질 수 있다: 로케일 레지스트리 (2026-09-05)

**결정.** 로케일을 다루는 site-kit 헬퍼 전부가 **레지스트리**를 받는다.
`defineLocaleRegistry({ extra })`가 가족 14개 + 제품 언어로 레지스트리를
만들고, `validateCatalogs`·`buildMetadata`·`buildSitemap`·`localizedPath`·
`localizedUrl`·`LocaleMenu`·`SiteHeader`가 이를 옵션으로 받는다. 인자를
안 주면 가족 레지스트리 — 기존 소비자는 바이트 단위로 동일하다.

가족 목록(`LOCALES`)은 **넓히지 않는다.** 추가 로케일은
`flagCountry`로 이 패키지가 이미 벤더링한 국기를 지목한다(`FLAGS_BY_COUNTRY`).

**근거.** `LOCALES`는 devslab.kr이 마케팅하는 언어 목록이지 모든 제품의
목록이 아니다. BookLinq는 인도 살롱에 팔고, 그 어시스턴트는 이미 타밀·
텔루구·벵골·마라티·구자라티·칸나다로 답한다. 그 6개를 가족 목록에 넣으면
AskLinq와 devslab.kr의 피커에 번역이 없는 항목 6개가 생기고, 안 넣으면
BookLinq 웹이 제품이 하는 일에 대해 거짓말을 한다. 그래서 가족은
메커니즘을 갖고 제품이 자기 명사를 댄다(D-113 관용구).

국기를 제품이 싣게 하지 않은 이유: 국기 데이터는 라이선스가 있고, 생성되며,
여기서 보안 스캔을 거친다. 그리고 인도 언어 7개가 정당하게 국기 하나를
공유한다 — 국기는 나라를 가리키지 언어를 가리키지 않는다.

**같이 고친 것.** `localeAttributes`가 `dir`을 정의에서 읽는다. 이전 형태는
`canonical === "ar" ? "rtl" : "ltr"`이었고, 이는 아랍어가 가족의 유일한 RTL
언어인 동안에만 참이었다 — 우르두어나 히브리어를 추가한 제품은 모든 테스트가
초록인 채로 좌횡서로 렌더됐을 것이다.

**트레이드오프.** 레지스트리를 안 넘기면 조용히 가족 목록으로 동작한다 —
제품이 `buildMetadata`에 레지스트리를 빠뜨리면 페이지는 타밀어로 그려지면서
hreflang에는 타밀어가 없다고 말한다. 소비자 쪽 테스트가 잡아야 한다.

**재검토 시점.** 세 번째 제품이 가족 밖 언어를 요구하면 — 그때는 목록이
아니라 등록 방식을 다시 본다.

---

## D-017 — 국기는 site-kit 데이터, 아이콘 세트 밖 (2026-09-02)

**결정.** 로케일 피커의 국기 14개는 `@devslab/site-kit`가 `src/core/flags.mjs`로
소유한다(flag-icons 7.5.0에서 벤더링, MIT). `dds-icons`에는 넣지 않는다.
`LocaleMenu`는 `variant="flag"`를 얻고 기본값 `select`는 무변경이다.

**근거.** D-013의 아이콘 계약(`check-icons.mjs`)은 색 리터럴 금지·`currentColor`
스트로크 필수를 기계적으로 강제한다. 다색 채움인 국기는 그 계약을 만족할 수 없고,
계약을 느슨하게 하면 아이콘 세트가 아이콘 세트이기를 그만둔다. 로케일 목록을
소유한 패키지가 그 목록의 국기도 소유하는 것이 데이터의 자리다.

**첫 소비자.** TraceLinq 랜딩(gettracelinq.app). 허브·devslab.kr·AskLinq
마케팅의 같은 14로케일 피커는 이후 갈아탈 수 있다.

## D-016 — 외부 디자인 시스템 참조 표기 제거 (2026-09-01)

**결정.** 공개 문서(README·스펙·백로그)에서 특정 외부 디자인 시스템을 참조
모델로 호명하는 표기를 전부 제거한다 (소유자 지시). 구조 설명은 DDS 자신의
토큰 이름(`palette.*` / `color.bg.*`)으로만 한다.

**근거.** 레포가 공개된 뒤(D-015) 타사 브랜드 호명은 포지셔닝·상표 관점에서
불필요한 부채다. 규칙 자체(3층 컬러, 알파 스케일, 시맨틱 전용 소비)는 변경
없음 — 표기만 바뀐다.

**적용.** 앞으로 문서에 외부 디자인 시스템 이름을 참조 크레딧으로 추가하지
않는다.

## D-015 — DDS 배포 패키지는 공개 npm + source-available (2026-08-31)

**결정.** `dds-tokens`, `dds-css`, `dds-icons`, `dds-solid`, `site-kit`은 공개
npm의 `@devslab/*`로 lockstep 배포한다. 설치·컴파일·제품 번들은 허용하지만
패키지 수정·재배포·재판매·경쟁 디자인 시스템 제작은 금지하는 DevsLab
Source-Available License 1.0을 적용한다. 이는 OSI 오픈소스가 아니다.

`compatibility-canary`는 내부 검증 애플리케이션이므로 계속 private·미배포다.
릴리스는 npm provenance와 `NPM_TOKEN`을 사용한다. 이 결정은 D-014의 비공개
GitHub Packages 배포 결정을 대체한다.

**근거.** 소비와 검증은 공개적으로 단순화하면서, DDS 자체와 브랜드 자산의
변형·재상품화를 허용하지 않는다.

## D-014 — JavaScript 패키지 스코프는 공개 여부로 구분 (2026-08-29)

**과거 결정(대체됨).** npmjs에 공개하는 JavaScript 패키지는 `@devslab/*`, 사내에서만
사용하는 restricted 패키지는 GitHub Packages의 별도 private scope를 사용한다.
DDS의 다섯 패키지와 Site Kit은 당시 내부 공통 인프라로 분류했으며,
최초 발행 뒤 GitHub 패키지 가시성을 Private에서 Internal로 변경한다.

**인증.** 릴리스는 저장소가 자동 발급하는 `GITHUB_TOKEN`과
`packages: write`를 사용한다. 소비 서비스 CI와 개발자 PAT에는
`read:packages`만 부여한다. npmjs용 `NPM_TOKEN`은 공개 `@devslab/*`
릴리스에만 사용하며 이 저장소의 내부 패키지 릴리스에는 사용하지 않는다.

**근거.** 공개 SDK와 내부 UI 인프라의 배포·권한 경계를 패키지 이름만으로
식별할 수 있고, 내부 패키지를 npmjs 공개 릴리스와 혼동하지 않게 한다.

**상태.** D-015로 대체됨.

## D-013 — dds-icons: 세트는 둘, 컴포넌트는 아직 없음 (2026-08-15)

**결정.** `@devslab/dds-icons` 를 만들면서 세 가지를 정한다.

1. **스트로크는 1.6(코어) / 1.8(site)** — 스펙 §3.7 의 "1.5px" 는 에셋이
   존재하기 전에 쓴 숫자다. 실제로 그려진 세트는 1.6 이고, AskLinq 위젯이
   그 값으로 이미 프로덕션에 나가 있다. devslab.kr 전용 `site-` 7종은
   32–40px 로 크게 쓰이므로 1.8 로 그려졌다. 스펙을 에셋에 맞춰 개정한다.
2. **이름은 바꾸지 않는다** — 코어 22종의 이름은 AskLinq 위젯의 카드
   아이콘 키와 1:1 이다. 더 예쁜 이름으로 정리하는 순간 라이브 카드가
   깨진다. `site-` 접두는 이름의 일부이고, 폴더(`svg/site/`)는 정리용이다.
3. **프레임워크 컴포넌트는 생성하지 않는다** — 스펙 §2("프레임워크별
   패키지는 그 프레임워크 제품이 실제로 존재할 때만")를 아이콘에도 그대로
   적용한다. 출하 형태는 SVG 파일 + 스프라이트 + path 데이터 맵
   (`icons.js`/`.d.ts`) 셋이고, 이 셋이면 웹·SSR·RN·위젯이 각자 만들 수
   있다.

**근거.** 아이콘 세트가 썩는 방식은 정해져 있다 — 어디선가 다른 그리드의
아이콘이 하나 들어오고, 누가 `stroke="#71717a"` 를 박고, 이름이 갈라진다.
그래서 규약을 문서가 아니라 `scripts/check-icons.mjs` 에 넣었다(24 그리드,
`currentColor`, 라운드 캡, 세트별 스트로크, 색 리터럴 금지, body 안
stroke/fill 오버라이드 금지, kebab 이름, dist 드리프트).

**트레이드오프.** 스트로크가 두 값이라 "단일 세트"가 아니다 — 대신 site
세트는 폴더·접두·문서에서 분리돼 있고, 검사기가 코어에 1.8 이 섞이는 것을
막는다. 컴포넌트를 안 만들었으므로 소비자마다 4–5줄짜리 렌더 헬퍼를
직접 쓴다(그 헬퍼가 두 번째로 복사되는 순간이 승격 신호다).

**재검토 시점.** 첫 React 또는 RN 소비자가 생길 때 (그때 codegen 추가).

## D-012 — 멀티브랜드는 규약만 출하한다: 매핑 CSS 는 제품이 소유 (2026-08-15)

**결정.** D-010("브랜드 색은 제품 소유")의 CSS 구현 방식을 확정한다.
업스트림 시안이 제안한 두 안 중 **(b)** 를 택한다:

- (a) dds-tokens 가 제품별 브랜드 JSON 을 받아 `brands.css` 를 **빌드
  산출물로 생성** — 반려.
- **(b) 제품이 자기 매핑 CSS 를 소유하고, dds 는 `data-brand` 어트리뷰트
  규약과 "덮어도 되는 여섯 토큰"의 목록만 문서화 — 채택.**

규약: `[data-brand="<product>"]` 아래에서 `bg.brand` · `bg.brand-hover` ·
`bg.brand-subtle` · `text.on-brand` · `text.brand` · `border.focus` 여섯
개만 재매핑한다. `data-theme` 과 조합 가능하고, 다크에서 달라지는 것만
추가로 덮는다. 스펙 §3.1 에 규약·표·예제 스니펫을 실었다.

**근거.** (a) 를 택하면 색 값의 소유권이 DDS 로 넘어온다 — 제품이 브랜드
색을 바꿀 때마다 dds 릴리스가 필요하고, 제품 수만큼 dds 가 제품을 알아야
한다. D-010 이 정한 건 그 반대다. 게다가 AskLinq 는 이미
`apps/api/src/dds/brand.ts` 라는 자기 브랜드 파일을 갖고 있고, BookLinq 는
`app.css` 에 갖고 있다 — (b) 는 이미 있는 사실을 규약으로 승인하는 것이고,
(a) 는 그것을 걷어와 새 파이프라인을 만드는 것이다.

**트레이드오프.** 제품 브랜드 값의 단일 목록이 어디에도 없다(각 제품
레포에 흩어진다). 제품이 여섯 토큰 밖을 덮어도 dds 가 기계적으로 막을 수
없다 — 문서상의 계약이다. 대신 `dds-icons`·`dds-css` 는 제품을 하나도
모른 채로 남는다.

**재검토 시점.** 세 번째 제품이 브랜드 색을 정의할 때 (D-010 과 같은
시점 — 그때 제품 브랜드 레지스트리 승격 여부를 판단).

## D-011 — 반전 면은 시맨틱 페어(`bg.inverse` / `text.on-inverse`)로 (2026-08-15)

**결정.** 툴팁처럼 페이지와 반전되는 면을 위해 시맨틱 토큰 두 개를 추가한다:
`color.bg.inverse` (라이트 `zinc.900` / 다크 `zinc.50`), `color.text.on-inverse`
(라이트 `zinc.50` / 다크 `zinc.950`). D-006이 danger 채움 면을 위해
`text.on-status`를 추가한 것과 같은 이유·같은 모양이다.

**근거.** 업스트림 시안의 툴팁은 `--dds-color-text-primary`를 **배경**으로,
`--dds-color-bg-default`를 **글자색**으로 썼다. 두 테마 모두에서 결과는
맞지만(반전이 자동으로 따라온다) 이름이 거짓말을 한다 — "텍스트 토큰을
배경에 쓴다"가 한 번 허용되면 다음 컴포넌트는 아무 토큰이나 아무 자리에
쓴다. 시맨틱 레이어의 값어치는 이름이 쓰임을 말한다는 것 하나다.

**트레이드오프.** 토큰 2개 증가(그리고 두 테마 매핑·문서 표·프리뷰 스와치
동반 갱신). 대신 컴포넌트 CSS는 `bg-inverse` 하나만 보면 되고, 나중에
반전 면이 더 생겨도(스낵바·코치마크) 같은 페어를 쓴다.

**재검토 시점.** 반전 면에 보더·그림자가 필요해질 때 (그때
`border.inverse`를 추가할지 판단).

## D-010 — DDS는 멀티 브랜드: 브랜드 색은 제품 소유 (2026-08-13)

**결정.** cyan은 데브스랩 **코퍼레이트** 브랜드다(devslab.kr·dds 쇼케이스·
회사 표면). 제품은 자기 브랜드 색을 소유한다 — AskLinq는 teal(제품 레포
`brand.ts`가 명명), 이후 제품도 동일. DDS가 공급하는 것은 뉴트럴·상태색·
타이포·간격·규칙·구조이고, on-brand 규칙은 색이 무엇이든 모든 채워진
브랜드 면에 적용된다. 스펙 3.1의 "AskLinq teal은 잠정값 → cyan 수렴"
문구는 폐기(개정 완료).

**근거.** P1-3이 스펙 문구대로 AskLinq를 cyan으로 수렴시키자 소유자가
즉시 반려했다: "홈페이지랑 같은 색상으로 한거는 좀 아닌거같은데" — 제품이
회사 사이트와 같은 색이면 제품 정체성이 없다. 멀티 브랜드는 표준적인
DS 구조이기도 하다(코어 시스템 + 제품별 브랜드 토큰).

**트레이드오프.** "모든 시각 값은 토큰에서"의 브랜드 색 예외가 제품
레포마다 하나씩 생긴다 — 대신 각 제품의 `brand.ts` 한 곳으로 제한되고,
그 파일이 곧 제품 브랜드 토큰이다. 제품 수가 늘어 관리가 필요해지면
DDS에 제품 브랜드 레지스트리(테마 파일)를 승격 검토.

**재검토 시점.** 세 번째 제품이 브랜드 색을 정의할 때 (그때 레지스트리
승격 여부 판단).

## D-009 — 미발행 기간의 소비 방식: vendored 사본 (2026-08-13)

**결정.** 패키지 발행(공개 여부·레지스트리)이 결정되기 전까지, 소비자는
`dds-tokens` 빌드 산출물의 **커밋된 사본**을 든다. 첫 소비자 devslab.kr:
`src/styles/dds/{tokens.css,preset.cjs,palette.json}` + 동기화 스크립트
(`scripts/sync-dds-tokens.mjs`) — 토큰 변경 후 스크립트 실행 → diff 리뷰 →
커밋.

**근거.** devslab.kr은 Cloudflare Workers Build가 GitHub repo만 보고
빌드한다 — file: 의존은 CI에서 죽고, GitHub Packages 소비는 빌드 환경에
토큰 시크릿을 요구한다. 발행 방식이 미해결 오너 질문인 상태에서 그 결정을
소비 시작의 전제로 만들지 않는다.

**트레이드오프.** 사본은 손동기화라 드리프트 가능 — 산출물 헤더의 "do not
edit" + diff 리뷰가 방어선. 소비자가 늘면 사본도 늘어난다.

**재검토 시점.** 발행이 결정되는 즉시 — 소비자들은 사본을 지우고 의존성으로
전환한다 (스크립트가 그 목록의 역할).

## D-008 — Storybook은 html-vite, React 비의존 (2026-08-13)

**결정.** Storybook(v10)을 `@storybook/html-vite` 프레임워크로 도입한다.
스토리는 dds-css 클래스 마크업(HTML 문자열/DOM 노드)이고, Foundations
스토리는 생성된 `tokens.js`를 임포트해 렌더한다. 테마는 툴바 스위치가
`data-theme`을 바꾸는 것으로 — 소비자 앱과 같은 메커니즘.

**근거.** 스펙 §2 "코어는 CSS, 프레임워크는 소비자" — React 프레임워크로
스토리를 쓰면 쇼케이스가 곧 React 바인딩이 되어 규칙을 스스로 어긴다.
tokens.js에서 렌더하면 Foundations 문서가 산출물과 어긋날 수 없다.

**트레이드오프.** args 컨트롤이 React 대비 수동(render 함수 직접 작성).
docgen 자동화 없음 — 컴포넌트 계약 문서는 `docs/components.md`가 정본.

**재검토 시점.** dds에 React 바인딩 패키지가 실제로 생기면 (그때도 코어
스토리는 html 유지).

## D-007 — dds-css 컴포넌트 규약 (2026-08-13)

**결정.** ① 클래스 네임스페이스 `dds-` (BEM 변형: `.dds-btn--primary`,
요소: `.dds-field__label`). ② 상태 훅은 스타일 전용 클래스가 아니라 **의미
있는 속성**: loading은 `aria-busy="true"`, 에러는 `aria-invalid="true"`(클래스
`--error`도 지원), disabled는 `[disabled]`. ③ 컨트롤 높이(32/40/48)는 간격
스케일 변수에서, 텍스트는 타이포 세트 변수에서 가져온다 — px 리터럴은
보더/아웃라인 두께(1–2px)와 글리프 지오메트리(6px 도트), 레이아웃 기본값
(다이얼로그 max-width)에만 허용. ④ 하드코딩 금지는 리뷰가 아니라 CI가
강제한다 (`check-css.mjs`: hex·rgb·hsl·oklch·color()·color-mix·!important 금지
+ 번들 신선도 검사).

**근거.** ② 상태를 aria 속성에 걸면 접근성이 옵션이 아니라 스타일이 나오는
조건이 된다 — 마크업이 AT에 거짓말하면 스타일도 깨져 보이므로 자기 교정된다.
④ "같은 클래스 중복 정의·하드코딩" 계열 사고(asklinq `.empty`/`.badge` 등
7회)는 전부 리뷰가 놓친 것 — 기계 검사만 재발을 막았다.

**트레이드오프.** color-mix까지 금지라 옅은 브랜드 틴트는 시맨틱 토큰
추가로만 가능(그게 의도 — 믹싱 비율은 컴포넌트가 아니라 토큰의 결정).

**재검토 시점.** 컴포넌트가 정당한 계산 색을 필요로 하는 사례가 쌓이면
(그때도 토큰 레이어에 계산을 올린다).

## D-006 — `color.text.on-status` 시맨틱 토큰 추가 (2026-08-13)

**결정.** 상태색 채움 면 위 텍스트용 시맨틱 토큰 `color.text.on-status`
(라이트 `white`, 다크 `zinc.950`)를 추가한다. 첫 소비자는 danger 버튼.

**근거.** preview 프로토타입은 danger 버튼 텍스트를 테마별로 하드코딩했다
(`.panel--light … #ffffff` / `.panel--dark … #09090b`) — dds-css는 하드코딩이
금지라 이 값의 자리가 토큰에 필요했다. `on-brand`와 별개인 이유: brand(cyan)는
두 테마 모두 어두운 텍스트가 정답이지만, 상태 채움 면은 라이트에서 진한색
(red.700 위 흰색 6.4:1), 다크에서 밝은색(red.400 위 zinc.950 약 8:1)이라
매핑이 갈린다.

**트레이드오프.** "채움 상태 면"이 danger 하나뿐인 지금은 토큰 하나가
과해 보일 수 있음 — 그러나 대안(bg.default 재사용)은 우연히 값이 같은
것이지 의미가 아니다.

**재검토 시점.** success/warning 채움 버튼이 생겨 상태별로 갈려야 하면
`on-danger` 등으로 분화.

## D-005 — Style Dictionary는 해석 엔진, 렌더링은 자체 포매터 (2026-08-13)

**결정.** Style Dictionary v4는 토큰 그래프 파싱과 `{palette.*}` 참조 해석에
쓰고, 산출물 렌더링은 `build.mjs`의 명시적 포매터가 담당한다. 소스에 이
파이프라인이 모르는 `$type`이 나타나면 조용히 건너뛰지 않고 **빌드가
실패**한다.

**근거.** 우리 토큰에는 SD 내장 변환이 그대로 못 다루는 형태가 있다
(`shadow`가 web/iOS/Android 3플랫폼 값을 한 토큰에 담음, `typography` 컴포지트,
숫자 dimension). 내장 변환 이름에 의존하면 SD 마이너 버전마다 검증할 표면이
늘어난다 — 해석은 SD, 렌더는 우리 것이면 모든 `$type`의 출력 형태가 리뷰
가능한 코드로 남는다.

**트레이드오프.** SD의 outputReferences 같은 편의 기능을 포기. 토큰 종류가
늘 때마다 포매터를 손봐야 하지만, 그게 곧 "새 토큰 종류는 의식적 결정"이라는
스펙 §3.2의 태도와 일치한다.

**재검토 시점.** SD v5의 DTCG 지원이 우리 컴포지트를 네이티브로 다루게 되면.

## D-004 — Tailwind: 색 이름은 시맨틱 경로 유지, spacing은 기본 그리드 위임 (2026-08-13)

**결정.** ① Tailwind 색 이름은 시맨틱 경로에서 `color`만 뗀 형태
(`--color-bg-brand` → `bg-bg-brand`, `--color-text-primary` → `text-text-primary`).
② spacing 스케일은 오버라이드하지 않는다 — Tailwind 기본 0.25rem 그리드가
DDS 4px 스케일(`space.0–64`)과 정확히 일치한다 (`p-1`=4px … `p-16`=64px).

**근거.** 스펙 §2의 예시(`bg-brand`, `text-primary`)처럼 역할을 떼면
`color.bg.brand`(cyan.500)와 `color.text.brand`(cyan.700)가 같은 이름 "brand"로
충돌한다 — Tailwind 색 네임스페이스는 평평해서 역할별 다른 값을 표현할 수
없다. `bg-bg-brand`는 못생겼지만 무손실·기계적이고, 어떤 유틸리티와도 조합
가능하다. spacing을 `--spacing-8: 8px`식으로 덮으면 기본 Tailwind의 `p-8`(2rem)과
의미가 달라져 모든 Tailwind 경험자를 배신한다 — 기본 그리드가 이미 우리
스케일이므로 덮을 이유가 없다.

**트레이드오프.** 스펙 §2 예시 표기와 실제 클래스명이 다르다(문서로 해소).
DDS 스케일 밖 값(`p-7`=28px 등)도 Tailwind에서 열려 있다 — 스케일 준수는
린트/리뷰 몫.

**재검토 시점.** Tailwind가 네임스페이스드 색을 지원하거나, `bg-bg-*` 표기에
대한 소비자 불만이 실제로 쌓이면.

## D-003 — 다크는 `[data-theme="dark"]` 셀렉터, 팔레트는 CSS 미출하 (2026-08-13)

**결정.** ① `tokens.css`의 다크 블록 셀렉터는 `[data-theme="dark"]`
(`:root[data-theme="dark"]`가 아님). ② `prefers-color-scheme` 미디어 쿼리는
내보내지 않는다. ③ 원시 팔레트(`palette.*`)는 CSS 변수로 내보내지 않는다.
④ 각 테마 블록에 `color-scheme`을 함께 선언한다.

**근거.** ① 루트 한정이 아니면 서브트리 테마 고정이 공짜다 — preview의
트윈 패널, 테마 고정 임베드(asklinq 위젯의 오너 오버라이드와 동형)가 같은
파일로 된다. ② 자동 추종 여부는 제품 결정이다(devslab.kr은 토글+localStorage,
asklinq 위젯은 호스트 명도 감지) — 토큰 레이어가 정책을 정하면 소비자가
`!important`로 싸우게 된다. ③ 스펙 §3.1 "컴포넌트는 시맨틱만" 규칙을 배포물
차원에서 강제 — CSS에 없는 변수는 참조할 수 없다. ④ 폼 컨트롤·스크롤바가
테마를 따라오게 하는 표준 신호.

**트레이드오프.** 팔레트가 필요한 정당한 매핑 정의 코드는 `tokens.ts`를
써야 한다. 자동 다크 추종을 원하는 소비자는 자기 쪽에서 클래스를 얹어야 한다.

**재검토 시점.** 팔레트 CSS 변수가 필요한 실소비자가 나타나면 (그때도 별도
opt-in 파일로).

**개정 (2026-08-13, P1-2).** 라이트 블록 셀렉터를 `:root, [data-theme="light"]`로
확장 — 다크 루트 안에서 서브트리를 라이트로 되고정할 수 있어야 트윈 패널이
루트 토글과 무관하게 성립한다. 중첩은 요소가 자기 `data-theme` 값 하나만
매칭하므로 순서·특이도 충돌이 없다.

## D-002 — CSS 산출물은 px, tokens.ts는 단위 없는 숫자 (2026-08-13)

**결정.** `tokens.css`·Tailwind 산출물의 치수(타이포 크기/행간, spacing,
radius)는 px로 내보낸다. `tokens.ts`는 단위 없는 원시 숫자를 유지한다
(웹 px, RN pt — 스펙 §3.2 "숫자가 같으므로 표는 하나다").

**근거.** 스펙의 rem 언급은 "1rem = 16px 루트 기준 환산"의 표기이지 소비
계약이 아니다. px는 preview·devslab.kr·asklinq 위젯의 실사용과 일치하고,
rem 출력은 호스트 페이지가 루트 폰트 크기를 바꾸는 임베드 환경(asklinq
위젯이 정확히 이 환경)에서 토큰 값이 호스트에 휘둘리는 문제를 만든다.

**트레이드오프.** 사용자 폰트 크기 설정(브라우저 루트 확대)에 타이포가
비례하지 않는다 — 접근성 확대는 페이지 줌이 담당(모던 브라우저 기본).

**재검토 시점.** rem 기반 반응형 타이포가 실제 요구되는 제품 표면이 생기면
(그때 rem 산출물을 *추가*한다 — px를 바꾸지 않는다).

## D-001 — 토큰 소스는 레포 루트 `tokens/` 유지 (2026-08-13)

**결정.** `packages/dds-tokens`를 만들되 토큰 JSON 소스는 레포 루트
`tokens/`에 남긴다. 패키지는 빌드 파이프라인과 산출물만 소유한다.

**근거.** CLAUDE.md의 진실의 원천 목록(문서 §번호 ↔ `tokens/*.json` ↔
preview)이 전부 루트 기준으로 서로를 참조하고, 문서·토큰 동기화 규칙("한쪽을
고치면 다른 쪽도")의 대상들이 한 눈에 나란히 있어야 지켜진다. 패키지 안으로
옮기면 "토큰 수정은 main 직접 푸시 허용" 규칙(CLAUDE.md)과 "패키지 구조 변경은
PR" 규칙이 같은 디렉토리에서 충돌한다.

**트레이드오프.** 패키지가 `../../tokens`를 읽는 비관례적 상대 경로 —
`files: ["dist"]`라 배포물에는 영향 없음.

**재검토 시점.** 토큰 소스만 따로 버저닝할 필요가 생기면 (지금은 lockstep이라
없음).
