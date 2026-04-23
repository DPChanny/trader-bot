import { createPortal } from "react-dom";
import { Column, Fill, FlexItem, Row } from "./atoms/layout";
import { Title } from "./atoms/text";
import { PrimarySection, SecondarySection } from "./surfaces/section";
import styles from "@styles/components/modal.module.css";
import React, { Children, type ReactNode, type ReactElement } from "react";

export type ModalProps = {
  onClose: () => void;
  title: string;
  children: ReactNode;
};

export function Modal({ onClose, title, children }: ModalProps) {
  const childArray = Children.toArray(children);

  const footerChildren = childArray.filter(
    (child) => (child as ReactElement)?.type === ModalFooter,
  );
  const bodyChildren = childArray.filter(
    (child) => (child as ReactElement)?.type !== ModalFooter,
  );

  const content = (
    <Fill className={styles.modal}>
      <Fill center className={styles.overlay} onClick={onClose}>
        <PrimarySection
          overflow="y"
          className={styles.content}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
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
  children: ReactNode;
  id?: string;
  disabled: boolean;
}

export function ModalForm({
  onSubmit,
  children,
  id,
  disabled,
}: ModalFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
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
  children: ReactNode;
}

export function ModalRow({ children }: ModalRowProps) {
  const childArray = Children.toArray(children);

  return (
    <Row align="center">
      {childArray.map((child, index) => (
        <FlexItem key={index}>{child}</FlexItem>
      ))}
    </Row>
  );
}

export interface ModalFooterProps {
  children: ReactNode;
}

export function ModalFooter({ children }: ModalFooterProps) {
  return (
    <Row align="center" justify="end">
      {children}
    </Row>
  );
}