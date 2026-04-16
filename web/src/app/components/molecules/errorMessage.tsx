import { Column } from "../atoms/layout";
import styles from "@styles/components/molecules/error.module.css";
import { clsx } from "clsx";
import { Text } from "../atoms/text";
import { UNKNOWN_ERROR_MESSAGE, AppError } from "@utils/error";
import type { JSX } from "preact";

type ErrorProps = JSX.IntrinsicElements["div"] & {
  error: unknown;
};

export function ErrorMessage({ className, error, ...props }: ErrorProps) {
  let message = UNKNOWN_ERROR_MESSAGE;

  if (error instanceof globalThis.Error) {
    if (error instanceof AppError) {
      message = `#${error.code}: ${error.message}`;
    } else {
      message = error.message;
    }
  }

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
