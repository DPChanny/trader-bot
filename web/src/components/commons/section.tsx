import { Layout, type LayoutProps } from "@/components/commons/layout";
import type { ComponentChildren } from "preact";

type SectionIntent = "primary" | "secondary" | "tertiary";

interface SectionProps extends Omit<LayoutProps, "surface"> {
  children?: ComponentChildren;
  variantIntent?: SectionIntent;
}

type SurfaceSectionProps = Omit<SectionProps, "variantIntent">;

export type { SectionProps, SurfaceSectionProps };

const surfaceByIntent: Record<
  SectionIntent,
  "primary" | "secondary" | "tertiary"
> = {
  primary: "primary",
  secondary: "secondary",
  tertiary: "tertiary",
};

export function Section({
  children,
  variantIntent = "primary",
  ...props
}: SectionProps) {
  return (
    <Layout surface={surfaceByIntent[variantIntent]} {...props}>
      {children}
    </Layout>
  );
}

export function PrimarySection(props: SurfaceSectionProps) {
  return <Section variantIntent="primary" {...props} />;
}

export function SecondarySection(props: SurfaceSectionProps) {
  return <Section variantIntent="secondary" {...props} />;
}

export function TertiarySection(props: SurfaceSectionProps) {
  return <Section variantIntent="tertiary" {...props} />;
}
