import { clsx } from "clsx";
import { cva, type VariantProps } from "class-variance-authority";
import styles from "@/styles/components/atoms/link.module.css";
import type { ComponentChildren, JSX } from "preact";

const linkVariants = cva(styles.link, {
  variants: {
    variantContent: {
      text: "",
      div: styles.contentDiv,
    },
  },
  defaultVariants: {
    variantContent: "text",
  },
});

export type LinkProps = JSX.IntrinsicElements["a"] & {
  children?: ComponentChildren;
  variantContent?: VariantProps<typeof linkVariants>["variantContent"];
};

export function Link({
  children,
  className,
  variantContent,
  ...props
}: LinkProps) {
  const baseClass = linkVariants({ variantContent });

  return (
    <a className={clsx(baseClass, className)} {...props}>
      {children}
    </a>
  );
}
