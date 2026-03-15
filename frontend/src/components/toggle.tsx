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
      true: styles.isActive,
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
  active: boolean;
  color?: "blue" | "red" | "gold";
  onClick: () => void;
  className?: string;
  type?: "button" | "submit" | "reset";
}

export function Toggle({
  children,
  active,
  color = "blue",
  onClick,
  className,
  type = "button",
}: ToggleProps) {
  return (
    <button
      type={type}
      className={clsx(
        toggleVariants({ variantColor: color, variantActive: active }),
        className,
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
