import { createPortal } from "preact/compat";
import { Column, Fill, FlexItem, Row } from "./atoms/layout";
import { Title } from "./atoms/text";
import { PrimarySection, SecondarySection } from "./molecules/section";
import styles from "@styles/components/modal.module.css";
import { toChildArray, type ComponentChildren, type VNode } from "preact";

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
          onClick={(e) => e.stopPropagation()}
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
  onSubmit: (e: Event) => void | Promise<void>;
  children: ComponentChildren;
  id?: string;
}

export function ModalForm({ onSubmit, children, id }: ModalFormProps) {
  return (
    <form id={id} onSubmit={onSubmit}>
      <Column>{children}</Column>
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
