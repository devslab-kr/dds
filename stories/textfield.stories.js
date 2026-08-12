const field = ({ id, label, value = "", placeholder = "", help, error = false, disabled = false }) => `
  <div class="dds-field${error ? " dds-field--error" : ""}" style="max-width:320px">
    <label class="dds-field__label" for="${id}">${label}</label>
    <input class="dds-input" id="${id}" type="text"
      ${value ? `value="${value}"` : ""} ${placeholder ? `placeholder="${placeholder}"` : ""}
      ${error ? `aria-invalid="true" aria-describedby="${id}-help"` : ""} ${disabled ? "disabled" : ""}>
    ${help ? `<span class="dds-field__help" id="${id}-help">${help}</span>` : ""}
  </div>`;

export default {
  title: "Components/TextField",
};

export const Default = {
  render: () => field({ id: "tf1", label: "회사 이름", placeholder: "데브스랩", help: "방문자에게 표시되는 이름입니다." }),
};

export const Error = {
  render: () => field({ id: "tf2", label: "이메일", value: "hello@devslab", help: "이메일 형식이 아닙니다. 예: hello@devslab.kr", error: true }),
};

export const Disabled = {
  render: () => field({ id: "tf3", label: "사업자 번호", value: "000-00-00000", help: "가입 후에는 바꿀 수 없습니다.", disabled: true }),
};

export const AllStates = {
  render: () => `
    <div style="display:grid; gap:var(--dds-space-16)">
      ${field({ id: "tfa", label: "회사 이름", placeholder: "데브스랩", help: "방문자에게 표시되는 이름입니다." })}
      ${field({ id: "tfb", label: "이메일", value: "hello@devslab", help: "이메일 형식이 아닙니다.", error: true })}
      ${field({ id: "tfc", label: "사업자 번호", value: "000-00-00000", help: "가입 후에는 바꿀 수 없습니다.", disabled: true })}
    </div>`,
};
