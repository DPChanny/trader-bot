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
    variantTone: {
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
    variantTone: "solid",
    variantSize: "medium",
  },
});

export type BadgeProps = {
  children?: string;
  src?: string;
  alt?: string;
  className?: string;
  variantColor?: VariantProps<typeof badgeVariants>["variantColor"];
  variantTone?: VariantProps<typeof badgeVariants>["variantTone"];
  variantSize?: VariantProps<typeof badgeVariants>["variantSize"];
};

export function Badge({
  children,
  src,
  alt,
  className,
  variantColor,
  variantTone,
  variantSize,
}: BadgeProps) {
  const baseClass = badgeVariants({
    variantColor,
    variantTone,
    variantSize,
  });

  return (
    <span className={clsx(baseClass, className)}>
      {src ? (
        <img
          src={src}
          alt={alt ?? "icon"}
          style={{
            width: "80%",
            height: "80%",
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : (
        children
      )}
    </span>
  );
}
