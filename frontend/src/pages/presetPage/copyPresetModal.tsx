import { useParams } from "@tanstack/react-router";

import { Modal, ModalFooter } from "@components/modal";
import { SecondaryButton, Button } from "@components/atoms/button";
import { Error } from "@components/molecules/error";
import { Loading } from "@components/molecules/loading";
import { Card } from "@components/surfaces/card";
import { Image } from "@components/atoms/image";
import { Scroll } from "@components/atoms/layout";
import { TertiarySection } from "@components/surfaces/section";
import { Name } from "@components/atoms/text";
import { useGuilds } from "@features/guild/hook";
import type { GuildDetailDTO } from "@features/guild/dto";
import { useCopyPreset, usePresets } from "@features/preset/hook";
import { Role } from "@features/member/dto";
import { useVerifyRole } from "@features/member/hook";
import { Quota, useVerifyQuota } from "@features/subscription/hook";

interface CopyGuildButtonProps {
  guild: GuildDetailDTO;
  isPending: boolean;
  onSelect: (targetGuildId: string) => void;
}

function CopyGuildButton({ guild, isPending, onSelect }: CopyGuildButtonProps) {
  const presets = usePresets(guild.discordId);
  const canAdmin = useVerifyRole(guild.discordId, Role.ADMIN);
  const hasQuota = useVerifyQuota(
    guild.discordId,
    Quota.PRESET_COUNT,
    (presets.data?.length ?? 0) + 1,
  );

  return (
    <Button
      key={guild.discordId}
      variantTone="ghost"
      onClick={() => onSelect(guild.discordId)}
      disabled={isPending || !canAdmin || !hasQuota}
    >
      <Card direction="row" align="center" justify="center" fill>
        <Image src={guild.iconUrl} alt={guild.name} />
        <Name>{guild.name}</Name>
      </Card>
    </Button>
  );
}

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
              <CopyGuildButton
                key={guild.discordId}
                guild={guild}
                isPending={copyPreset.isPending}
                onSelect={handleSelectGuild}
              />
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
