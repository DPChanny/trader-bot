import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import { Button, type ButtonProps } from "../atoms/button";
import styles from "@styles/components/molecules/toggle.module.css";

const toggleVariants = cva(styles.toggle, {
  variants: {
    variantColor: {
      green: styles.colorGreen,
      blue: styles.colorBlue,
      red: styles.colorRed,
      gold: styles.colorGold,
    },
  },
  defaultVariants: {
    variantColor: "blue",
  },
});

export type ToggleProps = ButtonProps & {
  variantColor?: VariantProps<typeof toggleVariants>["variantColor"];
};

export function Toggle({
  isPressed = false,
  variantColor,
  className,
  ...props
}: ToggleProps) {
  const baseClass = toggleVariants({ variantColor });

  return (
    <Button
      variantTone="ghost"
      isPressed={isPressed}
      className={clsx(baseClass, className)}
      {...props}
    />
  );
}
