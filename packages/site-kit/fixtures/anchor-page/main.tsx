/* The page tests/browser/site-kit.spec.ts opens at a #fragment: the real
   MarketingShell from dist/ (sticky SiteHeader, flag locale menu, theme
   toggle, actions, SiteFooter) around a legal-style body long enough to
   scroll, with plain id'd headings — the shape a privacy page's
   "#analytics" link lands on. A SectionBlock sits after them so the test
   can check sections keep their own offset. */
import { render } from "solid-js/web";
import { MarketingShell, SectionBlock } from "@devslab/site-kit/solid";

const messages = {
  navigationLabel: "주 메뉴", localeLabel: "언어", themeLabel: "테마", themeSystem: "시스템", themeLight: "라이트",
  themeDark: "다크", menuOpen: "메뉴 열기", menuClose: "메뉴 닫기", footerLabel: "푸터", skipToContent: "본문으로 건너뛰기",
  updatedLabel: "시행일", notFoundTitle: "없음", notFoundDescription: "없음", backHome: "홈",
  errorTitle: "오류", errorDescription: "다시 시도", retry: "다시 시도",
};
const filler = (count: number) => Array.from({ length: count }, (_, index) => <p>문단 {index + 1}. 개인정보 처리 목적과 항목, 보유 기간을 설명하는 본문입니다.</p>);

render(() => <MarketingShell
  messages={messages}
  header={{
    brand: { name: "TraceLinq", href: "/ko" },
    navigation: [{ href: "/ko#how", label: "작동 방식" }, { href: "/ko#pricing", label: "가격" }, { href: "/ko/docs", label: "문서" }],
    locale: { locale: "ko", hrefForLocale: (code) => `/${code}/privacy` },
    localeVariant: "flag",
    messages,
    theme: { defaultValue: "system" },
    get actions() { return <a class="dds-btn dds-btn--primary" href="/ko/access">이용 신청</a>; },
  }}
  footer={{ brand: { name: "TraceLinq", href: "/ko" }, links: [{ href: "/ko/privacy", label: "개인정보처리방침", emphasis: true }], copyright: "© DevsLab", messages }}
>
  <article class="site-legal">
    <h1>개인정보처리방침</h1>
    <p><a href="#retention">보유 기간으로</a></p>
    {filler(12)}
    <h2 id="analytics">3. 분석 도구(Google Analytics)</h2>
    {filler(12)}
    <h2 id="retention">6. 보유 기간</h2>
    {filler(30)}
  </article>
  <SectionBlock id="faq" labelledBy="faq-title"><h2 id="faq-title">자주 묻는 질문</h2><p>답변</p></SectionBlock>
  {filler(30)}
</MarketingShell>, document.body);
