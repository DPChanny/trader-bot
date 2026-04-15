import { Column, Fill, type LayoutProps } from "@/components/atoms/layout";
import styles from "@/styles/components/molecules/loading.module.css";

export type LoadingProps = Omit<LayoutProps, "children">;

export function Loading({ className, ...props }: LoadingProps) {
  return (
    <Fill center className={className} {...props}>
      <Column center gap="md" padding="xl">
        <div className={styles.spinner}></div>
        <div className={styles.text}>로딩중</div>
      </Column>
    </Fill>
  );
}
