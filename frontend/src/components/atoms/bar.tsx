import { clsx } from "clsx";
import styles from "@styles/components/atoms/bar.module.css";
import { cva, type VariantProps } from "class-variance-authority";
import type { JSX } from "react";

const barVariants = cva(styles.bar, {
  variants: {
    variantColor: {
      blue: styles.colorBlue,
      green: styles.colorGreen,
      gold: styles.colorGold,
    },
    variantSize: {
      small: styles.sizeSmall,
      medium: styles.sizeMedium,
      large: styles.sizeLarge,
    },
  },
  defaultVariants: {
    variantColor: "blue",
    variantSize: "small",
  },
});

export type BarProps = JSX.IntrinsicElements["div"] & {
  variantColor?: VariantProps<typeof barVariants>["variantColor"];
  variantSize?: VariantProps<typeof barVariants>["variantSize"];
};

export function Bar({
  className,
  variantColor,
  variantSize,
  ...props
}: BarProps) {
  const baseClass = barVariants({
    variantColor,
    variantSize,
  });

  return <div className={clsx(baseClass, className)} {...props} />;
}
