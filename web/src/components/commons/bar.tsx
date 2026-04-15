import { clsx } from "clsx";
import styles from "@/styles/components/commons/bar.module.css";
import { cva, type VariantProps } from "class-variance-authority";
import type { JSX } from "preact";

const barVariants = cva(styles.bar, {
  variants: {
    variantColor: {
      blue: styles.colorBlue,
      green: styles.colorGreen,
      gold: styles.colorGold,
    },
    variantThickness: {
      thin: styles.thicknessThin,
      medium: styles.thicknessMedium,
      thick: styles.thicknessThick,
    },
  },
  defaultVariants: {
    variantColor: "blue",
    variantThickness: "thin",
  },
});

export type BarProps = JSX.IntrinsicElements["div"] & {
  variantColor?: VariantProps<typeof barVariants>["variantColor"];
  variantThickness?: VariantProps<typeof barVariants>["variantThickness"];
};

export function Bar({
  className,
  variantColor,
  variantThickness,
  ...props
}: BarProps) {
  const baseClass = barVariants({
    variantColor,
    variantThickness,
  });

  return <div className={clsx(baseClass, className)} {...props} />;
}
