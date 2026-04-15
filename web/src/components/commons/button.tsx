import type { JSX } from "preact";
import { clsx } from "clsx";
import styles from "@/styles/components/commons/button.module.css";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(styles.button, {
  variants: {
    variantIntent: {
      primary: styles.intentPrimary,
      secondary: styles.intentSecondary,
      danger: styles.intentDanger,
      warning: styles.intentWarning,
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
    variantContent: {
      text: "",
      icon: styles.contentIcon,
    },
  },
  defaultVariants: {
    variantIntent: "primary",
    variantTone: "solid",
    variantSize: "medium",
    variantContent: "text",
  },
});

export type PressedButtonProps = JSX.IntrinsicElements["button"] & {
  isPressed?: boolean;
};

export type ButtonProps = PressedButtonProps & {
  variantIntent?: VariantProps<typeof buttonVariants>["variantIntent"];
  variantTone?: VariantProps<typeof buttonVariants>["variantTone"];
  variantSize?: VariantProps<typeof buttonVariants>["variantSize"];
  variantContent?: VariantProps<typeof buttonVariants>["variantContent"];
};

export function PressedButton({
  type = "button",
  isPressed,
  className,
  ...props
}: PressedButtonProps) {
  return (
    <button
      type={type}
      className={className}
      aria-pressed={isPressed}
      {...props}
    />
  );
}

export function Button({
  className,
  variantIntent,
  variantTone,
  variantSize,
  variantContent,
  type = "button",
  isPressed,
  ...props
}: ButtonProps) {
  const baseClass = buttonVariants({
    variantIntent,
    variantTone,
    variantSize,
    variantContent,
  });

  return (
    <PressedButton
      type={type}
      isPressed={isPressed}
      className={clsx(baseClass, className)}
      {...props}
    />
  );
}

export function PrimaryButton(props: Omit<ButtonProps, "variantIntent">) {
  return <Button variantIntent="primary" {...props} />;
}

export function SecondaryButton(props: Omit<ButtonProps, "variantIntent">) {
  return <Button variantIntent="secondary" {...props} />;
}

export function DangerButton(props: Omit<ButtonProps, "variantIntent">) {
  return <Button variantIntent="danger" {...props} />;
}

export function EditButton(
  props: Omit<ButtonProps, "children" | "variantContent">,
) {
  return (
    <Button
      variantContent="icon"
      variantIntent="primary"
      title="수정"
      {...props}
    >
      ✎
    </Button>
  );
}

export function DeleteButton(
  props: Omit<ButtonProps, "children" | "variantContent">,
) {
  return (
    <Button
      variantContent="icon"
      variantIntent="danger"
      title="삭제"
      {...props}
    >
      🗑
    </Button>
  );
}

export function CloseButton(
  props: Omit<ButtonProps, "children" | "variantContent">,
) {
  return (
    <Button
      variantContent="icon"
      variantIntent="danger"
      title="닫기"
      {...props}
    >
      ✕
    </Button>
  );
}

export function SaveButton(
  props: Omit<ButtonProps, "children" | "variantContent">,
) {
  return (
    <Button
      variantContent="icon"
      variantIntent="primary"
      title="저장"
      {...props}
    >
      ✓
    </Button>
  );
}
