import { clsx } from "clsx";
import styles from "@/styles/components/input.module.css";
import { cva, type VariantProps } from "class-variance-authority";

const inputVariants = cva(styles.input, {
  variants: {
    variantIntent: {
      default: styles.intentDefault,
      error: styles.intentError,
    },
    variantTone: {
      solid: styles.toneSolid,
      outline: styles.toneOutline,
      ghost: styles.toneGhost,
    },
    variantSize: {
      small: styles.sizeSmall,
      medium: styles.sizeMedium,
      large: styles.sizeLarge,
    },
  },
  defaultVariants: {
    variantIntent: "default",
    variantTone: "solid",
    variantSize: "medium",
  },
});

export type InputProps = {
  value: string;
  onChange: (value: string) => void;
  onKeyPress?: (e: KeyboardEvent) => void;
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  type?: "text" | "number" | "email" | "password";
  className?: string;
  variantIntent?: VariantProps<typeof inputVariants>["variantIntent"];
  variantTone?: VariantProps<typeof inputVariants>["variantTone"];
  variantSize?: VariantProps<typeof inputVariants>["variantSize"];
};

export function Input({
  value,
  onChange,
  onKeyPress,
  placeholder,
  autoFocus,
  disabled,
  type = "text",
  className,
  variantIntent,
  variantTone,
  variantSize,
}: InputProps) {
  const baseClass = inputVariants({
    variantIntent,
    variantTone,
    variantSize,
  });

  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange((e.target as HTMLInputElement).value)}
      onKeyPress={onKeyPress}
      placeholder={placeholder}
      autoFocus={autoFocus}
      disabled={disabled}
      className={clsx(baseClass, className)}
    />
  );
}
