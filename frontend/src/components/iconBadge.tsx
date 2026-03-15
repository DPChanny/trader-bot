import { clsx } from "clsx";
import styles from "@/styles/components/badge.module.css";
import { cva, type VariantProps } from "class-variance-authority";

const iconBadgeVariants = cva(styles.badge, {
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
    variantVariant: {
      solid: "",
      outline: styles.variantOutline,
    },
  },
  defaultVariants: {
    variantColor: "blue",
    variantSize: "medium",
    variantVariant: "solid",
  },
});

export type IconBadgeProps = {
  src?: string | null;
  alt?: string;
  className?: string;
  variantColor?: VariantProps<typeof iconBadgeVariants>["variantColor"];
  variantSize?: VariantProps<typeof iconBadgeVariants>["variantSize"];
  variantVariant?: VariantProps<typeof iconBadgeVariants>["variantVariant"];
};

export function IconBadge({
  src,
  alt,
  className,
  variantColor,
  variantSize,
  variantVariant,
}: IconBadgeProps) {
  const baseClass = iconBadgeVariants({
    variantColor,
    variantSize,
    variantVariant,
  });

  return (
    <span className={clsx(baseClass, className)}>
      {src ? (
        <img
          src={src}
          alt={alt || "icon"}
          style={{
            width: "80%",
            height: "80%",
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : null}
    </span>
  );
}
