import { Layout, type LayoutProps } from "@/components/commons/layout";
import { cva } from "class-variance-authority";
import { clsx } from "clsx";
import styles from "@/styles/components/commons/section.module.css";

type SectionIntent = "primary" | "secondary" | "tertiary";

interface BaseSectionProps extends LayoutProps {
  variantIntent: SectionIntent;
}

export type SurfaceSectionProps = Omit<BaseSectionProps, "variantIntent">;

const sectionVariants = cva(styles.section, {
  variants: {
    variantIntent: {
      primary: styles.intentPrimary,
      secondary: styles.intentSecondary,
      tertiary: styles.intentTertiary,
    },
  },
});

function BaseSection({ className, variantIntent, ...props }: BaseSectionProps) {
  return (
    <Layout
      className={clsx(sectionVariants({ variantIntent }), className)}
      {...props}
    />
  );
}

export function PrimarySection(props: SurfaceSectionProps) {
  return <BaseSection variantIntent="primary" {...props} />;
}

export function SecondarySection(props: SurfaceSectionProps) {
  return <BaseSection variantIntent="secondary" {...props} />;
}

export function TertiarySection(props: SurfaceSectionProps) {
  return <BaseSection variantIntent="tertiary" {...props} />;
}
