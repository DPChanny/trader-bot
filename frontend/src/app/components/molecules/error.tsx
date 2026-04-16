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
  return (
    <Column
      center
      gap="none"
      className={clsx(styles.error, className)}
      {...props}
    >
      <Text variantSize="small" variantWeight="bold">
        {children}
      </Text>
      <Text variantSize="small">
        #{error.code} {error.message}
      </Text>
    </Column>
  );
}
