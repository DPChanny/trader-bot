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
    pressed: {
      true: styles.activeTrue,
      false: "",
    },
  },
  defaultVariants: {
    variantColor: "blue",
    pressed: false,
  },
});

export type ToggleProps = Omit<PressedButtonProps, "isPressed"> & {
  variantColor?: VariantProps<typeof toggleVariants>["variantColor"];
  isActive?: boolean;
};

export function Toggle({
  isActive = false,
  variantColor = "blue",
  className,
  type = "button",
  ...props
}: ToggleProps) {
  return (
    <PressedButton
      type={type}
      isPressed={isActive}
      className={clsx(
        toggleVariants({ variantColor, pressed: isActive }),
        className,
      )}
      {...props}
    />
  );
}
