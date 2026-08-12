# DDS — DevsLab Design System

🌐 [English](README.md)

데브스랩 제품군 (devslab.kr, Linq 패밀리, 이후의 앱들) 을 위한 디자인 언어 —
웹과 모바일이 공유하는 하나의 토큰·규칙 세트.
구조는 [토스 디자인 시스템 (TDS)](https://tossmini-docs.toss.im/tds-react-native/)
를 참조 모델로 하되 프레임워크 중립적이다: 코어는 토큰 + CSS 이고
React · Vue · Ionic · React Native 는 소비자다.

## 구성

| 경로 | 내용 |
| --- | --- |
| [`docs/design-system.ko.md`](docs/design-system.ko.md) | 규칙 명세 (v0): 원칙, 아키텍처, 파운데이션, 컴포넌트 계약, 거버넌스 |
| [`tokens/`](tokens/) | Phase 0 디자인 토큰 ([W3C 포맷](https://design-tokens.github.io/community-group/format/)): 원시 팔레트, 라이트/다크 시맨틱 매핑, 타이포·간격·라운드·그림자·모션 |
| [`preview/index.html`](preview/index.html) | 파운데이션·컴포넌트 미리보기 (단일 파일, 브라우저에서 바로 열림) |
| [`brand/index.html`](brand/index.html) | 브랜드 아이덴티티 가이드: 로고 규정, Electric Cyan, 모티프, 보이스 & 톤 |

## 브랜드 기준

- **Electric Cyan** `#06B6D4` (hover `#22D3EE`) + **zinc** 뉴트럴 —
  devslab.kr 실제 스타일에서 추출
- 라이트 기본 + 다크 토글, 두 시맨틱 매핑 모두 1급
- Geist / Geist Mono, 한글은 Pretendard → 시스템 고딕 폴백
- cyan 면 위 텍스트는 흰색이 아니라 `zinc.950` (WCAG AA: 2.3:1 vs 약 8:1)

## 로드맵

패키지는 소비자가 생길 때만 만든다 (명세 §8):
`@devslab-kr/dds-tokens` → `dds-css` → `dds-icons` → 모바일 방향에 따라
`dds-native` (RN) 또는 Ionic 테마 매핑.
