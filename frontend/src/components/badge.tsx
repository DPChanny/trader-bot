import { clsx } from "clsx";
import styles from "@/styles/components/badge.module.css";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(styles.badge, {
  variants: {
    variantColor: {
      blue: styles.colorBlue,
      red: styles.colorRed,
      gold: styles.colorGold,
      green: styles.colorGreen,
      gray: styles.colorGray,
    },
    variantVariant: {
      solid: "",
      outline: styles.variantOutline,
    },
    variantSize: {
      small: styles.sizeSmall,
      medium: styles.sizeMedium,
      large: styles.sizeLarge,
    },
  },
  defaultVariants: {
    variantColor: "blue",
    variantVariant: "solid",
    variantSize: "medium",
  },
});

export type BadgeProps = {
  children: string;
  className?: string;
  variantColor?: VariantProps<typeof badgeVariants>["variantColor"];
  variantVariant?: VariantProps<typeof badgeVariants>["variantVariant"];
  variantSize?: VariantProps<typeof badgeVariants>["variantSize"];
};

export function Badge({
  children,
  className,
  variantColor,
  variantVariant,
  variantSize,
}: BadgeProps) {
  const baseClass = badgeVariants({
    variantColor,
    variantVariant,
    variantSize,
  });

  return <span className={clsx(baseClass, className)}>{children}</span>;
}
