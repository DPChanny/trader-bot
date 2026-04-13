import styles from "@/styles/components/commons/label.module.css";

interface LabelProps {
  children: any;
  htmlFor?: string;
  required?: boolean;
}

export function Label({ children, htmlFor, required }: LabelProps) {
  return (
    <label className={styles.label} htmlFor={htmlFor}>
      {children}
      {required && <span className={styles.required}> *</span>}
    </label>
  );
}
