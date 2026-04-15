import { Column } from "../atoms/layout";
import { useState } from "preact/hooks";
import styles from "@styles/components/molecules/error.module.css";
import { clsx } from "clsx";
import { Text } from "../atoms/text";
import { AppError } from "@utils/error";
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

  return (
    <Column
      align="center"
      gap="xs"
      className={clsx(styles.error, className)}
      {...props}
    >
      {detail ? (
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={showDetail}
          onClick={() => setShowDetail((v) => !v)}
        >
          <Text>{children ?? "오류가 발생했습니다."}</Text>
        </button>
      ) : (
        <Text>{children ?? "오류가 발생했습니다."}</Text>
      )}
      {showDetail && (
        <Text variantSize="small" className={styles.detail}>
          {code !== undefined ? `#${code}: ${detail}` : detail}
        </Text>
      )}
    </Column>
  );
}
