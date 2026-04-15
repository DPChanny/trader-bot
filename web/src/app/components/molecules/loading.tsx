import { Column, Fill, type LayoutProps } from "../atoms/layout";
import { Body } from "../atoms/text";
import styles from "@styles/components/molecules/loading.module.css";

export type LoadingProps = Omit<LayoutProps, "children">;

export function Loading({ className, ...props }: LoadingProps) {
  return (
    <Fill center className={className} {...props}>
      <Column center gap="md" padding="xl">
        <div className={styles.spinner}></div>
        <Body className={styles.text}>로딩중</Body>
      </Column>
    </Fill>
  );
}
