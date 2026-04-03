import styles from "@/styles/components/commons/loading.module.css";

interface LoadingProps {
  message?: string;
  children?: any;
}

export function Loading({ message, children }: LoadingProps) {
  return (
    <div className={styles.container}>
      <div className={styles.inner}>
        <div className={styles.spinner}></div>
        <div className={styles.text}>{children || message || "로딩중"}</div>
      </div>
    </div>
  );
}
