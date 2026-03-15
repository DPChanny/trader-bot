import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import styles from "@/styles/components/section.module.css";

const sectionVariants = cva(styles.section, {
  variants: {
    variantType: {
      primary: styles["section--primary"],
      secondary: styles["section--secondary"],
      tertiary: styles["section--tertiary"],
    },
    variantTone: {
      solid: styles["section--solid"],
      ghost: styles["section--ghost"],
    },
    variantLayout: {
      column: styles["section--column"],
      row: styles["section--row"],
      grid: styles["section--grid"],
    },
  },
  defaultVariants: {
    variantType: "primary",
    variantTone: "solid",
    variantLayout: "column",
  },
});

interface SectionProps extends VariantProps<typeof sectionVariants> {
  children: any;
  variantType?: "primary" | "secondary" | "tertiary";
  variantTone?: "solid" | "ghost";
  variantLayout?: "column" | "row" | "grid";
  className?: string;
}

export function Section({
  children,
  variantType = "primary",
  variantTone = "solid",
  variantLayout = "column",
  className,
}: SectionProps) {
  return (
    <div
      className={clsx(
        sectionVariants({ variantType, variantTone, variantLayout }),
        className,
      )}
    >
      {children}
    </div>
  );
}
