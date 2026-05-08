import { clsx } from "clsx";
import styles from "@styles/components/atoms/badge.module.css";
import { cva, type VariantProps } from "class-variance-authority";
import type { JSX } from "react";

const badgeVariants = cva(styles.badge, {
  variants: {
    variantColor: {
      blue: styles.colorBlue,
      red: styles.colorRed,
      gold: styles.colorGold,
      green: styles.colorGreen,
      gray: styles.colorGray,
    },
    variantSize: {
      small: styles.sizeSmall,
      medium: styles.sizeMedium,
      large: styles.sizeLarge,
    },
  },
  defaultVariants: {
    variantColor: "blue",
    variantSize: "medium",
  },
});

export type BadgeProps = Omit<JSX.IntrinsicElements["span"], "children"> & {
  children: string;
  variantColor?: VariantProps<typeof badgeVariants>["variantColor"];
  variantSize?: VariantProps<typeof badgeVariants>["variantSize"];
};

export function Badge({
  children,
  className,
  variantColor,
  variantSize,
  ...props
}: BadgeProps) {
  const baseClass = badgeVariants({
    variantColor,
    variantSize,
  });

  return (
    <span className={clsx(baseClass, className)} {...props}>
      {children.charAt(0)}
    </span>
  );
}
