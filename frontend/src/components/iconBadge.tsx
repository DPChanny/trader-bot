import { clsx } from "clsx";
import styles from "@/styles/components/badge.module.css";
import { cva, type VariantProps } from "class-variance-authority";

const iconBadgeVariants = cva(styles.badge, {
  variants: {
    color: {
      blue: styles.colorBlue,
      red: styles.colorRed,
      gold: styles.colorGold,
      green: styles.colorGreen,
      gray: styles.colorGray,
    },
    size: {
      sm: styles.sizeSm,
      md: styles.sizeMd,
      lg: styles.sizeLg,
    },
    variant: {
      solid: "",
      outline: styles.variantOutline,
    },
  },
  defaultVariants: {
    color: "blue",
    size: "md",
    variant: "solid",
  },
});

export type IconBadgeProps = {
  src?: string | null;
  alt?: string;
  className?: string;
  variantColor?: VariantProps<typeof iconBadgeVariants>["color"];
  variantSize?: VariantProps<typeof iconBadgeVariants>["size"];
  variantVariant?: VariantProps<typeof iconBadgeVariants>["variant"];
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
    color: variantColor,
    size: variantSize,
    variant: variantVariant,
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
