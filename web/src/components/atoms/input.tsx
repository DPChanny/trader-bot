import { clsx } from "clsx";
import styles from "@/styles/components/atoms/input.module.css";
import { cva, type VariantProps } from "class-variance-authority";
import type { JSX } from "preact";

const inputVariants = cva(styles.input, {
  variants: {
    variantState: {
      valid: styles.stateValid,
      invalid: styles.stateInvalid,
    },
    variantSize: {
      small: styles.sizeSmall,
      medium: styles.sizeMedium,
      large: styles.sizeLarge,
    },
  },
  defaultVariants: {
    variantState: "valid",
    variantSize: "medium",
  },
});

export type InputProps = JSX.IntrinsicElements["input"] & {
  value?: string | number;
  onValueChange?: (value: string) => void;
  variantState?: VariantProps<typeof inputVariants>["variantState"];
  variantSize?: VariantProps<typeof inputVariants>["variantSize"];
};

export function Input({
  value,
  onValueChange,
  onInput,
  type = "text",
  className,
  variantState,
  variantSize,
  ...props
}: InputProps) {
  const baseClass = inputVariants({
    variantState,
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
