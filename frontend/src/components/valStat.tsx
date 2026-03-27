import { Card } from "@/components/card";
import { Section } from "@/components/section";
import { Toggle } from "@/components/toggle";
import type { AgentDTO, ValStatDTO } from "@/dto";
import styles from "@/styles/components/valStat.module.css";

interface ValStatCardProps {
  agent: AgentDTO;
}

export function ValStatCard({ agent }: ValStatCardProps) {
  return (
    <Card variantColor="blue" variantLayout="row" className={styles.agentCard}>
      <img src={agent.iconUrl} alt={agent.name} className={styles.agentIcon} />
      <Section variantTone="ghost" className={styles.infoSection}>
        <span className={styles.agentName}>{agent.name}</span>
        <Section
          variantTone="ghost"
          variantLayout="row"
          className={styles.statsRow}
        >
          <Toggle variantColor="gold" isActive={true} onClick={() => {}}>
            {`${agent.games} 게임`}
          </Toggle>
          <Toggle variantColor="red" isActive={true} onClick={() => {}}>
            {`승률 ${agent.winRate.toFixed(1)}%`}
          </Toggle>
        </Section>
      </Section>
    </Card>
  );
}

interface ValStatProps {
  valStatDTO: ValStatDTO;
}

export function ValStat({ valStatDTO }: ValStatProps) {
  return (
    <Section variantIntent="secondary">
      <Section variantTone="ghost" variantLayout="row">
        <h4 className={styles.gameTitle}>VALORANT</h4>
        <Toggle variantColor="blue" isActive={true} onClick={() => {}}>
          {valStatDTO.tier !== "Unranked"
            ? `${valStatDTO.tier} ${valStatDTO.rank}`.trim()
            : "Unranked"}
        </Toggle>
      </Section>
      {valStatDTO.topAgents?.length > 0 && (
        <Section variantTone="ghost">
          {valStatDTO.topAgents.map((agent) => (
            <ValStatCard key={agent.name} agent={agent} />
          ))}
        </Section>
      )}
    </Section>
  );
}
