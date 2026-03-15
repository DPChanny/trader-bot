import { cva } from "class-variance-authority";
import { route } from "preact-router";
import styles from "@/styles/components/header.module.css";

type PageView = "home" | "user" | "preset";

const navItemVariants = cva(styles.navItem, {
  variants: {
    variantActive: {
      true: styles.navItemActive,
      false: "",
    },
  },
  defaultVariants: {
    variantActive: false,
  },
});

interface HeaderProps {
  currentPage: PageView;
  showNav?: boolean;
}

export function Header({ currentPage, showNav = true }: HeaderProps) {
  const handleNavigate = (path: string) => {
    route(path);
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.headerLogo} onClick={() => handleNavigate("/")}>
          <span className={styles.headerIcon}>🎮</span>
          <span className={styles.headerText}>Trader</span>
        </div>

        {showNav && (
          <nav className={styles.headerNav}>
            <button
              className={navItemVariants({
                variantActive: currentPage === "home",
              })}
              onClick={() => handleNavigate("/")}
            >
              홈
            </button>
            <button
              className={navItemVariants({
                variantActive: currentPage === "user",
              })}
              onClick={() => handleNavigate("/user")}
            >
              유저 관리
            </button>
            <button
              className={navItemVariants({
                variantActive: currentPage === "preset",
              })}
              onClick={() => handleNavigate("/preset")}
            >
              프리셋 관리
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
