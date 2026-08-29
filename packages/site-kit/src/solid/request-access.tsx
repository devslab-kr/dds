import { Button, Field } from "@devslab-kr/dds-solid";
import { createSignal } from "solid-js";

export interface RequestAccessMessages {
  nameLabel: string;
  emailLabel: string;
  organizationLabel: string;
  useCaseLabel: string;
  submit: string;
  submitting: string;
  success: string;
  error: string;
}

export interface RequestAccessFormProps {
  messages: RequestAccessMessages;
  onSubmit: (data: FormData) => void | Promise<void>;
  class?: string;
}

export function RequestAccessForm(props: RequestAccessFormProps) {
  const [state, setState] = createSignal<"idle" | "submitting" | "success" | "error">("idle");
  const submit = async (event: SubmitEvent) => {
    event.preventDefault();
    if (state() === "submitting") return;
    setState("submitting");
    try {
      await props.onSubmit(new FormData(event.currentTarget as HTMLFormElement));
      setState("success");
    } catch {
      setState("error");
    }
  };
  return (
    <form class={`site-request-form${props.class ? ` ${props.class}` : ""}`} onSubmit={submit}>
      <Field label={props.messages.nameLabel} required>{(control) => <input {...control} class="dds-input" name="name" autocomplete="name" required />}</Field>
      <Field label={props.messages.emailLabel} required>{(control) => <input {...control} class="dds-input" type="email" name="email" autocomplete="email" required />}</Field>
      <Field label={props.messages.organizationLabel}>{(control) => <input {...control} class="dds-input" name="organization" autocomplete="organization" />}</Field>
      <Field label={props.messages.useCaseLabel}>{(control) => <textarea {...control} class="dds-textarea" name="useCase" rows="5" />}</Field>
      <Button type="submit" loading={state() === "submitting"}>{state() === "submitting" ? props.messages.submitting : props.messages.submit}</Button>
      <div aria-live="polite" aria-atomic="true">{state() === "success" ? props.messages.success : state() === "error" ? props.messages.error : ""}</div>
    </form>
  );
}
