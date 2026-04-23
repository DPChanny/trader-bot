import * as React from "react";
import { clsx } from "clsx";
import styles from "@styles/components/atoms/link.module.css";
import { createLink } from "@tanstack/react-router";
import type { JSX } from "react";

function getVariantClass(children: React.ReactNode) {
  if (typeof children === "string" || typeof children === "number") {
    return styles.contentText;
  }
  return "";
}

const CustomLinkComponent = React.forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement>
>(({ className, children, ...props }, ref) => {
  return (
    <a
      ref={ref}
      className={clsx(styles.link, getVariantClass(children), className)}
      {...props}
    >
      {children}
    </a>
  );
});

export const InternalLink = createLink(CustomLinkComponent);

export type ExternalLinkProps = Omit<JSX.IntrinsicElements["a"], "href"> & {
  href: string;
};

export function ExternalLink({
  children,
  className,
  rel,
  ...props
}: ExternalLinkProps) {
  return (
    <a
      className={clsx(styles.link, getVariantClass(children), className)}
      target="_blank"
      rel={rel ?? "noreferrer noopener"}
      {...props}
    >
      {children}
    </a>
  );
}
