import { createRef, useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { OtpInput } from "../otp-input";

describe("OtpInput", () => {
  it("focuses one labelled native input and lets the form own submission", async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLInputElement>();
    const submit = vi.fn();
    function Form() {
      const [value, setValue] = useState("");
      return (
        <form onSubmit={event => { event.preventDefault(); submit(); }}>
          <label htmlFor="code">Authenticator code</label>
          <span id="hint">Enter six digits</span>
          <OtpInput id="code" name="otp" aria-describedby="hint" autoFocus required
            ref={ref} value={value} onValueChange={setValue} />
          <button type="submit">Confirm</button>
        </form>
      );
    }
    render(<Form />);
    const input = screen.getByRole("textbox", { name: "Authenticator code" }) as HTMLInputElement;
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(input).toBe(ref.current);
    expect(input).toHaveFocus();
    expect(input).toHaveAccessibleDescription("Enter six digits");
    expect(input).toHaveAttribute("autocomplete", "one-time-code");
    expect(input.inputMode).toBe("numeric");
    expect(input.checkValidity()).toBe(false);
    await user.keyboard("102938");
    expect(new FormData(input.form!).get("otp")).toBe("102938");
    expect(input.checkValidity()).toBe(true);
    expect(submit).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it("completes changed codes once and preserves selection while editing or pasting", async () => {
    const user = userEvent.setup();
    const complete = vi.fn();
    function Field() {
      const [value, setValue] = useState("");
      return <OtpInput aria-label="Code" autoFocus value={value} onValueChange={setValue} onComplete={complete} />;
    }
    render(<Field />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    await user.keyboard("10293");
    expect(complete).not.toHaveBeenCalled();
    await user.keyboard("8");
    expect(complete).toHaveBeenCalledExactlyOnceWith("102938");
    input.select();
    await user.paste("102 938");
    expect(complete).toHaveBeenCalledTimes(1);
    input.setSelectionRange(1, 3);
    await user.paste("4-5");
    expect(input).toHaveValue("145938");
    expect(input.selectionStart).toBe(3);
    expect(complete).toHaveBeenNthCalledWith(2, "145938");
    await user.keyboard("{ArrowRight}{Backspace}");
    expect(input).toHaveValue("14538");
    expect(input.selectionStart).toBe(3);
    expect(complete).toHaveBeenCalledTimes(2);
    await user.keyboard("9");
    expect(complete).toHaveBeenNthCalledWith(3, "145938");
    expect(complete).toHaveBeenCalledTimes(3);
  });

  it("handles autofill and a caller-controlled reset without submitting during render", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const onComplete = vi.fn();
    const props = { "aria-label": "Code", onValueChange, onComplete };
    const view = render(<OtpInput {...props} value="102938" disabled />);
    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
    expect(onComplete).not.toHaveBeenCalled();
    await user.type(input, "8");
    expect(onValueChange).not.toHaveBeenCalled();
    view.rerender(<OtpInput {...props} value="" />);
    expect(input).toHaveValue("");
    expect(onValueChange).not.toHaveBeenCalled();
    fireEvent.input(input, { target: { value: "102938" } });
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith("102938");
    expect(onComplete).toHaveBeenCalledExactlyOnceWith("102938");
    view.rerender(<OtpInput {...props} value="102938" />);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
