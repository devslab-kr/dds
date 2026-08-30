export interface OssProductMarkProps {
  name: string;
  src: string;
  size?: "sm" | "md" | "lg";
  decorative?: boolean;
  class?: string;
}

const MARK_SIZE = { sm: 24, md: 32, lg: 48 } as const;

export function OssProductMark(props: OssProductMarkProps) {
  const size = () => props.size ?? "md";
  const pixels = () => MARK_SIZE[size()];

  return (
    <img
      class={`oss-product-mark oss-product-mark--${size()}${props.class ? ` ${props.class}` : ""}`}
      src={props.src}
      alt={props.decorative ? "" : props.name}
      aria-hidden={props.decorative ? "true" : undefined}
      width={pixels()}
      height={pixels()}
      decoding="async"
    />
  );
}
