import { Card } from "@/components/card";
import { Section } from "@/components/section";
import { Toggle } from "@/components/toggle";
import type { ChampionDto, LolStatDto } from "@/dto";
import styles from "@/styles/components/lolStat.module.css";

interface LolStatCardProps {
  champion: ChampionDto;
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
  lolStatDto: LolStatDto;
}

export function LolStat({ lolStatDto }: LolStatProps) {
  return (
    <Section variantIntent="secondary">
      <Section variantTone="ghost" variantLayout="row">
        <h4 className={styles.gameTitle}>League of Legends</h4>
        <Toggle variantColor="blue" isActive={true} onClick={() => {}}>
          {lolStatDto.tier !== "Unranked"
            ? `${lolStatDto.tier} ${lolStatDto.rank} ${lolStatDto.lp}LP`
            : "Unranked"}
        </Toggle>
      </Section>
      {lolStatDto.topChampions && lolStatDto.topChampions.length > 0 && (
        <Section variantTone="ghost">
          {lolStatDto.topChampions.map((champion, index) => (
            <LolStatCard key={index} champion={champion} />
          ))}
        </Section>
      )}
    </Section>
  );
}
