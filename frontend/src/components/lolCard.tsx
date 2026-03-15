import { Section } from "@/components/section";
import { Toggle } from "@/components/toggle";
import type { LolStatDto } from "@/dto";
import styles from "@/styles/components/lolCard.module.css";

interface LolCardProps {
  lolStatDto: LolStatDto;
}

export function LolCard({ lolStatDto }: LolCardProps) {
  return (
    <Section variantType="secondary">
      <Section variantTone="ghost" variantType="secondary">
        <h4 className={styles.gameTitle}>League of Legends</h4>
        <Toggle variantColor={"blue"} variantActive={true} onClick={() => {}}>
          {lolStatDto.tier !== "Unranked"
            ? `${lolStatDto.tier} ${lolStatDto.rank} ${lolStatDto.lp}LP`
            : "Unranked"}
        </Toggle>
      </Section>
      {lolStatDto.topChampions && (
        <Section variantTone="ghost" variantType="secondary">
          {lolStatDto.topChampions.map((champion, index) => (
            <Section key={index} variantType="tertiary">
              <Section
                variantTone="ghost"
                variantType="primary"
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
                  variantType="tertiary"
                  className={styles.infoSection}
                >
                  <span className={styles.championName}>{champion.name}</span>
                  <Section
                    variantTone="ghost"
                    variantLayout="row"
                    variantType="tertiary"
                  >
                    <Toggle
                      variantColor="gold"
                      variantActive={true}
                      onClick={() => {}}
                    >{`${champion.games} 게임`}</Toggle>
                    <Toggle
                      variantColor="red"
                      variantActive={true}
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
