# 공통 로그인 패키지와 앱 상태 경계 — 2026-11-04

공통 로그인은 인증 공급자를 시작하는 UI와 어댑터 계약을 제공한다. 서버 세션, 계정 연결 권한, 초대 수락, Query 캐시를 패키지 전역 상태로 옮기지 않는다. qoqo와 JN은 각 서비스의 기존 인증 저장 방식을 유지한다.

## 확인한 버전과 선택

2026-11-04 npm 레지스트리 조회: Zustand `5.0.16`, `@tanstack/store` 및 `@tanstack/react-store` `0.11.2`. 이 문서 때문에 앱 의존성을 갱신하지 않는다. qoqo의 실제 잠금 버전과 구현은 Zustand `5.0.16`이다.

| 기준 | Zustand | TanStack Store | 이번 작업의 결정 |
| --- | --- | --- | --- |
| 안정성/API | 기존 qoqo가 v5 API를 사용 | 공식 페이지가 alpha/v0로 표시 | 검증된 qoqo 구현 유지 |
| 저장/복원 | 공식 persist, partialize, merge, skipHydration 지원; qoqo에서 실제 사용 | reactive store/derived/batch가 주역할; 같은 저장/복원 동작을 별도 검증해야 함 | 최근 로그인 제공자 enum만 기존 방식으로 저장 |
| SSR/하이드레이션 | Next.js 공식 안내는 요청별 스토어와 서버/클라이언트 초기값 일치를 요구 | 프레임워크 중립 store 자체가 요청 격리나 세션 저장을 대신하지 않음 | 요청·브라우저 인스턴스별 생성; 모듈 전역 사용자 상태 금지 |
| 개발 도구 | 공식 devtools middleware, Redux DevTools 연동 | reactive 파생 상태 및 프레임워크 어댑터가 장점; 별도 팀 검증 필요 | 이번 변경에서 운영 디버깅 도구나 상태 엔진 교체 없음 |
| 기존 팀 구현 | qoqo의 UI scope/authEpoch/최근 제공자 코드와 검증이 존재 | 이번 로그인 경계에 추가 이득이 확인되지 않음 | TanStack 계열 통일만을 이유로 교체하지 않음 |

JN은 현재 공유 UI 스토어를 도입하지 않고 필요한 로컬 상태·Context와 TanStack Query를 사용한다. 공통 LoginPanel의 pending/error는 인스턴스별 짧은 상호작용 상태이므로 React 상태를 사용한다. 새로운 앱 전역 UI 상태가 생기면 별도 결정과 격리/복원 검증이 필요하다.

## 실제 연결에서 지켜야 할 경계

- 서버 데이터: 기존 TanStack Query 조회·무효화 경로를 유지한다. 로그인 옵션을 별도 공유 스토어에 중복 복제하지 않는다.
- 업무 입력: 기존 TanStack Form 기반 자격 증명·초대·동의 폼을 유지한다. 버튼만 있는 소셜 로그인에 형식적인 폼 라이브러리를 추가하지 않는다.
- qoqo: QoqoProviders가 QueryClient/UI store/선호 store를 인스턴스별 생성한다. 로그아웃·계정 전환 시 비공개 쿼리 취소/폐기와 authEpoch 갱신을 유지한다. 선택 scope는 actor 및 실제 업무 범위를 포함한다.
- JN: 요청별 BFF 인증으로 반환한 계정/권한 범위를 기존 query authority에 전달한다. 로그인/로그아웃/연결/조직 전환 시 기존 private query 폐기를 보존한다. 암호화 DB 세션이나 불투명 쿠키를 브라우저 공유 상태에 넣지 않는다.
- 발송·초대·계정 연결: 자동 재시도나 낙관적 완료를 추가하지 않는다. 기존 UUID/CAS/원장/결과 불명 복구를 유지하고, 공통 패키지의 requestId는 공급자 멱등성 보장을 뜻하지 않는다.
- 네이버 프로필의 연락 이메일은 이메일 소유 증명이 아니다. 각 앱의 검증 연락처/초대/동일 계정 연결 규칙을 그대로 적용한다.

## 출처와 적용 범위

- [Zustand Next.js](https://zustand.docs.pmnd.rs/learn/guides/nextjs.html), [persist](https://zustand.docs.pmnd.rs/reference/middlewares/persist), [공식 devtools 소스 문서](https://github.com/pmndrs/zustand/blob/main/docs/middlewares/devtools.md)
- [TanStack Store 공식 상태/범위](https://tanstack.com/store/latest), [개요](https://tanstack.com/store/latest/docs/overview), [Query SSR](https://tanstack.com/query/latest/docs/framework/react/guides/ssr)
- qoqo: `apps/web/src/query/QoqoProviders.tsx`, `state/ui-store.ts`, `state/social-preferences.ts`, `query/client.ts`; 기존 `docs/STATE-STACK-MIGRATION-2026-11-02.md`와 로그인 UI 기록을 우선한다.
- JN: `src/components/query-client.tsx`, `service-account.tsx`, `src/domain/query-policy.ts`.

이는 구현 경계 결정이다. 실제 앱 변경·검증·운영 적용 여부는 [작업 진행 기록](superpowers/plans/2026-11-04-shared-notify-auth-progress.md)에서 구분한다.
