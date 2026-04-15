import { Column } from "@/app/components/atoms/layout";
import { useState } from "preact/hooks";
import styles from "@/app/styles/components/molecules/error.module.css";
import { clsx } from "clsx";
import { AppError } from "@/utils/error";
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
          {children ?? "오류가 발생했습니다."}
        </button>
      ) : (
        <span>{children ?? "오류가 발생했습니다."}</span>
      )}
      {showDetail && (
        <span className={styles.detail}>
          {code !== undefined ? `#${code}: ${detail}` : detail}
        </span>
      )}
    </Column>
  );
}
