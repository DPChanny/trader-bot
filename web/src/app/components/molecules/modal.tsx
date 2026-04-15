import { createPortal } from "preact/compat";
import { clsx } from "clsx";
import { Column, Fill, Row } from "../atoms/layout";
import { Title } from "../atoms/text";
import { PrimarySection, SecondarySection } from "./section";
import styles from "@styles/components/molecules/modal.module.css";
import { toChildArray, type ComponentChildren, type JSX } from "preact";

export type ModalProps = {
  onClose: () => void;
  title: string;
  children: ComponentChildren;
  className?: string;
};

export function Modal({ onClose, title, children, className }: ModalProps) {
  const childArray = toChildArray(children);

  const footerChildren = childArray.filter(
    (child) => (child as JSX.Element)?.type === ModalFooter,
  );
  const bodyChildren = childArray.filter(
    (child) => (child as JSX.Element)?.type !== ModalFooter,
  );

  const content = (
    <Fill className={styles.modal}>
      <Fill center className={styles.overlay} onClick={onClose}>
        <PrimarySection
          overflow="y"
          className={clsx(styles.content, className)}
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
  onSubmit: (e: Event) => void;
  children: JSX.Element | JSX.Element[] | (JSX.Element | null | undefined)[];
  className?: string;
  id?: string;
}

export function ModalForm({
  onSubmit,
  children,
  className,
  id,
}: ModalFormProps) {
  return (
    <form id={id} onSubmit={onSubmit}>
      <Column className={className}>{children}</Column>
    </form>
  );
}

export interface ModalRowProps {
  children: JSX.Element | JSX.Element[];
  className?: string;
}

export function ModalRow({ children, className }: ModalRowProps) {
  return (
    <Row align="center" className={clsx(styles.row, className)}>
      {children}
    </Row>
  );
}

export interface ModalFooterProps {
  children: JSX.Element | JSX.Element[];
  className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <Row align="center" justify="end" className={className}>
      {children}
    </Row>
  );
}
