import { Column } from "../atoms/layout";
import styles from "@styles/components/molecules/error.module.css";
import { clsx } from "clsx";
import { Text } from "../atoms/text";
import { AppError } from "@utils/error";
import type { JSX } from "preact";

type ErrorProps = JSX.IntrinsicElements["div"] & {
  error: AppError;
};

export function Error({ className, error, ...props }: ErrorProps) {
  const message = `#${error.code}: ${error.message}`;

  return (
    <Column
      align="center"
      gap="xs"
      className={clsx(styles.error, className)}
      {...props}
    >
      <Text>{message}</Text>
    </Column>
  );
}
