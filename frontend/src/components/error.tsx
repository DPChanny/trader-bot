import { useState } from "preact/hooks";
import styles from "@/styles/components/error.module.css";
import { clsx } from "clsx";

interface ErrorProps {
  message?: string;
  children?: any;
  className?: string;
  detail?: string;
}

export function Error({ message, children, className, detail }: ErrorProps) {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <div className={clsx(styles.error, className)}>
      <span>{children || message || "오류가 발생했습니다."}</span>
      {detail && (
        <a
          className={styles.detailToggle}
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setShowDetail((v) => !v);
          }}
        >
          {showDetail ? "간단히" : "자세히"}
        </a>
      )}
      {detail && showDetail && <span className={styles.detail}>{detail}</span>}
    </div>
  );
}
