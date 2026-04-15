import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import styles from "@/styles/components/commons/card.module.css";
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
  variantColor = "blue",
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div className={clsx(cardVariants({ variantColor }), className)} {...props}>
      {children}
    </div>
  );
}
