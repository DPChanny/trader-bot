import { clsx } from "clsx";
import styles from "@/styles/components/commons/input.module.css";
import { cva, type VariantProps } from "class-variance-authority";
import type { JSX } from "preact";

const inputVariants = cva(styles.input, {
  variants: {
    variantIntent: {
      default: styles.intentDefault,
      error: styles.intentError,
    },
    variantSize: {
      small: styles.sizeSmall,
      medium: styles.sizeMedium,
      large: styles.sizeLarge,
    },
  },
  defaultVariants: {
    variantIntent: "default",
    variantSize: "medium",
  },
});

export type InputProps = JSX.IntrinsicElements["input"] & {
  value?: string | number;
  onValueChange?: (value: string) => void;
  variantIntent?: VariantProps<typeof inputVariants>["variantIntent"];
  variantSize?: VariantProps<typeof inputVariants>["variantSize"];
};

export function Input({
  value,
  onValueChange,
  onInput,
  type = "text",
  className,
  variantIntent,
  variantSize,
  ...props
}: InputProps) {
  const baseClass = inputVariants({
    variantIntent,
    variantSize,
  });

  return (
    <input
      type={type}
      value={value}
      onInput={(e) => {
        onInput?.(e);
        onValueChange?.((e.currentTarget as HTMLInputElement).value);
      }}
      className={clsx(baseClass, className)}
      {...props}
    />
  );
}
