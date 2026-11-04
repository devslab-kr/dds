import {
  EmailTemplateError,
  renderEmail,
  type RenderEmailInput,
  type RenderedEmail,
} from "@devslab-kr/dds-email-template";
import { input } from "./input.mjs";

export const configured: RenderEmailInput = input;
export const rendered: RenderedEmail = renderEmail(configured);
export const validationError: TypeError = new EmailTemplateError(
  "content.action.url",
  "origin must be allowed",
);

const invalidVerification: NonNullable<
  RenderEmailInput["content"]["verification"]
> = {
  code: "00000000",
  // @ts-expect-error The public API accepts explicit six- or eight-digit codes.
  digits: 7,
  instruction: "Sample only",
};
void invalidVerification;
