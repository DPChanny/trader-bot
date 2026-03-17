import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import styles from "@/styles/components/toggle.module.css";

const toggleVariants = cva(styles.toggle, {
  variants: {
    variantColor: {
      blue: styles.colorBlue,
      red: styles.colorRed,
      gold: styles.colorGold,
    },
    variantActive: {
      true: styles.activeTrue,
      false: "",
    },
  },
  defaultVariants: {
    variantColor: "blue",
    variantActive: false,
  },
});

interface ToggleProps extends VariantProps<typeof toggleVariants> {
  children?: string;
  isActive: boolean;
  variantColor?: "blue" | "red" | "gold";
  onClick: () => void;
  className?: string;
  type?: "button" | "submit" | "reset";
}

export function Toggle({
  children,
  isActive,
  variantColor = "blue",
  onClick,
  className,
  type = "button",
}: ToggleProps) {
  return (
    <button
      type={type}
      className={clsx(
        toggleVariants({ variantColor, variantActive: isActive }),
        className,
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
