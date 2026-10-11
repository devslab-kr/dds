import { forwardRef, type SVGProps } from "react";
import { icons, directionPolicy, type DdsIconName } from "@devslab/dds-icons";
import { classes } from "./controls";
export interface IconProps
  extends Omit<SVGProps<SVGSVGElement>, "name" | "children"> {
  name: DdsIconName;
  label?: string;
  size?: number | string;
  directional?: boolean;
}
export const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon(
  { name, label, size = 24, directional, className, ...rest },
  ref
) {
  const icon = icons[name];
  return (
    <svg
      {...rest}
      ref={ref}
      viewBox={icon.viewBox}
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={icon.strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={classes(
        (directional ?? directionPolicy.mirrorInRtl.includes(name)) &&
          directionPolicy.cssClass,
        className
      )}
    >
      {label && <title>{label}</title>}
      <g dangerouslySetInnerHTML={{ __html: icon.body }} />
    </svg>
  );
});
