import { Column } from "../atoms/layout";
import { useState } from "preact/hooks";
import styles from "@styles/components/molecules/error.module.css";
import { clsx } from "clsx";
import { Text } from "../atoms/text";
import { AppError, UNKNOWN_ERROR_MESSAGE } from "@utils/error";
import type { ComponentChildren, JSX } from "preact";

export type ErrorProps = JSX.IntrinsicElements["div"] & {
  children?: ComponentChildren;
  error?: unknown;
};

export function ErrorMessage({
  children,
  className,
  error,
  ...props
}: ErrorProps) {
  const [showDetail, setShowDetail] = useState(false);

  const detail = error instanceof globalThis.Error ? error.message : undefined;
  const code =
    error instanceof AppError ? (error.code ?? undefined) : undefined;
  const text = children ?? detail ?? UNKNOWN_ERROR_MESSAGE;

  return (
    <Column
      align="center"
      gap="xs"
      className={clsx(styles.error, className)}
      {...props}
    >
      {detail ? (
        <button
          className={styles.toggle}
          aria-expanded={showDetail}
          onClick={() => setShowDetail((v) => !v)}
        >
          <Text>{text}</Text>
        </button>
      ) : (
        <Text>{text}</Text>
      )}
      {showDetail && (
        <Text variantSize="small" className={styles.detail}>
          {code !== undefined ? `#${code}: ${detail}` : detail}
        </Text>
      )}
    </Column>
  );
}
