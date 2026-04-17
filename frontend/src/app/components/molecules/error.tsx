import { Card } from "./card";
import { Column } from "../atoms/layout";
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
    <Card
      center
      gap="none"
      variantColor="red"
      className={clsx(className)}
      {...props}
    >
      <Column center gap="none">
        <Text variantSize="small" variantWeight="bold">
          {children}
        </Text>
        <Text variantSize="small">
          #{error.code} {error.message}
        </Text>
      </Column>
    </Card>
  );
}
