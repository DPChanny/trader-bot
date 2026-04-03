import { Card } from "@/components/commons/card";
import { Section } from "@/components/commons/section";
import { Toggle } from "@/components/commons/toggle";
import type { ChampionDTO, LolStatDTO } from "@/dtos/lolStatDto";
import styles from "@/styles/components/lolStat.module.css";

interface LolStatCardProps {
  champion: ChampionDTO;
}

export function LolStatCard({ champion }: LolStatCardProps) {
  return (
    <Card
      variantColor="blue"
      variantLayout="row"
      className={styles.championCard}
    >
      <img
        src={champion.iconUrl}
        alt={champion.name}
        className={styles.championIcon}
      />
      <Section variantTone="ghost" className={styles.infoSection}>
        <span className={styles.championName}>{champion.name}</span>
        <Section
          variantTone="ghost"
          variantLayout="row"
          className={styles.statsRow}
        >
          <Toggle variantColor="gold" isActive={true} onClick={() => {}}>
            {`${champion.games} 게임`}
          </Toggle>
          <Toggle variantColor="red" isActive={true} onClick={() => {}}>
            {`승률 ${champion.winRate.toFixed(1)}%`}
          </Toggle>
        </Section>
      </Section>
    </Card>
  );
}

interface LolStatProps {
  lolStatDTO: LolStatDTO;
}

export function LolStat({ lolStatDTO }: LolStatProps) {
  return (
    <Section variantIntent="secondary">
      <Section variantTone="ghost" variantLayout="row">
        <h4 className={styles.gameTitle}>League of Legends</h4>
        <Toggle variantColor="blue" isActive={true} onClick={() => {}}>
          {lolStatDTO.tier !== "Unranked"
            ? `${lolStatDTO.tier} ${lolStatDTO.rank} ${lolStatDTO.lp}LP`
            : "Unranked"}
        </Toggle>
      </Section>
      {lolStatDTO.topChampions?.length > 0 && (
        <Section variantTone="ghost">
          {lolStatDTO.topChampions.map((champion) => (
            <LolStatCard key={champion.name} champion={champion} />
          ))}
        </Section>
      )}
    </Section>
  );
}
