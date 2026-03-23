import { clsx } from "clsx";
import styles from "@/styles/components/bar.module.css";
import { cva, type VariantProps } from "class-variance-authority";

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

export type BarProps = {
  className?: string;
  variantColor?: VariantProps<typeof barVariants>["variantColor"];
  variantThickness?: VariantProps<typeof barVariants>["variantThickness"];
};

export function Bar({ className, variantColor, variantThickness }: BarProps) {
  const baseClass = barVariants({
    variantColor,
    variantThickness,
  });

  return <div className={clsx(baseClass, className)} />;
}
