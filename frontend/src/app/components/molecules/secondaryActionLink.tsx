import { Link, type LinkProps } from "@components/atoms/link";
import { clsx } from "clsx";
import styles from "@styles/components/molecules/secondaryActionLink.module.css";

export function SecondaryActionLink({ className, ...props }: LinkProps) {
  return <Link className={clsx(styles.actionLink, className)} {...props} />;
}
