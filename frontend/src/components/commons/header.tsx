import { route } from "preact-router";
import styles from "@/styles/components/commons/header.module.css";
import { Button, DangerButton } from "@/components/commons/button";
import { getGuild } from "@/utils/guild";

type PageView = "home" | "guild" | "member" | "preset";

interface HeaderProps {
  currentPage: PageView;
  showNav?: boolean;
  onLogout?: () => void;
}

export function Header({ currentPage, showNav = true, onLogout }: HeaderProps) {
  const handleNavigate = (path: string) => {
    route(path);
  };

  const selectedGuild = getGuild();

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <div
          className={styles.headerLogo}
          onClick={() => handleNavigate("/guild")}
        >
          <span className={styles.headerIcon}>🎮</span>
          <span className={styles.headerText}>Trader</span>
          {selectedGuild && (
            <span className={styles.headerGuild}>{selectedGuild.name}</span>
          )}
        </div>

        {showNav && (
          <nav className={styles.headerNav}>
            <Button
              variantIntent={currentPage === "guild" ? "primary" : "secondary"}
              variantSize="small"
              onClick={() => handleNavigate("/guild")}
            >
              길드
            </Button>
            <Button
              variantIntent={currentPage === "member" ? "primary" : "secondary"}
              variantSize="small"
              onClick={() => handleNavigate("/member")}
            >
              멤버 관리
            </Button>
            <Button
              variantIntent={currentPage === "preset" ? "primary" : "secondary"}
              variantSize="small"
              onClick={() => handleNavigate("/preset")}
            >
              프리셋 관리
            </Button>
            {onLogout && (
              <DangerButton variantSize="small" onClick={onLogout}>
                로그아웃
              </DangerButton>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
