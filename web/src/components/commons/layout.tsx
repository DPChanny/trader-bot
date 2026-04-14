import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import styles from "@/styles/components/commons/layout.module.css";
import type { ComponentChildren, HTMLAttributes } from "preact";

const layoutVariants = cva(styles.layout, {
  variants: {
    direction: {
      row: styles.directionRow,
      column: styles.directionColumn,
      grid: styles.directionGrid,
    },
    surface: {
      none: "",
      primary: styles.surfacePrimary,
      secondary: styles.surfaceSecondary,
      tertiary: styles.surfaceTertiary,
    },
    gap: {
      none: styles.gapNone,
      xs: styles.gapXs,
      sm: styles.gapSm,
      md: styles.gapMd,
      lg: styles.gapLg,
      xl: styles.gapXl,
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
    surface: "none",
    justify: "start",
    align: "stretch",
    center: false,
    wrap: false,
    fill: false,
    minSize: false,
    overflow: "visible",
  },
});

export interface LayoutProps
  extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof layoutVariants> {
  children?: ComponentChildren;
  className?: string;
}

export function Layout({
  direction = "column",
  surface = "none",
  gap,
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
  return (
    <div
      className={clsx(
        layoutVariants({
          direction,
          surface,
          gap,
          justify,
          align,
          center,
          wrap,
          fill,
          minSize,
          overflow,
        }),
        className,
      )}
      {...props}
    >
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

type GridProps = Omit<LayoutProps, "direction">;

export function Grid(props: GridProps) {
  return <Layout direction="grid" {...props} />;
}

type FillProps = Omit<LayoutProps, "fill" | "minSize">;

export function Fill(props: FillProps) {
  return <Layout fill minSize {...props} />;
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
