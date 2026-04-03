import { createPortal } from "preact/compat";
import { clsx } from "clsx";
import { Bar } from "@/components/commons/bar";
import { Section } from "@/components/commons/section";
import { PrimaryButton, SecondaryButton } from "@/components/commons/button";
import styles from "@/styles/components/commons/modal.module.css";
import type { JSX } from "preact";

export type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: JSX.Element | JSX.Element[] | string;
  className?: string;
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className,
}: ModalProps) {
  if (!isOpen) return null;

  const content = (
    <div className={styles.modal}>
      <div className={styles.overlay} onClick={onClose}>
        <Section
          className={clsx(styles.content, className)}
          onClick={(e) => e.stopPropagation()}
        >
          <h3>{title}</h3>
          <Bar variantColor="blue" variantThickness="thin" />
          {children}
        </Section>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

interface ModalFormProps {
  onSubmit: (e: Event) => void;
  children: JSX.Element | JSX.Element[] | (JSX.Element | null | undefined)[];
  className?: string;
}

export function ModalForm({ onSubmit, children, className }: ModalFormProps) {
  return (
    <form onSubmit={onSubmit}>
      <Section
        variantTone="ghost"
        variantIntent="secondary"
        className={clsx(className)}
      >
        {children}
      </Section>
    </form>
  );
}

interface ModalRowProps {
  children: JSX.Element | JSX.Element[];
  className?: string;
}

export function ModalRow({ children, className }: ModalRowProps) {
  return (
    <Section
      variantTone="ghost"
      variantLayout="row"
      variantIntent="secondary"
      className={clsx(styles.row, className)}
    >
      {children}
    </Section>
  );
}

interface ModalFooterProps {
  children: JSX.Element | JSX.Element[];
  className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <Section
      variantTone="ghost"
      variantLayout="row"
      className={clsx(styles.footer, className)}
    >
      {children}
    </Section>
  );
}

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isPending?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "확인",
  cancelText = "취소",
  isPending = false,
}: ConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <Section variantTone="ghost" variantIntent="secondary">
        {message}
        <ModalFooter>
          <SecondaryButton onClick={onClose}>{cancelText}</SecondaryButton>
          <PrimaryButton onClick={handleConfirm} disabled={isPending}>
            {confirmText}
          </PrimaryButton>
        </ModalFooter>
      </Section>
    </Modal>
  );
}
