import { useParams } from "@tanstack/react-router";
import { useState } from "react";
import { Row, Scroll } from "@components/atoms/layout";
import {
  SecondarySection,
  TertiarySection,
} from "@components/surfaces/section";
import { PrimaryButton } from "@components/atoms/button";
import { CreatePresetModal } from "./createPresetModal";
import { PresetCard } from "./presetCard";
import { usePresets } from "@features/preset/hook";
import { Role } from "@features/member/dto";
import { useVerifyRole } from "@features/member/hook";
import { Plan } from "@features/subscription/dto";
import {
  Quota,
  useVerifyPlan,
  useVerifyQuota,
} from "@features/subscription/hook";

import { Title } from "@components/atoms/text";

interface PresetListProps {
  selectedPresetId: number | null;
}

export function PresetList({ selectedPresetId }: PresetListProps) {
  const { guildId } = useParams({ strict: false }) as { guildId: string };
  const [showCreate, setShowCreate] = useState(false);

  const presets = usePresets(guildId);
  const canCreate = useVerifyRole(guildId, Role.ADMIN);
  const hasPlan = useVerifyPlan(guildId, Plan.PLUS);
  const hasQuota = useVerifyQuota(
    guildId,
    Quota.PRESET_COUNT,
    (presets.data?.length ?? 0) + 1,
  );

  return (
    <SecondarySection fill minSize>
      <Row justify="between" align="center">
        <Title>프리셋 관리</Title>
        {canCreate && (
          <PrimaryButton
            disabled={!hasPlan || !hasQuota}
            onClick={() => setShowCreate(true)}
          >
            생성
          </PrimaryButton>
        )}
      </Row>
      <TertiarySection fill minSize>
        <Scroll axis="y">
          {(presets.data ?? []).map((preset) => (
            <PresetCard
              key={preset.presetId}
              preset={preset}
              isSelected={selectedPresetId === preset.presetId}
            />
          ))}
        </Scroll>
      </TertiarySection>

      {showCreate && <CreatePresetModal onClose={() => setShowCreate(false)} />}
    </SecondarySection>
  );
}
