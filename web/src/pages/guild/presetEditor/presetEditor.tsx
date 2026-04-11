import { useAddAuction } from "@/hooks/auction";
import { usePresetMembers } from "@/hooks/presetMember";
import { TierEditor } from "./tierEditor/tierEditor";
import { PositionEditor } from "./positionEditor/positionEditor";
import { PresetMemberEditor } from "./presetMemberEditor/presetMemberEditor";
import { Section } from "@/components/commons/section";
import { PageContainer, PageLayout } from "@/components/commons/page";
import { PrimaryButton } from "@/components/commons/button";
import { Bar } from "@/components/commons/bar";
import { Error } from "@/components/commons/error";
import styles from "@/styles/pages/guild/presetEditor/presetEditor.module.css";

interface PresetEditorProps {
  guildId: string;
  presetId: number | null;
}

export function PresetEditor({ guildId, presetId }: PresetEditorProps) {
  const addAuction = useAddAuction();
  const { data: presetMembers } = usePresetMembers(guildId, presetId);

  const leaderCount = presetMembers?.filter((pm) => pm.isLeader).length ?? 0;
  const memberCount = presetMembers?.length ?? 0;
  const requiredMembers = leaderCount * 5;
  const canStartAuction = leaderCount >= 2;

  let presetValidMessage = "";
  if (presetId && presetMembers) {
    if (leaderCount < 2) {
      presetValidMessage = `현재 팀장 인원(${leaderCount}명)이 최소 인원(2명)보다 적습니다.`;
    } else if (memberCount < requiredMembers) {
      presetValidMessage = `현재 인원(${memberCount}명)이 권장 인원(${requiredMembers}명)보다 적습니다.`;
    }
  }

  const handleStartAuction = async () => {
    if (!presetId) return;
    try {
      await addAuction.mutateAsync(presetId);
    } catch {}
  };

  return (
    <PageLayout>
      <PageContainer>
        <Section variantIntent="primary" className={styles.panelSection}>
          {presetId ? (
            <>
              <Section variantIntent="secondary" className={styles.tierSection}>
                <TierEditor guildId={guildId} presetId={presetId} />
              </Section>
              <Section
                variantIntent="secondary"
                className={styles.positionSection}
              >
                <PositionEditor guildId={guildId} presetId={presetId} />
              </Section>
            </>
          ) : null}
          <Bar />
          <Section variantTone="ghost" variantIntent="secondary">
            <PrimaryButton
              onClick={handleStartAuction}
              disabled={
                addAuction.isPending ||
                !canStartAuction ||
                !presetId ||
                !presetMembers
              }
            >
              {addAuction.isPending ? "경매 생성 중" : "경매 생성"}
            </PrimaryButton>
            {presetValidMessage && <Error>{presetValidMessage}</Error>}
            {addAuction.isError && (
              <Error detail={addAuction.error?.message}>
                경매를 시작하는데 실패했습니다.
              </Error>
            )}
          </Section>
        </Section>

        <Section variantIntent="primary" className={styles.presetDetailSection}>
          {presetId ? (
            <PresetMemberEditor guildId={guildId} presetId={presetId} />
          ) : (
            <div />
          )}
        </Section>
      </PageContainer>
    </PageLayout>
  );
}
