import { Layout, type LayoutProps } from "../atoms/layout";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import styles from "@styles/components/surfaces/section.module.css";

interface SectionProps extends LayoutProps {
  variantSurface: VariantProps<typeof sectionVariants>["variantSurface"];
}

const sectionVariants = cva(styles.section, {
  variants: {
    variantSurface: {
      primary: styles.surfacePrimary,
      secondary: styles.surfaceSecondary,
      tertiary: styles.surfaceTertiary,
    },
  },
  defaultVariants: {
    variantSurface: "primary",
  },
});

function Section({ className, variantSurface, ...props }: SectionProps) {
  const baseClass = sectionVariants({ variantSurface });

  return <Layout className={clsx(baseClass, className)} {...props} />;
}

export function PrimarySection(props: LayoutProps) {
  return <Section variantSurface="primary" {...props} />;
}

export function SecondarySection(props: LayoutProps) {
  return <Section variantSurface="secondary" {...props} />;
}

export function TertiarySection(props: LayoutProps) {
  return <Section variantSurface="tertiary" {...props} />;
}
