import { Layout, type LayoutProps } from "@/components/commons/layout";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import styles from "@/styles/components/commons/section.module.css";

interface SectionProps extends LayoutProps {
  variantIntent: VariantProps<typeof sectionVariants>["variantIntent"];
}

const sectionVariants = cva(styles.section, {
  variants: {
    variantIntent: {
      primary: styles.intentPrimary,
      secondary: styles.intentSecondary,
      tertiary: styles.intentTertiary,
    },
  },
  defaultVariants: {
    variantIntent: "primary",
  },
});

function Section({ className, variantIntent, ...props }: SectionProps) {
  const baseClass = sectionVariants({ variantIntent });

  return <Layout className={clsx(baseClass, className)} {...props} />;
}

export function PrimarySection(props: LayoutProps) {
  return <Section variantIntent="primary" {...props} />;
}

export function SecondarySection(props: LayoutProps) {
  return <Section variantIntent="secondary" {...props} />;
}

export function TertiarySection(props: LayoutProps) {
  return <Section variantIntent="tertiary" {...props} />;
}
