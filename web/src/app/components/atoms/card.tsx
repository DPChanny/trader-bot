import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import styles from "@/app/styles/components/atoms/card.module.css";
import type { JSX } from "preact";

const cardVariants = cva(styles.card, {
  variants: {
    variantColor: {
      blue: styles.colorBlue,
      gold: styles.colorGold,
      green: styles.colorGreen,
      gray: styles.colorGray,
    },
  },
  defaultVariants: {
    variantColor: "blue",
  },
});

export type CardProps = JSX.IntrinsicElements["div"] & {
  variantColor?: VariantProps<typeof cardVariants>["variantColor"];
};

export function Card({
  variantColor,
  className,
  children,
  ...props
}: CardProps) {
  const baseClass = cardVariants({ variantColor });

  return (
    <div className={clsx(baseClass, className)} {...props}>
      {children}
    </div>
  );
}
