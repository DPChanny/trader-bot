import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import styles from "@/styles/components/commons/card.module.css";
import type { HTMLAttributes } from "preact";

const cardVariants = cva(styles.card, {
  variants: {
    variantColor: {
      blue: styles.colorBlue,
      gold: styles.colorGold,
      green: styles.colorGreen,
      gray: styles.colorGray,
    },
    variantSelected: {
      true: styles.selectedTrue,
      false: "",
    },
  },
  defaultVariants: {
    variantColor: "blue",
    variantSelected: false,
  },
});

type CardVariantProps = VariantProps<typeof cardVariants>;

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  variantColor?: CardVariantProps["variantColor"];
  variantSelected?: boolean;
};

export function Card({
  variantColor = "blue",
  variantSelected = false,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={clsx(
        cardVariants({ variantColor, variantSelected }),
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
