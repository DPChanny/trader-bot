import { clsx } from "clsx";
import styles from "@styles/components/atoms/select.module.css";
import { cva, type VariantProps } from "class-variance-authority";
import type { JSX } from "react";

const selectVariants = cva(styles.select, {
  variants: {
    variantSize: {
      small: styles.sizeSmall,
      medium: styles.sizeMedium,
      large: styles.sizeLarge,
    },
  },
  defaultVariants: {
    variantSize: "medium",
  },
});

export type SelectProps = JSX.IntrinsicElements["select"] & {
  variantSize?: VariantProps<typeof selectVariants>["variantSize"];
};

export function Select({ className, variantSize, ...props }: SelectProps) {
  const baseClass = selectVariants({ variantSize });
  return <select className={clsx(baseClass, className)} {...props} />;
}
