import { createPortal } from "preact/compat";
import { clsx } from "clsx";
import { Bar } from "@/components/atoms/bar";
import { Column, Fill, Row } from "@/components/atoms/layout";
import { PrimarySection } from "@/components/molecules/section";
import styles from "@/styles/components/molecules/modal.module.css";
import type { JSX } from "preact";

export type ModalProps = {
  onClose: () => void;
  title: string;
  children: JSX.Element | JSX.Element[] | string;
  className?: string;
};

export function Modal({ onClose, title, children, className }: ModalProps) {
  const content = (
    <Fill className={styles.modal}>
      <Fill center className={styles.overlay} onClick={onClose}>
        <PrimarySection
          overflow="y"
          className={clsx(styles.content, className)}
          onClick={(e) => e.stopPropagation()}
        >
          <h3>{title}</h3>
          <Bar variantColor="blue" variantSize="small" />
          {children}
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
}

export function ModalForm({ onSubmit, children, className }: ModalFormProps) {
  return (
    <form onSubmit={onSubmit}>
      <Column gap="sm" className={className}>
        {children}
      </Column>
    </form>
  );
}

export interface ModalRowProps {
  children: JSX.Element | JSX.Element[];
  className?: string;
}

export function ModalRow({ children, className }: ModalRowProps) {
  return (
    <Row gap="sm" className={clsx(styles.row, className)}>
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
    <Row gap="sm" justify="end" className={className}>
      {children}
    </Row>
  );
}
