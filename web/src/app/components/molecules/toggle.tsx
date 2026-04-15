import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import { PressedButton, type PressedButtonProps } from "../atoms/button";
import styles from "@styles/components/molecules/toggle.module.css";

const toggleVariants = cva(styles.toggle, {
  variants: {
    variantColor: {
      blue: styles.colorBlue,
      red: styles.colorRed,
      gold: styles.colorGold,
    },
  },
  defaultVariants: {
    variantColor: "blue",
  },
});

export type ToggleProps = PressedButtonProps & {
  variantColor?: VariantProps<typeof toggleVariants>["variantColor"];
};

export function Toggle({
  isPressed = false,
  variantColor,
  className,
  type = "button",
  ...props
}: ToggleProps) {
  const baseClass = toggleVariants({ variantColor });

  return (
    <PressedButton
      type={type}
      isPressed={isPressed}
      className={clsx(baseClass, className)}
      {...props}
    />
  );
}
