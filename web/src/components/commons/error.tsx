import { useState } from "preact/hooks";
import styles from "@/styles/components/commons/error.module.css";
import { clsx } from "clsx";
import { AppError } from "@/utils/error";

interface ErrorProps {
  children?: any;
  className?: string;
  error?: unknown;
}

export function Error({ children, className, error }: ErrorProps) {
  const [showDetail, setShowDetail] = useState(false);

  const detail = error instanceof globalThis.Error ? error.message : undefined;
  const code =
    error instanceof AppError ? (error.code ?? undefined) : undefined;

  return (
    <div className={clsx(styles.error, className)}>
      {detail ? (
        <button
          className={styles.toggle}
          onClick={() => setShowDetail((v) => !v)}
        >
          {children || "오류가 발생했습니다."}
        </button>
      ) : (
        <span>{children || "오류가 발생했습니다."}</span>
      )}
      {showDetail && (
        <span className={styles.detail}>
          {code !== undefined ? `#${code}: ${detail}` : detail}
        </span>
      )}
    </div>
  );
}
