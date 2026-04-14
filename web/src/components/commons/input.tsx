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

export type InputProps = Omit<JSX.IntrinsicElements["input"], "onChange"> & {
  value?: string | number;
  onChange?: (value: string) => void;
  variantIntent?: VariantProps<typeof inputVariants>["variantIntent"];
  variantTone?: VariantProps<typeof inputVariants>["variantTone"];
  variantSize?: VariantProps<typeof inputVariants>["variantSize"];
};

export function Input({
  value,
  onChange,
  type = "text",
  className,
  variantIntent,
  variantTone,
  variantSize,
  ...props
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
      onChange={(e) => onChange?.((e.target as HTMLInputElement).value)}
      className={clsx(baseClass, className)}
      {...props}
    />
  );
}
