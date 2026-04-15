import { useEffect, useState } from "preact/hooks";
import { clsx } from "clsx";
import { cva, type VariantProps } from "class-variance-authority";
import type { JSX } from "preact";
import styles from "@/styles/components/commons/image.module.css";

const imageVariants = cva(styles.root, {
  variants: {
    variantSize: {
      small: styles.sizeSmall,
      medium: styles.sizeMedium,
      large: styles.sizeLarge,
    },
    variantScale: {
      fixed: "",
      inset: styles.scaleInset,
    },
  },
  defaultVariants: {
    variantSize: "small",
    variantScale: "fixed",
  },
});

export type ImageProps = Omit<JSX.IntrinsicElements["img"], "src"> & {
  src?: string | null;
  variantSize?: VariantProps<typeof imageVariants>["variantSize"];
  variantScale?: VariantProps<typeof imageVariants>["variantScale"];
  variantContent?: "icon" | "avatar";
};

export function Image({
  src,
  variantSize,
  variantScale,
  variantContent = "icon",
  alt,
  className,
  onError,
  ...props
}: ImageProps) {
  const [isBroken, setIsBroken] = useState(false);
  const baseClass = imageVariants({ variantSize, variantScale });

  useEffect(() => {
    setIsBroken(false);
  }, [src]);

  return (
    <span className={clsx(baseClass, className)}>
      {Boolean(src) && !isBroken ? (
        <img
          src={src!}
          alt={alt}
          className={styles.img}
          {...props}
          onError={(event) => {
            setIsBroken(true);
            onError?.(event);
          }}
        />
      ) : (
        <span className={styles.fallback}>
          {variantContent === "avatar" ? (
            <svg
              className={styles.avatarFallbackIcon}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="8" r="4" fill="currentColor" opacity="0.5" />
              <path
                d="M4 20C4 16.6863 6.68629 14 10 14H14C17.3137 14 20 16.6863 20 20V21H4V20Z"
                fill="currentColor"
                opacity="0.5"
              />
            </svg>
          ) : (
            <svg
              className={styles.iconFallbackIcon}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="4"
                y="5"
                width="16"
                height="14"
                rx="3"
                stroke="currentColor"
                strokeWidth="1.6"
                opacity="0.55"
              />
              <path
                d="M7 16L11 12L14 14.8L16.5 12.5L18 14"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.55"
              />
              <circle
                cx="9"
                cy="9"
                r="1.4"
                fill="currentColor"
                opacity="0.55"
              />
            </svg>
          )}
        </span>
      )}
    </span>
  );
}
