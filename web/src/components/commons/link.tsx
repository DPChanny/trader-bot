import { clsx } from "clsx";
import { cva, type VariantProps } from "class-variance-authority";
import styles from "@/styles/components/commons/link.module.css";
import type { ComponentChildren, JSX } from "preact";

const linkVariants = cva(styles.link, {
  variants: {
    variantStyle: {
      inline: "",
      plain: styles.stylePlain,
    },
    variantDisplay: {
      inline: "",
      block: styles.displayBlock,
    },
  },
  defaultVariants: {
    variantStyle: "inline",
    variantDisplay: "inline",
  },
});

export type LinkProps = JSX.IntrinsicElements["a"] & {
  children?: ComponentChildren;
  variantStyle?: VariantProps<typeof linkVariants>["variantStyle"];
  variantDisplay?: VariantProps<typeof linkVariants>["variantDisplay"];
};

export function Link({
  children,
  className,
  variantStyle,
  variantDisplay,
  ...props
}: LinkProps) {
  const baseClass = linkVariants({ variantStyle, variantDisplay });

  return (
    <a className={clsx(baseClass, className)} {...props}>
      {children}
    </a>
  );
}
