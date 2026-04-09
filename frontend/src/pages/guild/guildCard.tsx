import { Card } from "@/components/commons/card";
import type { GuildDTO } from "@/dtos/guildDto";
import styles from "@/styles/pages/guild/guildCard.module.css";

interface GuildCardProps {
  guild: GuildDTO;
  isActive?: boolean;
  onClick: (guildId: string) => void;
}

export function GuildCard({ guild, isActive, onClick }: GuildCardProps) {
  return (
    <Card
      variantColor="blue"
      variantActive={isActive}
      className={styles.guildCard}
      onClick={() => onClick(guild.discordId)}
    >
      <div class={styles.inner}>
        <div class={styles.icon}>
          {guild.iconUrl ? (
            <img src={guild.iconUrl} alt={guild.name} />
          ) : (
            <svg
              class={styles.iconPlaceholder}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"
                fill="currentColor"
                opacity="0.5"
              />
            </svg>
          )}
        </div>
        <div class={styles.info}>
          <h3 class={styles.name}>{guild.name}</h3>
        </div>
      </div>
    </Card>
  );
}
