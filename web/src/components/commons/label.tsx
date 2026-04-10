import styles from "@/styles/components/commons/label.module.css";

interface LabelProps {
  children: any;
  htmlFor?: string;
}

export function Label({ children, htmlFor }: LabelProps) {
  return (
    <label className={styles.label} htmlFor={htmlFor}>
      {children}
    </label>
  );
}
