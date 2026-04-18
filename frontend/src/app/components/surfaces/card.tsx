import { Layout, type LayoutProps } from "../atoms/layout";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import styles from "@styles/components/surfaces/card.module.css";

const cardVariants = cva(styles.card, {
  variants: {
    variantColor: {
      blue: styles.colorBlue,
      gold: styles.colorGold,
      green: styles.colorGreen,
      red: styles.colorRed,
      gray: styles.colorGray,
    },
  },
  defaultVariants: {
    variantColor: "blue",
  },
});

export interface CardProps extends LayoutProps {
  variantColor?: VariantProps<typeof cardVariants>["variantColor"];
}

export function Card({
  variantColor,
  className,
  children,
  ...props
}: CardProps) {
  const baseClass = cardVariants({ variantColor });

  return (
    <Layout gap="sm" className={clsx(baseClass, className)} {...props}>
      {children}
    </Layout>
  );
}
