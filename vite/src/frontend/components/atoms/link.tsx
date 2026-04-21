import { clsx } from "clsx";
import { cva, type VariantProps } from "class-variance-authority";
import styles from "@styles/components/atoms/link.module.css";
import type { JSX } from "preact";
import { route } from "preact-router";

const linkVariants = cva(styles.link, {
  variants: {
    variantContent: {
      text: styles.contentText,
      div: "",
    },
  },
  defaultVariants: {
    variantContent: "text",
  },
});

export type LinkProps = JSX.IntrinsicElements["a"] & {
  variantContent?: VariantProps<typeof linkVariants>["variantContent"];
};

function isInternalHref(href: string): boolean {
  if (href.startsWith("/")) {
    return !href.startsWith("//");
  }

  try {
    const url = new URL(href, window.location.origin);
    return url.origin === window.location.origin;
  } catch {
    return false;
  }
}

function getVariantContent(children: LinkProps["children"]) {
  if (typeof children === "string" || typeof children === "number") {
    return "text" as const;
  }

  return "div" as const;
}

export function Link({ children, className, ...props }: LinkProps) {
  const handleClick: NonNullable<LinkProps["onClick"]> = (e) => {
    props.onClick?.(e);
    if (e.defaultPrevented) return;

    if (e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (props.download) return;
    if (props.target && props.target !== "_self") return;

    const href = props.href;
    if (typeof href !== "string" || !isInternalHref(href)) return;

    e.preventDefault();
    route(href);
  };

  const baseClass = linkVariants({
    variantContent: getVariantContent(children),
  });

  return (
    <a className={clsx(baseClass, className)} {...props} onClick={handleClick}>
      {children}
    </a>
  );
}
