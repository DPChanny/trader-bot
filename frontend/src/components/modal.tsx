import { createPortal } from "react-dom";
import { Column, Fill, FlexItem, Row } from "./atoms/layout";
import { Title } from "./atoms/text";
import { PrimarySection, SecondarySection } from "./surfaces/section";
import styles from "@styles/components/modal.module.css";
import { toChildArray, type ComponentChildren, type VNode } from "react";

export type ModalProps = {
  onClose: () => void;
  title: string;
  children: ComponentChildren;
};

export function Modal({ onClose, title, children }: ModalProps) {
  const childArray = toChildArray(children);

  const footerChildren = childArray.filter(
    (child) => (child as VNode)?.type === ModalFooter,
  );
  const bodyChildren = childArray.filter(
    (child) => (child as VNode)?.type !== ModalFooter,
  );

  const content = (
    <Fill className={styles.modal}>
      <Fill center className={styles.overlay} onClick={onClose}>
        <PrimarySection
          overflow="y"
          className={styles.content}
          onClick={(e: MouseEvent) => e.stopPropagation()}
        >
          <Title>{title}</Title>
          <SecondarySection>{bodyChildren}</SecondarySection>
          {footerChildren}
        </PrimarySection>
      </Fill>
    </Fill>
  );

  return createPortal(content, document.body);
}

export interface ModalFormProps {
  onSubmit: () => void | Promise<void>;
  children: ComponentChildren;
  id?: string;
  disabled: boolean;
}

export function ModalForm({
  onSubmit,
  children,
  id,
  disabled,
}: ModalFormProps) {
  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (disabled) return;
    return onSubmit();
  };

  return (
    <form id={id} onSubmit={handleSubmit}>
      <fieldset disabled={disabled} className={styles.fieldset}>
        <Column>{children}</Column>
      </fieldset>
    </form>
  );
}

export interface ModalRowProps {
  children: ComponentChildren;
}

export function ModalRow({ children }: ModalRowProps) {
  const childArray = toChildArray(children);

  return (
    <Row align="center">
      {childArray.map((child, index) => (
        <FlexItem key={index}>{child}</FlexItem>
      ))}
    </Row>
  );
}

export interface ModalFooterProps {
  children: ComponentChildren;
}

export function ModalFooter({ children }: ModalFooterProps) {
  return (
    <Row align="center" justify="end">
      {children}
    </Row>
  );
}
