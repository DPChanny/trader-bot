import { clsx } from "clsx";
import { cva, type VariantProps } from "class-variance-authority";
import styles from "@styles/components/atoms/link.module.css";
import type { JSX } from "preact";

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

function getVariantContent(children: LinkProps["children"]) {
  if (typeof children === "string" || typeof children === "number") {
    return "text" as const;
  }

  return "div" as const;
}

export function Link({ children, className, ...props }: LinkProps) {
  const baseClass = linkVariants({
    variantContent: getVariantContent(children),
  });

  return (
    <a className={clsx(baseClass, className)} {...props}>
      {children}
    </a>
  );
}
