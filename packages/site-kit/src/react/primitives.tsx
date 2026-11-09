import { directionPolicy, icons, type DdsIconName } from "@devslab/dds-icons";
import type { ButtonHTMLAttributes, SVGProps } from "react";

/**
 * The three DDS controls the chrome needs, drawn as the same markup
 * `@devslab/dds-react` and `@devslab/dds-solid` render — same classes, same
 * attributes — so `@devslab/dds-css` styles them identically.
 *
 * Why not import them from `@devslab/dds-react`: as a dependency it would
 * install React, Ark UI and a virtualizer into every Solid product that uses
 * this package; as a peer, a fixed-group release would turn every dds-react
 * minor into a site-kit major (changesets bumps peer dependents to major).
 * The chrome uses a button, an icon button and an icon, with no behaviour
 * beyond a click — markup, not a dependency. Anything with real behaviour (a
 * dialog with a focus trap) is not copied here; see the ConsentBanner note in
 * index.ts.
 */

const classes = (...values: (string | false | undefined)[]) => values.filter(Boolean).join(" ");

export type ButtonTone = "primary" | "secondary" | "ghost" | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: ButtonTone;
}

export function Button({ tone = "primary", type = "button", className, ...rest }: ButtonProps) {
  return <button {...rest} type={type} className={classes("dds-btn", `dds-btn--${tone}`, className)} />;
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  "aria-label": string;
  tone?: "ghost" | "secondary" | "danger";
}

export function IconButton({ tone = "ghost", type = "button", className, ...rest }: IconButtonProps) {
  return <button {...rest} type={type} className={classes("dds-iconbtn", tone !== "ghost" && `dds-iconbtn--${tone}`, className)} />;
}

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name" | "children"> {
  name: DdsIconName;
  size?: number;
}

export function Icon({ name, size = 24, className, ...rest }: IconProps) {
  const icon = icons[name];
  return (
    <svg
      {...rest}
      viewBox={icon.viewBox}
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={icon.strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={classes(directionPolicy.mirrorInRtl.includes(name) && directionPolicy.cssClass, className) || undefined}
    >
      <g dangerouslySetInnerHTML={{ __html: icon.body }} />
    </svg>
  );
}
