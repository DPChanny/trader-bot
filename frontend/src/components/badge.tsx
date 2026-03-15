import { clsx } from "clsx";
import styles from "@/styles/components/badge.module.css";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(styles.badge, {
  variants: {
    color: {
      blue: styles.colorBlue,
      red: styles.colorRed,
      gold: styles.colorGold,
      green: styles.colorGreen,
      gray: styles.colorGray,
    },
    variant: {
      solid: "",
      outline: styles.variantOutline,
    },
    size: {
      sm: styles.sizeSm,
      md: styles.sizeMd,
      lg: styles.sizeLg,
    },
  },
  defaultVariants: {
    color: "blue",
    variant: "solid",
    size: "md",
  },
});

export type BadgeProps = {
  children: string;
  className?: string;
  variantColor?: VariantProps<typeof badgeVariants>["color"];
  variantVariant?: VariantProps<typeof badgeVariants>["variant"];
  variantSize?: VariantProps<typeof badgeVariants>["size"];
};

export function Badge({
  children,
  className,
  variantColor,
  variantVariant,
  variantSize,
}: BadgeProps) {
  const baseClass = badgeVariants({
    color: variantColor,
    variant: variantVariant,
    size: variantSize,
  });

  return <span className={clsx(baseClass, className)}>{children}</span>;
}
