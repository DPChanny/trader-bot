import { clsx } from "clsx";
import styles from "@styles/components/atoms/input.module.css";
import { cva, type VariantProps } from "class-variance-authority";
import type { JSX } from "react";

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
  onBlur,
  type = "text",
  min,
  max,
  maxLength,
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
      min={min}
      max={max}
      maxLength={maxLength}
      onInput={(e) => {
        onInput?.(e);
        const el = e.currentTarget as HTMLInputElement;
        let val = el.value;
        if (type === "number" && val !== "") {
          const num = Number(val);
          if (!isNaN(num)) {
            const maxNum =
              max !== undefined && max !== "" ? Number(max) : Infinity;
            val = String(Math.min(maxNum, num));
          }
        } else if (type === "text" && maxLength !== undefined) {
          if (val.length > maxLength) {
            val = val.slice(0, maxLength);
          }
        }
        onValueChange?.(val);
      }}
      onBlur={(e) => {
        onBlur?.(e);
        if (type === "number") {
          const el = e.currentTarget as HTMLInputElement;
          const val = el.value;
          if (val !== "") {
            const num = Number(val);
            if (!isNaN(num)) {
              const minNum =
                min !== undefined && min !== "" ? Number(min) : -Infinity;
              const maxNum =
                max !== undefined && max !== "" ? Number(max) : Infinity;
              const clamped = String(Math.min(maxNum, Math.max(minNum, num)));
              if (clamped !== val) onValueChange?.(clamped);
            }
          }
        }
      }}
      className={clsx(baseClass, className)}
      {...props}
    />
  );
}
