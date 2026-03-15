import type { JSX } from "preact";
import { clsx } from "clsx";
import styles from "@/styles/components/button.module.css";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(styles.button, {
  variants: {
    variantIntent: {
      primary: styles.intentPrimary,
      secondary: styles.intentSecondary,
      destructive: styles.intentDestructive,
    },
    variantTone: {
      solid: "",
      outline: styles.toneOutline,
    },
    variantSize: {
      small: styles.sizeSmall,
      medium: styles.sizeMedium,
      large: styles.sizeLarge,
    },
    variantIsIcon: {
      true: styles.isIcon,
      false: "",
    },
  },
  defaultVariants: {
    variantIntent: "primary",
    variantTone: "solid",
    variantSize: "medium",
    variantIsIcon: false,
  },
});

export type ButtonProps = JSX.HTMLAttributes<HTMLButtonElement> & {
  onClick?: (e: JSX.TargetedMouseEvent<HTMLButtonElement>) => void;
  children?: JSX.Element | string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  variantIntent?: VariantProps<typeof buttonVariants>["variantIntent"];
  variantTone?: VariantProps<typeof buttonVariants>["variantTone"];
  variantSize?: VariantProps<typeof buttonVariants>["variantSize"];
  variantIsIcon?: VariantProps<typeof buttonVariants>["variantIsIcon"];
};

export function Button({
  className,
  variantIntent,
  variantTone,
  variantSize,
  variantIsIcon,
  type = "button",
  ...props
}: ButtonProps) {
  const baseClass = buttonVariants({
    variantIntent,
    variantTone,
    variantSize,
    variantIsIcon,
  });

  return (
    <button type={type} className={clsx(baseClass, className)} {...props} />
  );
}

export function PrimaryButton(props: Omit<ButtonProps, "variantIntent">) {
  return <Button variantIntent="primary" {...props} />;
}

export function SecondaryButton(props: Omit<ButtonProps, "variantIntent">) {
  return <Button variantIntent="secondary" {...props} />;
}

export function DangerButton(props: Omit<ButtonProps, "variantIntent">) {
  return <Button variantIntent="destructive" {...props} />;
}

export function EditButton(
  props: Omit<ButtonProps, "children" | "variantIsIcon">,
) {
  return (
    <Button
      variantIsIcon={true}
      variantIntent="primary"
      title="수정"
      {...props}
    >
      ✎
    </Button>
  );
}

export function DeleteButton(
  props: Omit<ButtonProps, "children" | "variantIsIcon">,
) {
  return (
    <Button
      variantIsIcon={true}
      variantIntent="destructive"
      title="삭제"
      {...props}
    >
      🗑
    </Button>
  );
}

export function CloseButton(
  props: Omit<ButtonProps, "children" | "variantIsIcon">,
) {
  return (
    <Button
      variantIsIcon={true}
      variantIntent="destructive"
      title="닫기"
      {...props}
    >
      ✕
    </Button>
  );
}

export function SaveButton(
  props: Omit<ButtonProps, "children" | "variantIsIcon">,
) {
  return (
    <Button
      variantIsIcon={true}
      variantIntent="primary"
      title="저장"
      {...props}
    >
      ✓
    </Button>
  );
}
