import { directionPolicy, icons, type DdsIconName } from "@devslab-kr/dds-icons";
import { splitProps, type JSX } from "solid-js";

import { classes } from "./utils";

export interface IconProps extends Omit<JSX.SvgSVGAttributes<SVGSVGElement>, "name" | "children"> {
  name: DdsIconName;
  label?: string;
  size?: number | string;
  directional?: boolean;
}

export function Icon(props: IconProps) {
  const [local, rest] = splitProps(props, ["name", "label", "size", "directional", "class"]);
  const icon = () => icons[local.name];
  const directional = () => local.directional ?? directionPolicy.mirrorInRtl.includes(local.name);
  return (
    <svg
      {...rest}
      class={classes(directional() && directionPolicy.cssClass, local.class)}
      viewBox={icon().viewBox}
      width={local.size ?? 24}
      height={local.size ?? 24}
      fill="none"
      stroke="currentColor"
      stroke-width={icon().strokeWidth}
      stroke-linecap="round"
      stroke-linejoin="round"
      role={local.label ? "img" : undefined}
      aria-label={local.label}
      aria-hidden={local.label ? undefined : "true"}
    >
      {local.label && <title>{local.label}</title>}
      <g innerHTML={icon().body} />
    </svg>
  );
}
