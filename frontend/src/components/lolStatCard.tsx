import { Section } from "@/components/section";
import { Toggle } from "@/components/toggle";
import type { LolStatDto } from "@/dto";
import styles from "@/styles/components/lolCard.module.css";

interface LolStatCardProps {
  lolStatDto: LolStatDto;
}

export function LolStatCard({ lolStatDto }: LolStatCardProps) {
  return (
    <Section variantIntent="secondary">
      <Section variantTone="ghost" variantIntent="secondary">
        <h4 className={styles.gameTitle}>League of Legends</h4>
        <Toggle variantColor={"blue"} isActive={true} onClick={() => {}}>
          {lolStatDto.tier !== "Unranked"
            ? `${lolStatDto.tier} ${lolStatDto.rank} ${lolStatDto.lp}LP`
            : "Unranked"}
        </Toggle>
      </Section>
      {lolStatDto.topChampions && (
        <Section variantTone="ghost" variantIntent="secondary">
          {lolStatDto.topChampions.map((champion, index) => (
            <Section key={index} variantIntent="tertiary">
              <Section
                variantTone="ghost"
                variantIntent="primary"
                variantLayout="row"
                className={styles.championSection}
              >
                <img
                  src={champion.iconUrl}
                  alt={champion.name}
                  className={styles.championIcon}
                />
                <Section
                  variantTone="ghost"
                  variantIntent="tertiary"
                  className={styles.infoSection}
                >
                  <span className={styles.championName}>{champion.name}</span>
                  <Section
                    variantTone="ghost"
                    variantLayout="row"
                    variantIntent="tertiary"
                  >
                    <Toggle
                      variantColor="gold"
                      isActive={true}
                      onClick={() => {}}
                    >{`${champion.games} 게임`}</Toggle>
                    <Toggle
                      variantColor="red"
                      isActive={true}
                      onClick={() => {}}
                    >
                      {`승률 ${champion.winRate.toFixed(1)}%`}
                    </Toggle>
                  </Section>
                </Section>
              </Section>
            </Section>
          ))}
        </Section>
      )}
    </Section>
  );
}
