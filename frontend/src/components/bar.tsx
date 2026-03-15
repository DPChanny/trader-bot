import { clsx } from "clsx";
import styles from "@/styles/components/bar.module.css";
import { cva, type VariantProps } from "class-variance-authority";

const barVariants = cva(styles.bar, {
  variants: {
    color: {
      blue: styles.colorBlue,
      purple: styles.colorPurple,
      red: styles.colorRed,
      green: styles.colorGreen,
    },
    thickness: {
      thin: styles.thicknessThin,
      medium: styles.thicknessMedium,
      thick: styles.thicknessThick,
    },
  },
  defaultVariants: {
    color: "blue",
    thickness: "thin",
  },
});

export type BarProps = {
  className?: string;
  variantColor?: VariantProps<typeof barVariants>["color"];
  variantThickness?: VariantProps<typeof barVariants>["thickness"];
};

export function Bar({ className, variantColor, variantThickness }: BarProps) {
  const baseClass = barVariants({
    color: variantColor,
    thickness: variantThickness,
  });

  return <div className={clsx(baseClass, className)} />;
}
