import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import styles from "@styles/components/atoms/layout.module.css";
import type { JSX } from "preact";

const layoutVariants = cva(styles.layout, {
  variants: {
    direction: {
      row: styles.directionRow,
      column: styles.directionColumn,
    },
    gap: {
      none: styles.gapNone,
      xs: styles.gapXs,
      sm: styles.gapSm,
      md: styles.gapMd,
      lg: styles.gapLg,
      xl: styles.gapXl,
    },
    padding: {
      none: styles.paddingNone,
      sm: styles.paddingSm,
      md: styles.paddingMd,
      lg: styles.paddingLg,
      xl: styles.paddingXl,
    },
    justify: {
      start: styles.justifyStart,
      center: styles.justifyCenter,
      end: styles.justifyEnd,
      between: styles.justifyBetween,
      around: styles.justifyAround,
      evenly: styles.justifyEvenly,
    },
    align: {
      start: styles.alignStart,
      center: styles.alignCenter,
      end: styles.alignEnd,
      stretch: styles.alignStretch,
    },
    center: {
      true: styles.center,
      false: "",
    },
    wrap: {
      true: styles.wrap,
      false: "",
    },
    fill: {
      true: styles.fill,
      false: "",
    },
    minSize: {
      true: styles.minSize,
      false: "",
    },
    overflow: {
      visible: "",
      hidden: styles.overflowHidden,
      auto: styles.overflowAuto,
      x: styles.overflowX,
      y: styles.overflowY,
    },
  },
  defaultVariants: {
    direction: "column",
    padding: "none",
    justify: "start",
    align: "stretch",
    center: false,
    wrap: false,
    fill: false,
    minSize: false,
    overflow: "visible",
  },
});

export type LayoutProps = JSX.IntrinsicElements["div"] &
  VariantProps<typeof layoutVariants> & {
    className?: string;
  };

export function Layout({
  direction = "column",
  gap,
  padding = "none",
  justify,
  align,
  center = false,
  wrap = false,
  fill = false,
  minSize = false,
  overflow = "visible",
  className,
  children,
  ...props
}: LayoutProps) {
  const baseClass = layoutVariants({
    direction,
    gap,
    padding,
    justify,
    align,
    center,
    wrap,
    fill,
    minSize,
    overflow,
  });

  return (
    <div className={clsx(baseClass, className)} {...props}>
      {children}
    </div>
  );
}

type FlowProps = Omit<LayoutProps, "direction">;

export function Row(props: FlowProps) {
  return <Layout direction="row" {...props} />;
}

export function Column(props: FlowProps) {
  return <Layout direction="column" {...props} />;
}

type FillProps = Omit<LayoutProps, "fill" | "minSize">;

export function Fill(props: FillProps) {
  return <Layout fill minSize {...props} />;
}

export type FlexItemProps = JSX.IntrinsicElements["div"] & {};

export function FlexItem({ className, children, ...props }: FlexItemProps) {
  return (
    <div className={clsx(styles.flexItem, className)} {...props}>
      {children}
    </div>
  );
}

export type PageProps = Omit<
  LayoutProps,
  "direction" | "fill" | "minSize" | "overflow" | "gap" | "padding"
>;

export function Page(props: PageProps) {
  return (
    <Row fill minSize overflow="hidden" gap="lg" padding="lg" {...props} />
  );
}

export interface ScrollProps extends Omit<LayoutProps, "overflow"> {
  axis?: "x" | "y" | "both";
}

export function Scroll({
  axis = "y",
  fill = true,
  minSize = true,
  ...props
}: ScrollProps) {
  const overflow = axis === "x" ? "x" : axis === "y" ? "y" : "auto";
  return (
    <Layout overflow={overflow} fill={fill} minSize={minSize} {...props} />
  );
}
