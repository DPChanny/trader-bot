import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import type { JSX } from "preact";
import styles from "@styles/components/molecules/dot.module.css";

const dotVariants = cva(styles.dot, {
  variants: {
    variantColor: {
      red: styles.colorRed,
      blue: styles.colorBlue,
      green: styles.colorGreen,
    },
  },
  defaultVariants: {
    variantColor: "blue",
  },
});

export type DotProps = JSX.IntrinsicElements["div"] & {
  variantColor?: VariantProps<typeof dotVariants>["variantColor"];
};

export function Dot({ variantColor, className, ...props }: DotProps) {
  const baseClass = dotVariants({ variantColor });

  return <div className={clsx(baseClass, className)} {...props} />;
}
