import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import styles from "@styles/components/atoms/layout.module.css";
import type { JSX, Ref } from "preact";
import { useLayoutEffect, useRef, useState } from "preact/hooks";

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

export type LayoutProps = Omit<JSX.IntrinsicElements["div"], "ref"> &
  VariantProps<typeof layoutVariants> & {
    centerOnWrap?: boolean;
    ref?: Ref<HTMLDivElement>;
  };

export function Layout({
  direction = "column",
  gap,
  padding = "none",
  justify,
  align,
  center = false,
  centerOnWrap = false,
  wrap = false,
  fill = false,
  minSize = false,
  overflow = "visible",
  ref,
  className,
  children,
  ...props
}: LayoutProps) {
  const layoutRef = useRef<HTMLDivElement>(null);
  const [isWrapped, setIsWrapped] = useState(false);

  useLayoutEffect(() => {
    const layout = layoutRef.current;

    if (!centerOnWrap || !wrap || !layout) {
      setIsWrapped(false);
      return;
    }

    let frameId = 0;

    const measureWrap = () => {
      const firstChild = layout.firstElementChild as HTMLElement | null;

      if (!firstChild) {
        setIsWrapped(false);
        return;
      }

      const firstTop = firstChild.offsetTop;
      const wrapped = Array.from(layout.children).some(
        (child) => (child as HTMLElement).offsetTop !== firstTop,
      );

      setIsWrapped(wrapped);
    };

    const scheduleMeasure = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(measureWrap);
    };

    const resizeObserver = new ResizeObserver(() => {
      scheduleMeasure();
    });

    resizeObserver.observe(layout);
    Array.from(layout.children).forEach((child) => {
      if (child instanceof HTMLElement) {
        resizeObserver.observe(child);
      }
    });
    scheduleMeasure();

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
    };
  }, [centerOnWrap, wrap, children]);

  const baseClass = layoutVariants({
    direction,
    gap,
    padding,
    justify,
    align,
    center: center || (centerOnWrap && isWrapped),
    wrap,
    fill,
    minSize,
    overflow,
  });

  return (
    <div
      ref={(element) => {
        layoutRef.current = element;

        if (typeof ref === "function") {
          ref(element);
          return;
        }

        if (ref) {
          ref.current = element;
        }
      }}
      className={clsx(baseClass, className)}
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
