import { clsx } from "clsx";
import styles from "@styles/components/atoms/link.module.css";
import type { JSX } from "react";
import { useNavigate } from "@tanstack/react-router";

function getVariantClass(children: JSX.Element["props"]["children"]) {
  if (typeof children === "string" || typeof children === "number") {
    return styles.contentText;
  }
  return "";
}

export type InternalLinkProps = Omit<
  JSX.IntrinsicElements["a"],
  "href" | "target" | "rel" | "download"
> & {
  href: string;
};

export function InternalLink({
  children,
  className,
  href,
  ...props
}: InternalLinkProps) {
  const navigate = useNavigate();

  const handleClick: NonNullable<InternalLinkProps["onClick"]> = (e) => {
    props.onClick?.(e);
    if (e.defaultPrevented) return;
    if (e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    e.preventDefault();
    navigate({ to: href });
  };

  return (
    <a
      className={clsx(styles.link, getVariantClass(children), className)}
      href={href}
      {...props}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}

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
