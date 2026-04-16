import { Column } from "../atoms/layout";
import styles from "@styles/components/molecules/error.module.css";
import { clsx } from "clsx";
import { Text } from "../atoms/text";
import { AppError } from "@utils/error";
import type { ComponentChildren, JSX } from "preact";

type ErrorProps = JSX.IntrinsicElements["div"] & {
  error: AppError;
  children: ComponentChildren;
};

export function Error({ className, error, children, ...props }: ErrorProps) {
  const message = `#${error.code}: ${error.message}`;

  return (
    <Column
      align="center"
      gap="xs"
      className={clsx(styles.error, className)}
      {...props}
    >
      <Text>{children}</Text>
      <Text variantSize="small">{message}</Text>
    </Column>
  );
}
