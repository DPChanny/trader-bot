import styles from "@/styles/components/error.module.css";
import { clsx } from "clsx";

interface ErrorProps {
  message?: string;
  children?: any;
  className?: string;
}

export function Error({ message, children, className }: ErrorProps) {
  return (
    <div className={clsx(styles.error, className)}>
      {children || message || "오류가 발생했습니다."}
    </div>
  );
}
