export default {
  title: "Components/Form controls",
};

export const Textarea = {
  render: () => `
    <div style="display:grid; gap:var(--dds-space-16); max-width:420px">
      <div class="dds-field">
        <label class="dds-field__label" for="ta1">회사 소개</label>
        <textarea class="dds-textarea" id="ta1" rows="3" aria-describedby="ta1-help">데브스랩은 SaaS 제품을 만드는 1인 개발 스튜디오입니다.</textarea>
        <span class="dds-field__help" id="ta1-help">방문자에게 표시됩니다.</span>
      </div>
      <div class="dds-field dds-field--error">
        <label class="dds-field__label" for="ta2">답변 추가 지시</label>
        <textarea class="dds-textarea" id="ta2" rows="2" aria-invalid="true" aria-describedby="ta2-help">가격은 절대 말하지 마</textarea>
        <span class="dds-field__help" id="ta2-help">지시문은 200자를 넘을 수 없습니다.</span>
      </div>
      <div class="dds-field">
        <label class="dds-field__label" for="ta3">메모</label>
        <textarea class="dds-textarea" id="ta3" rows="2" disabled>편집할 수 없습니다.</textarea>
      </div>
    </div>`,
};

export const Select = {
  render: () => `
    <div style="display:grid; gap:var(--dds-space-16); max-width:320px">
      <div class="dds-field">
        <label class="dds-field__label" for="sel1">기본 언어</label>
        <span class="dds-select">
          <select class="dds-select__input" id="sel1">
            <option>한국어</option><option>English</option><option>日本語</option>
          </select>
        </span>
      </div>
      <div class="dds-field">
        <label class="dds-field__label" for="sel2">알림 주기</label>
        <span class="dds-select">
          <select class="dds-select__input" id="sel2" disabled><option>매일</option></select>
        </span>
        <span class="dds-field__help">disabled</span>
      </div>
    </div>`,
};

export const CheckboxRadio = {
  render: () => {
    setTimeout(() => {
      const el = document.getElementById("cb-ind");
      if (el) el.indeterminate = true;
    });
    return `
    <div style="display:grid; gap:var(--dds-space-12)">
      <label class="dds-check"><input class="dds-check__input" type="checkbox" checked>주간 다이제스트</label>
      <label class="dds-check"><input class="dds-check__input" type="checkbox">즉시 알림</label>
      <label class="dds-check"><input class="dds-check__input" type="checkbox" id="cb-ind">일부 선택 (indeterminate)</label>
      <label class="dds-check"><input class="dds-check__input" type="checkbox" checked disabled>고정됨 (disabled)</label>
      <hr class="dds-divider">
      <label class="dds-check"><input class="dds-check__input" type="radio" name="cad" checked>매일</label>
      <label class="dds-check"><input class="dds-check__input" type="radio" name="cad">매주</label>
      <label class="dds-check"><input class="dds-check__input" type="radio" name="cad" disabled>사용 안 함</label>
    </div>`;
  },
};

export const Switch = {
  render: () => `
    <div style="display:grid; gap:var(--dds-space-12)">
      <label class="dds-switch"><input class="dds-switch__input" type="checkbox" role="switch" checked>문의 알림</label>
      <label class="dds-switch"><input class="dds-switch__input" type="checkbox" role="switch">방문자 이어보기</label>
      <label class="dds-switch"><input class="dds-switch__input" type="checkbox" role="switch" checked disabled>베타 모드 (disabled)</label>
    </div>`,
};
