/**
 * Static renderer examples only. No send, Auth integration or production save.
 * Every code, identity, address, action URL and displayed date below is fictional.
 * The all-zero codes are conspicuous sample text, never issued credentials.
 *
 * Brand provenance (read-only source audit, 2026-11-04):
 * - JN: virtus-settlement/supabase/templates/{confirmation,recovery,email-change,
 *   magic-link}.html and README.md. The two code templates were local previews,
 *   not saved to production. Current JN email OTP is eight digits; phone OTP is
 *   a separate six-digit policy. No Auth expiry is inferred by these examples.
 * - qoqo: qoqo/apps/ai-worker/src/email-templates.ts and its existing tests.
 *   Approved PNG is 368x136 intrinsically and displayed at 184x68, with live
 *   Korean brand text. qoqo invitation-email codes are exactly six digits.
 *
 * Consumer canonical URL validation, expiry formatting and authority checks stay
 * in the service. The example.invalid allowlist is for static samples only.
 */

const JN_BRAND = {
  name: "정산나우",
  align: "left",
  logo: {
    url: "https://jeongsan.now/brand/jeongsan-symbol.png",
    width: 32,
    height: 32,
    alt: "JN",
  },
  colors: {
    primary: "#06b6d4",
    onPrimary: "#083344",
    heading: "#18181b",
    text: "#52525b",
    muted: "#71717a",
    background: "#f5f6f8",
    surface: "#ffffff",
    border: "#e4e4e7",
  },
};

const QOQO_BRAND = {
  name: "코코",
  align: "center",
  logo: {
    url: "https://img.qoqo.menu/brand/qoqo-email-24e7d7f70eadae7fb50f93f860c63ef47a33c7fb147512b85280f2a984b740e4.png",
    width: 184,
    height: 68,
    alt: "qoqo",
  },
  colors: {
    primary: "#2755e9",
    onPrimary: "#ffffff",
    heading: "#181d2a",
    text: "#424c5c",
    muted: "#596273",
    background: "#f7f9fc",
    surface: "#ffffff",
    border: "#e3e7ef",
  },
};

const JN_POLICY = {
  allowedActionOrigins: ["https://example.invalid"],
  allowedAssetOrigins: ["https://jeongsan.now"],
};
const QOQO_POLICY = {
  allowedActionOrigins: ["https://example.invalid"],
  allowedAssetOrigins: ["https://img.qoqo.menu"],
};
const SAMPLE_NOTICE =
  "정적 미리보기 전용입니다. 인증번호·이름·주소·날짜와 작업 링크는 모두 가상 예시입니다.";
const UNREQUESTED = "직접 요청하지 않았다면 이 메일을 무시하셔도 됩니다.";
const JN_AUTHORITY =
  "이메일 확인은 본인 확인 절차입니다. 회사 소속과 업무 권한은 초대·승인에 따라 따로 부여됩니다.";

/** @type {readonly { id: string, label: string, input: import('../src/index.mjs').RenderEmailInput }[]} */
export const fixtures = [
  {
    id: "jn-email-code-8",
    label: "정산나우 · 이메일 인증번호 8자리 · 로컬 원본 참고",
    input: {
      brand: JN_BRAND,
      language: "ko",
      policy: JN_POLICY,
      content: {
        subject: "[미리보기] 정산나우 이메일 인증번호",
        title: "이메일 인증번호를 확인해 주세요",
        preheader: "정산나우에서 요청한 이메일 인증번호입니다.",
        introduction: [
          "정산나우에서 이메일 확인을 요청하셨나요?",
          "인증을 시작한 화면에 아래 번호를 입력해 주세요.",
        ],
        verification: {
          code: "00000000",
          digits: 8,
          instruction: "요청한 화면에 안내된 유효 시간 안에 입력해 주세요.",
        },
        safety: [
          JN_AUTHORITY,
          UNREQUESTED,
          "이 인증번호를 다른 사람에게 알려주지 마세요.",
        ],
        footer: ["정산나우 · jeongsan.now", SAMPLE_NOTICE],
      },
    },
  },
  {
    id: "jn-email-change-8",
    label: "정산나우 · 이메일 주소 변경 8자리 · 로컬 원본 참고",
    input: {
      brand: JN_BRAND,
      language: "ko",
      policy: JN_POLICY,
      content: {
        subject: "[미리보기] 정산나우 이메일 주소 변경 확인",
        title: "이메일 주소 변경을 확인해 주세요",
        preheader: "요청한 이메일 주소를 인증번호로 확인해 주세요.",
        introduction: [
          "인증을 시작한 정산나우 화면에 아래 번호를 입력해 주세요.",
        ],
        details: [
          {
            label: "변경할 주소 (가상)",
            value: "sample-new-address@example.invalid",
          },
        ],
        verification: {
          code: "00000000",
          digits: 8,
          instruction: "요청한 화면에 안내된 유효 시간 안에 입력해 주세요.",
        },
        safety: [
          "이메일 주소 변경을 직접 요청한 경우에만 입력해 주세요.",
          "이 인증번호를 다른 사람에게 알려주지 마세요.",
          UNREQUESTED,
        ],
        footer: ["정산나우 · jeongsan.now", SAMPLE_NOTICE],
      },
    },
  },
  {
    id: "jn-confirmation-action",
    label: "정산나우 · 이메일 확인 버튼 · 정적 미리보기",
    input: {
      brand: JN_BRAND,
      language: "ko",
      policy: JN_POLICY,
      content: {
        subject: "[미리보기] 정산나우 이메일 인증",
        title: "이메일 주소를 확인해 주세요",
        preheader: "이메일을 인증하고 정산나우 회원가입을 계속하세요.",
        introduction: [
          "정산나우에 오신 것을 환영합니다.",
          "아래 버튼으로 이메일을 인증하면 회원가입을 계속할 수 있습니다.",
        ],
        action: {
          label: "이메일 인증하기",
          url: "https://example.invalid/jn/email-confirmation-preview",
        },
        // Existing JN PKCE policy from the link-template source, not a library
        // default or a claim about the separate eight-digit email-code lifetime.
        safety: [
          "메일을 요청한 브라우저에서 10분 안에 열어 주세요.",
          JN_AUTHORITY,
          UNREQUESTED,
        ],
        footer: ["정산나우 · jeongsan.now", SAMPLE_NOTICE],
      },
    },
  },
  {
    id: "qoqo-invitation-action",
    label: "코코 · 회사·매장·권한·기한 안내와 초대 버튼",
    input: {
      brand: QOQO_BRAND,
      language: "ko",
      policy: QOQO_POLICY,
      content: {
        subject: "[미리보기] [코코] 예시 매장 매니저 초대",
        title: "매장 초대가 도착했습니다",
        introduction: [
          "아래 초대 정보를 확인하고 가입·로그인한 뒤 매장에 연결해 주세요.",
        ],
        details: [
          { label: "회사", value: "예시 회사 (가상)" },
          { label: "매장", value: "예시 매장 (가상)" },
          { label: "권한", value: "매니저" },
          {
            label: "초대 기한 (가상)",
            value: "2099년 11월 04일 18:00:00 (한국시간 KST)",
          },
        ],
        action: {
          label: "초대 확인하고 시작하기",
          url: "https://example.invalid/qoqo/invitation-preview",
        },
        safety: [
          "이 초대는 표시된 회사·매장·권한에만 적용됩니다.",
          "초대한 담당자를 모르신다면 링크를 열지 마세요.",
          "초대 링크를 다른 사람에게 전달하지 마세요.",
        ],
        footer: ["코코 · qoqo.menu", SAMPLE_NOTICE],
      },
    },
  },
  {
    id: "qoqo-invitation-code-6",
    label: "코코 · 초대 이메일 인증번호 6자리",
    input: {
      brand: QOQO_BRAND,
      language: "ko",
      policy: QOQO_POLICY,
      content: {
        subject: "[미리보기] [코코] 초대 이메일 인증번호",
        title: "초대받은 이메일을 확인해 주세요",
        introduction: ["코코 가입 화면에 아래 인증번호를 입력해 주세요."],
        details: [
          {
            label: "인증 기한 (가상)",
            value: "2099년 11월 04일 18:00:00 (한국시간 KST)",
          },
        ],
        verification: {
          code: "000000",
          digits: 6,
          instruction: "인증번호를 요청한 가입 화면에서 계속 진행해 주세요.",
        },
        safety: [
          "직접 요청하지 않으셨다면 이 메일을 무시해 주세요.",
          "인증번호를 다른 사람에게 알려주지 마세요.",
        ],
        footer: ["코코 · qoqo.menu", SAMPLE_NOTICE],
      },
    },
  },
  {
    id: "qoqo-long-content",
    label: "코코 · 긴 한글·영문·특수문자 줄바꿈 검수",
    input: {
      brand: QOQO_BRAND,
      language: "ko",
      policy: QOQO_POLICY,
      content: {
        subject: "[미리보기] [코코] 긴 안내와 특수문자 표시 확인",
        title: "여러 줄로 이어지는 긴 제목과 정확한 안내 내용을 확인해 주세요",
        introduction: [
          "긴 이름과 안내도 생략하지 않고 읽을 수 있는지 확인하는 가상 예시입니다. 작은 화면에서 제목과 본문이 자연스럽게 줄바꿈되어야 합니다.",
          '표시 확인용 문자: <예시> & "가상 회사" — 이 텍스트는 HTML로 실행되지 않고 그대로 보여야 합니다.',
        ],
        details: [
          {
            label: "회사·매장",
            value:
              "아주 긴 가상 회사와 가상 매장의 이름을 끝까지 확인하는 예시 & <Sample>",
          },
          {
            label: "영문 식별자",
            value:
              "SAMPLE_ONLY_NOT_A_CREDENTIAL_LONG_UNBROKEN_DISPLAY_IDENTIFIER_0000000000000000000000000000000000000000",
          },
          {
            label: "표시 안내",
            value:
              "이 행은 수신자 정보나 실제 업무 상태가 없는 줄바꿈 검수용 예시입니다.",
          },
        ],
        action: {
          label: "긴 작업 버튼 이름도 줄바꿈하여 끝까지 확인하기",
          url: "https://example.invalid/qoqo/static-preview/long-path-for-visible-fallback-line-wrapping-only?sample=not-a-token&purpose=layout-review",
        },
        safety: [
          "이 버튼은 가상 예시 주소입니다. 실제 가입·초대나 인증을 진행하지 않습니다.",
        ],
        footer: ["코코 · qoqo.menu", SAMPLE_NOTICE],
      },
    },
  },
  {
    id: "notice-without-logo",
    label: "로고 없는 서비스 안내 · 설정 최소 예시",
    input: {
      brand: { name: "가상 예시 서비스", colors: { primary: "#2755e9" } },
      language: "ko",
      policy: { allowedActionOrigins: [] },
      content: {
        subject: "[미리보기] 가상 예시 서비스 안내",
        title: "안내 내용을 확인해 주세요",
        introduction: ["로고·인증번호·작업 버튼이 없는 정적 안내 예시입니다."],
        footer: [SAMPLE_NOTICE],
      },
    },
  },
];
