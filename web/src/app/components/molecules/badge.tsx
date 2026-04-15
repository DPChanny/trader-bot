import { clsx } from "clsx";
import styles from "@styles/components/molecules/badge.module.css";
import { cva, type VariantProps } from "class-variance-authority";
import type { JSX } from "preact";
import { Image } from "@components/atoms/image";

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

export type BadgeProps = JSX.IntrinsicElements["span"] & {
  src?: string;
  alt?: string;
  variantColor?: VariantProps<typeof badgeVariants>["variantColor"];
  variantSize?: VariantProps<typeof badgeVariants>["variantSize"];
};

export function Badge({
  children,
  src,
  alt,
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
      {src ? (
        <Image src={src} alt={alt ?? "icon"} variantSize="auto" />
      ) : (
        children
      )}
    </span>
  );
}
