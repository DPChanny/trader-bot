import { useParams } from "@tanstack/react-router";

import { Modal, ModalFooter } from "@components/modal";
import { SecondaryButton } from "@components/atoms/button";
import { PressedButton } from "@components/atoms/button";
import { Error } from "@components/molecules/error";
import { Loading } from "@components/molecules/loading";
import { Card } from "@components/surfaces/card";
import { Image } from "@components/atoms/image";
import { Scroll } from "@components/atoms/layout";
import { TertiarySection } from "@components/surfaces/section";
import { Name } from "@components/atoms/text";
import { useGuilds } from "@features/guild/hook";
import { useCopyPreset } from "@features/preset/hook";

interface CopyPresetModalProps {
  onClose: () => void;
}

export function CopyPresetModal({ onClose }: CopyPresetModalProps) {
  const { guildId } = useParams({ strict: false }) as { guildId: string };
  const { presetId: presetIdStr } = useParams({ strict: false }) as {
    presetId: string;
  };
  const presetId = parseInt(presetIdStr, 10);
  const guilds = useGuilds();
  const copyPreset = useCopyPreset();

  const handleSelectGuild = (targetGuildId: string) => {
    if (copyPreset.isPending) return;
    copyPreset.mutate(
      { guildId, presetId, targetGuildId },
      { onSuccess: onClose },
    );
  };

  const handleClose = () => {
    if (copyPreset.isPending) return;
    onClose();
  };

  return (
    <Modal onClose={handleClose} title="복사할 서버 선택">
      {copyPreset.error && (
        <Error error={copyPreset.error}>프리셋 복사에 실패했습니다</Error>
      )}
      <TertiarySection>
        <Scroll axis="y">
          {guilds.isLoading ? (
            <Loading />
          ) : guilds.error ? (
            <Error error={guilds.error}>서버 목록을 불러오지 못했습니다</Error>
          ) : (
            (guilds.data ?? []).map((guild) => (
              <PressedButton
                key={guild.discordId}
                onClick={() => handleSelectGuild(guild.discordId)}
                disabled={copyPreset.isPending}
              >
                <Card direction="row" align="center" justify="center" fill>
                  <Image src={guild.iconUrl} alt={guild.name} />
                  <Name>{guild.name}</Name>
                </Card>
              </PressedButton>
            ))
          )}
        </Scroll>
      </TertiarySection>
      <ModalFooter>
        <SecondaryButton onClick={handleClose} disabled={copyPreset.isPending}>
          취소
        </SecondaryButton>
      </ModalFooter>
    </Modal>
  );
}
