import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import {
  PressedButton,
  type PressedButtonProps,
} from "@/components/commons/button";
import styles from "@/styles/components/commons/toggle.module.css";

const toggleVariants = cva(styles.toggle, {
  variants: {
    variantColor: {
      blue: styles.colorBlue,
      red: styles.colorRed,
      gold: styles.colorGold,
    },
    variantPressed: {
      true: styles.pressedTrue,
      false: "",
    },
  },
  defaultVariants: {
    variantColor: "blue",
    variantPressed: false,
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
  const baseClass = toggleVariants({
    variantColor,
    variantPressed: isPressed,
  });

  return (
    <PressedButton
      type={type}
      isPressed={isPressed}
      className={clsx(baseClass, className)}
      {...props}
    />
  );
}
