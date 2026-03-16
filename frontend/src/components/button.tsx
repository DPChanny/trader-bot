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
    variantVariant: {
      text: "",
      icon: styles.variantIcon,
    },
  },
  defaultVariants: {
    variantIntent: "primary",
    variantTone: "solid",
    variantSize: "medium",
    variantVariant: "text",
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
  variantVariant?: VariantProps<typeof buttonVariants>["variantVariant"];
};

export function Button({
  className,
  variantIntent,
  variantTone,
  variantSize,
  variantVariant,
  type = "button",
  ...props
}: ButtonProps) {
  const baseClass = buttonVariants({
    variantIntent,
    variantTone,
    variantSize,
    variantVariant,
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
  props: Omit<ButtonProps, "children" | "variantVariant">,
) {
  return (
    <Button
      variantVariant="icon"
      variantIntent="primary"
      title="수정"
      {...props}
    >
      ✎
    </Button>
  );
}

export function DeleteButton(
  props: Omit<ButtonProps, "children" | "variantVariant">,
) {
  return (
    <Button
      variantVariant="icon"
      variantIntent="destructive"
      title="삭제"
      {...props}
    >
      🗑
    </Button>
  );
}

export function CloseButton(
  props: Omit<ButtonProps, "children" | "variantVariant">,
) {
  return (
    <Button
      variantVariant="icon"
      variantIntent="destructive"
      title="닫기"
      {...props}
    >
      ✕
    </Button>
  );
}

export function SaveButton(
  props: Omit<ButtonProps, "children" | "variantVariant">,
) {
  return (
    <Button
      variantVariant="icon"
      variantIntent="primary"
      title="저장"
      {...props}
    >
      ✓
    </Button>
  );
}
