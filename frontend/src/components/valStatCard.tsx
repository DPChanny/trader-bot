import { Section } from "@/components/section";
import { Toggle } from "@/components/toggle";
import type { ValStatDto } from "@/dto";
import styles from "@/styles/components/valCard.module.css";

interface ValStatCardProps {
  valStatDto: ValStatDto;
}

export function ValStatCard({ valStatDto }: ValStatCardProps) {
  return (
    <Section variantIntent="secondary">
      <Section variantTone="ghost" variantIntent="secondary">
        <h4 className={styles.gameTitle}>VALORANT</h4>
        <Toggle variantColor={"blue"} isActive={true} onClick={() => {}}>
          {valStatDto.tier !== "Unranked"
            ? `${valStatDto.tier} ${valStatDto.rank}`.trim()
            : "Unranked"}
        </Toggle>
      </Section>
      {valStatDto.topAgents && (
        <Section variantTone="ghost" variantIntent="secondary">
          {valStatDto.topAgents.map((agent, index) => (
            <Section key={index} variantIntent="tertiary">
              <Section
                variantTone="ghost"
                variantIntent="primary"
                variantLayout="row"
                className={styles.agentSection}
              >
                <img
                  src={agent.iconUrl}
                  alt={agent.name}
                  className={styles.agentIcon}
                />
                <Section
                  variantTone="ghost"
                  variantIntent="tertiary"
                  className={styles.infoSection}
                >
                  <span className={styles.agentName}>{agent.name}</span>
                  <Section
                    variantTone="ghost"
                    variantLayout="row"
                    variantIntent="tertiary"
                  >
                    <Toggle
                      variantColor="gold"
                      isActive={true}
                      onClick={() => {}}
                    >{`${agent.games} 게임`}</Toggle>
                    <Toggle
                      variantColor="red"
                      isActive={true}
                      onClick={() => {}}
                    >
                      {`승률 ${agent.winRate.toFixed(1)}%`}
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
