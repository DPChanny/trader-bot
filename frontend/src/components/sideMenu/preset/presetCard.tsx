import { Card } from "@components/surfaces/card";
import { InternalLink } from "@components/atoms/link";
import { Name } from "@components/atoms/text";
import type { PresetDTO } from "@features/preset/dto";
import { useParams } from "@tanstack/react-router";

type PresetCardProps = {
  preset: PresetDTO;
  isSelected?: boolean;
};

export function PresetCard({ preset, isSelected }: PresetCardProps) {
  const params = useParams({ strict: false });
  const guildId = params.guildId as string;
  return (
    <InternalLink
      to="/guild/$guildId/preset/$presetId"
      params={{ guildId, presetId: preset.presetId.toString() }}
      aria-current={isSelected ? "page" : undefined}
    >
      <Card direction="row" align="center" justify="center">
        <Name>{preset.name}</Name>
      </Card>
    </InternalLink>
  );
}
