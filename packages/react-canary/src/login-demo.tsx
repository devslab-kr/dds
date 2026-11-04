import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { Button } from "@devslab/dds-react";
import { LoginPanel, loginMessagesEn } from "@devslab-kr/dds-auth/react";
import {
  authFailure,
  type SocialAuthClient,
  type SocialAuthErrorCode,
  type SocialProvider,
} from "@devslab-kr/dds-auth";
import "@devslab-kr/dds-auth/styles.css";
import "./login-demo.css";
import googleIcon from "@devslab-kr/dds-auth/assets/google-g.png?url";
import kakaoIcon from "@devslab-kr/dds-auth/assets/kakao-symbol.svg?url";
import naverIcon from "@devslab-kr/dds-auth/assets/naver-symbol.png?url";

const providerIcons = {
  google: <img src={googleIcon} alt="" />,
  kakao: <img src={kakaoIcon} alt="" />,
  naver: <img src={naverIcon} alt="" />,
};

type DemoState = "ready" | "unconfigured" | "loading" | "error";
function Demo() {
  const [state, setState] = useState<DemoState>("ready");
  const [dark, setDark] = useState(false);
  const [english, setEnglish] = useState(false);
  const [long, setLong] = useState(false);
  const [redirect, setRedirect] = useState("");
  const [error, setError] = useState<SocialAuthErrorCode>();
  // Explicit simulation, not provider credentials or a working authentication backend.
  const [client] = useState<SocialAuthClient>(() => ({
    async start(_input, { signal }) {
      const mode =
        document.querySelector<HTMLSelectElement>("#demo-state")!.value;
      if (mode === "loading")
        return new Promise((_resolve, reject) => {
          signal.addEventListener("abort", () => reject(new Error("aborted")), {
            once: true,
          });
        });
      if (mode === "error") return authFailure("unavailable");
      return { status: "redirect", url: "https://auth.example.test/authorize" };
    },
  }));
  const providers = (["google", "kakao", "naver"] as SocialProvider[]).map(
    (id) =>
      state === "unconfigured"
        ? { id, status: "unconfigured" as const, reason: "demo-not-configured" }
        : { id, status: "available" as const },
  );
  return (
    <main data-theme={dark ? "dark" : "light"} className="login-demo">
      <div className="login-demo__controls">
        <h1>DDS 로그인 컴포넌트</h1>
        <p>
          인증 어댑터 시뮬레이션입니다. 실제 계정 로그인과 공급자 연결은
          실행하지 않습니다.
        </p>
        <label htmlFor="demo-state">표시 상태</label>
        <select
          id="demo-state"
          className="dds-input"
          value={state}
          onChange={(event) => {
            setState(event.target.value as DemoState);
            setRedirect("");
            setError(undefined);
          }}
        >
          <option value="ready">시뮬레이션 연결됨</option>
          <option value="unconfigured">설정 누락</option>
          <option value="loading">응답 대기</option>
          <option value="error">연결 오류</option>
        </select>
        <div className="login-demo__actions">
          <Button tone="secondary" onClick={() => setDark(!dark)}>
            테마 변경
          </Button>
          <Button tone="secondary" onClick={() => setEnglish(!english)}>
            언어 변경
          </Button>
          <Button tone="secondary" onClick={() => setLong(!long)}>
            긴 문구
          </Button>
          <Button tone="secondary" onClick={() => setError("flow-expired")}>
            만료 오류
          </Button>
        </div>
        <output aria-label="시뮬레이션 이동 주소">{redirect}</output>
      </div>
      <div className="login-demo__surface" lang={english ? "en" : "ko"}>
        <LoginPanel
          key={state}
          brand="DDS"
          title={
            long
              ? "긴 서비스 이름을 사용하는 업무 서비스에 로그인해 주세요"
              : english
                ? "Sign in to your service"
                : "서비스에 로그인하세요"
          }
          description={
            english
              ? "Choose the account you use for this service."
              : "이 서비스에서 사용하는 계정을 선택해 주세요."
          }
          providers={providers}
          client={client}
          returnTo="/account"
          redirectOrigins={["https://auth.example.test"]}
          providerIcons={providerIcons}
          onRedirect={setRedirect}
          {...(error ? { error } : {})}
          {...(english ? { messages: loginMessagesEn } : {})}
          terms={{
            href: "#terms",
            label: english ? "Terms of service" : "이용약관",
          }}
          privacy={{
            href: "#privacy",
            label: english ? "Privacy policy" : "개인정보 처리방침",
          }}
        />
        <div className="login-demo__legal-text">
          <p id="terms">
            예제 약관 자리입니다. 제품에서는 실제 약관 주소를 연결합니다.
          </p>
          <p id="privacy">예제 개인정보 처리방침 자리입니다.</p>
        </div>
      </div>
    </main>
  );
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Demo />
  </StrictMode>,
);
