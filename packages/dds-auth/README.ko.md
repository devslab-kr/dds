# DDS Auth

소셜 로그인 공통 계약, 제어형 DDS React 로그인 버튼 목록, 서비스 설정형 로그인 영역을 제공합니다. 중앙 계정 서비스를 만들거나 세션 저장·OAuth 코드 교환·이메일 기반 계정 자동 연결을 수행하지 않습니다.

## 설치

기존 공개 npm DDS 묶음과 별도로 GitHub Packages에서 배포합니다. 아래 제공자 카탈로그와 선택 설정을 쓰려면 0.2.0이 배포된 뒤 설치하세요. 사용자/프로젝트 `.npmrc`에 `@devslab-kr:registry=https://npm.pkg.github.com`을 설정하고 조직의 GitHub Packages 읽기 권한으로 인증합니다. 토큰을 저장소에 커밋하지 않습니다. DDS peer 패키지는 공개 npm에서 받습니다.

```sh
npm install --save-exact @devslab-kr/dds-auth@0.2.0
# /react 및 /styles.css 소비 앱에서만 필요한 선택 peer:
npm install --save-exact @devslab/dds-react@0.29.2 react@19.3.0 react-dom@19.3.0
```

앱 잠금 파일을 유지합니다. 루트 진입점만 사용하는 서버/Workers는 React peer를 설치할 필요가 없습니다. 이 패키지는 Query·Form·공유 스토어·인증 SDK를 추가하지 않습니다.

## 기존 앱 연결

`@devslab-kr/dds-auth/react`의 `SocialLoginOptions`는 제어형 표시 컴포넌트입니다. 앱의 기존 계정 화면 안에서 사용하고 Query mutation, 네이티브 로그인/취소, 동의·초대 확인, UUID/CAS, 최근 성공 제공자, 복구 링크는 유지합니다. 이 컴포넌트는 요청·이동·세션·타이머를 소유하지 않습니다.

```tsx
<SocialLoginOptions
  aria-label="소셜 로그인"
  providers={verifiedProviders}
  pendingProvider={busyProvider}
  loading={providerQueryPending}
  disabled={!consentReady || nativeUnavailable}
  onSelect={startUsingExistingMutation}
  buttonLabel={(_id, label) => `${label}로 로그인`}
  providerIcons={officialProviderIcons}
  providerBadge={(id) =>
    id === lastSuccessfulProvider ? <span>최근 사용</span> : null
  }
/>
```

`buttonClassName(provider)`로 승인된 서비스별 제공자 스타일을 유지합니다. `providerHint`와 `unavailableReason` 설명은 `aria-describedby`로 버튼에 연결됩니다. `onButtonRef`는 앱의 포커스 복구를 지원합니다. 빠진·중복·잘못된 제공자 상태는 비활성 처리합니다. 로딩 중에는 모든 버튼이 비활성이며 로딩 알림과 오류는 앱이 소유합니다.

## 서비스별 로그인 선택

`providerOrder`를 생략하면 기존처럼 Google·카카오·네이버와 앱이 전달하던 아이콘을 유지합니다. 더 많은 옵션을 쓰려면 `SOCIAL_PROVIDER_CATALOG`에서 Google, 카카오, 네이버, LINE, Microsoft, LinkedIn, Apple, Facebook, GitHub, GitLab, Discord, Figma, Notion, X, Slack, Zoom, WeChat 중 골라 표시 순서대로 전달하세요.

```ts
const providerOrder = ["google", "github", "discord"] as const;
type ServiceProvider = (typeof providerOrder)[number];
```

`SocialLoginOptions` 또는 `LoginPanel` 및 `createSocialAuthClient`에 동일한 `providerOrder`를 전달합니다. 서버 확인 결과는 `ProviderAvailability<ServiceProvider>`로 전달합니다. 선택된 제공자의 설정이 없거나 잘못된 경우 버튼은 표시되지만 사용할 수 없습니다. 제품별 OAuth 자격 증명, 공급자 ID 변환, 콜백, 세션은 각 서비스 어댑터에서 설정합니다. [영문 예제](README.md#choose-providers-for-a-service)에 구체적인 사용법이 있습니다.

`providerOrder`를 쓰면 `@devslab-kr/dds-auth/styles.css`가 확인된 로고를 불러옵니다. `providerIcons`로 로고를 교체하고 `null`로 숨길 수 있습니다. GitLab은 글자로 표시합니다. Apple·Facebook·WeChat은 승인된 아이콘이나 공식 버튼을 앱에서 제공합니다. 각 제공자의 공식 버튼 규칙을 따르세요. [로고 출처와 사용법](assets/README.md)을 참고하세요.

## 로그인 영역

`LoginPanel`은 `brand`, `title`, `description`, `providers`, `client`, `returnTo`, `redirectOrigins`, `onRedirect`, `terms`, `privacy`를 받습니다. 전체 페이지가 아닌 재사용 영역입니다. 앱 자체 입력/동의 UI는 `children`으로 넣습니다. 약관 링크를 표시하는 행위로 동의를 추정하지 않습니다. 실제 전체 사용 예제는 [영문 가이드](README.md)의 Configurable login section을 참고합니다.

제공자 상태는 `{id,status:'available'}` 또는 `{id,status:'unconfigured'|'disabled',reason:공개코드}`입니다. 선택된 제공자가 표시되고 명시적으로 확인된 available만 사용할 수 있습니다. client가 없으면 모두 비활성입니다. 서버/콘솔 설정이 누락된 제공자를 타입 지원만으로 연결 완료처럼 표시하지 않습니다.

`providerIcons`로 바꿀 공식 이미지는 패키지 `assets`에서 앱 공개 경로로 복사하거나 번들러 URL import를 사용할 수 있습니다. 원본 URL·변환·SHA256은 `assets/provenance.json`에 기록했습니다. qoqo와 Qooroo에서 확인한 자산을 재사용하며 새 로고를 그리거나 색을 바꾸지 않았습니다. 자산 제공과 운영 설정 또는 브랜드 승인은 별개입니다.

`returnTo`는 서비스 내부 경로이며 일반적인 검색어의 인코딩 공백/퍼센트는 보존합니다. `redirectOrigins`는 정확한 HTTP(S) origin 목록입니다. 잘못된 항목 하나라도 있으면 전체 목록을 거부합니다. 서버의 경로/매개변수/콜백 허용 목록 검증은 별도로 유지합니다. `intent:'link'`, `requestId`는 앱 소유 값을 그대로 전달하며 서버의 계정 연결 권한 검증을 대신하지 않습니다.

한 번에 한 요청을 시작하고 자동 재시도하지 않습니다. 기본 15초(`timeoutMs`, 250~120000ms) 후 대기 UI를 중단하고 명시적인 재선택을 안내합니다. 시간 초과는 서버 작업이 없었다는 뜻이 아니므로 앱의 UUID·결과 불명 복구 규칙을 유지해야 합니다. 범위·제공자 준비 상태·허용 origin 변경과 언마운트 시 이전 작업을 취소하고 응답을 무시합니다. 이동 중 추가 클릭을 막지만 `onRedirect` 반환을 로그인 성공으로 간주하지 않습니다.

`messages`로 기본 한국어 문구를 바꾸며 `loginMessagesKo`, `loginMessagesEn`을 제공합니다. `error`에는 공개 오류 enum만 넣습니다. raw OAuth 오류·토큰·임의 예외 문구를 표시하지 않습니다. `onAuthError`에도 정제된 결과만 전달합니다. `retryable:false`는 재선택 안내 버튼을 숨기며 이후 사용자의 명시적인 제공자 클릭까지 정책적으로 금지하지 않습니다. 차단이 필요하면 제공자 상태를 비활성으로 전달합니다.

## 서버 어댑터·상태 경계

루트 진입점은 React/브라우저 import와 런타임 의존성이 없습니다. `createSocialAuthClient({endpoint,fetch,timeoutMs})`는 로컬 endpoint에 JSON POST 한 번만 전송하며 same-origin credential, no-store, `redirect:'error'`, abort를 적용합니다. 기본 응답은 `redirect/url` 또는 `error/code/retryable`입니다. 다른 기존 API 계약은 기존 앱 전송 함수를 `SocialAuthClient.start`로 연결합니다. 네트워크 예외는 앱에 전달하며 자체 시간 초과는 unavailable로 매핑합니다.

`SocialAuthAdapter<Context,Session>`의 providers/start/callback/session/signOut은 요청별 서버 계약입니다. 원래 `Response`를 보존해 Set-Cookie·캐시·상태 코드·리다이렉트를 유지합니다. Session은 앱 서버의 제네릭 값이며 LoginPanel props에 넣지 않습니다. 패키지는 제공자 SDK 구현이나 세션 저장소를 포함하지 않습니다.

qoqo는 Supabase SSR cookie exchange, 봉인된 flow 쿠키, 정확한 복귀 경로/초대, Naver 프로필 확인, 계정 연결 UUID/CAS, 기기·사람·MFA 검증을 유지합니다. naver→custom:naver 변환은 어댑터 내부입니다. JN은 DB의 일회용 시도·PKCE·불투명 쿠키·암호화 BFF 세션과 회원/조직/계약 권한을 유지합니다. Accounts OIDC 기존 회원 이관은 별도 흐름입니다. 서비스 간 키·세션·권한 공유나 이메일만을 근거로 한 계정 연결을 추가하지 않습니다.

앱은 CSRF/origin, PKCE/state/만료/일회성, 정확한 콜백·이동 허용 목록, HttpOnly/Secure 쿠키, 서버 권한, 로그아웃 폐기, UUID/CAS·결과 불명 복구를 소유합니다. `isSafeReturnTo`, `isSafeAuthRedirect`는 기본 방어이며 업무 허용 목록을 대체하지 않습니다.

Next.js 앱의 서버 조회/변경은 TanStack Query, 업무 입력·동의 폼은 TanStack Form 경계를 유지합니다. LoginPanel의 대기/오류/이동 상태만 로컬 상태입니다. 공유 상태가 없어 Zustand/TanStack Store 신규 도입은 해당 없음입니다. 앱의 기존 선택과 요청/브라우저 격리·계정/회사/매장 키·로그아웃 폐기 규칙을 유지합니다.

## 검증

패키지 `test`/`check`/`build`는 계약과 실제 사용자 동작을 검사합니다. `verify:consumer`는 추적되는 consumer fixture 안에 pack/install하고 공개 DDS 0.29.2 고정 소비, 타입, Node/worker import, 브라우저 없는 SSR, hydration DOM 유지와 오류 동작을 확인합니다. 임시 프로젝트를 만들지 않습니다. Playwright `playwright.auth.config.ts`는 `/login.html`의 명시적 어댑터 시뮬레이션에서 키보드·복구·로딩·설정 누락·반응형·양 테마·긴 문구·공식 자산·axe를 검사합니다. 실제 제공자 로그인이나 운영 콘솔 준비 완료 검증과 구분합니다.
