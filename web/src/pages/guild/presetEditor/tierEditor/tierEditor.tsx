import { useState } from "preact/hooks";
import { useDeleteTier, useUpdateTier } from "@/hooks/tier";
import { Error } from "@/components/commons/error";
import { PrimaryButton } from "@/components/commons/button";
import { Bar } from "@/components/commons/bar";
import { AddTierModal } from "./addTierModal";
import { ConfirmModal } from "@/components/commons/modal";
import { TierCard } from "./tierCard";
import styles from "@/styles/pages/preset/tier/tierList.module.css";
import { Section } from "@/components/commons/section";
import type { TierDTO } from "@/dtos/tierDto";

interface TierEditorProps {
  guildId: string;
  presetId: number;
  tiers: TierDTO[];
}

export function TierEditor({ guildId, presetId, tiers }: TierEditorProps) {
  const [showTierForm, setShowTierForm] = useState(false);
  const [editingTierId, setEditingTierId] = useState<number | null>(null);
  const [editingTierName, setEditingTierName] = useState("");
  const [editingTierIconUrl, setEditingTierIconUrl] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const updateTier = useUpdateTier();
  const deleteTier = useDeleteTier();

  const handleUpdateTierName = async (tierId: number) => {
    if (!editingTierName.trim() || !guildId || !presetId) return;
    try {
      await updateTier.mutateAsync({
        guildId,
        presetId,
        tierId,
        dto: {
          name: editingTierName.trim(),
          iconUrl:
            editingTierIconUrl.trim() === "" ? null : editingTierIconUrl.trim(),
        },
      });
      setEditingTierId(null);
      setEditingTierName("");
      setEditingTierIconUrl("");
    } catch (err) {
      console.error("Failed to update tier:", err);
    }
  };

  const handleDeleteTier = async () => {
    if (deleteTargetId === null || !guildId || !presetId) return;
    try {
      await deleteTier.mutateAsync({
        guildId,
        presetId,
        tierId: deleteTargetId,
      });
      setShowDeleteConfirm(false);
      setDeleteTargetId(null);
    } catch (err) {
      console.error("Failed to delete tier:", err);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <Section variantTone="ghost" variantIntent="secondary">
      <Section variantTone="ghost" variantLayout="row">
        <h3>티어 목록</h3>
        <PrimaryButton onClick={() => setShowTierForm(true)}>
          추가
        </PrimaryButton>
      </Section>
      <Bar />
      {(updateTier.isError || deleteTier.isError) && (
        <Error detail={(updateTier.error || deleteTier.error)?.message}>
          티어 작업 중 오류가 발생했습니다.
        </Error>
      )}

      <Section
        variantTone="ghost"
        variantLayout="row"
        variantIntent="secondary"
        className={styles.tierList}
      >
        {tiers?.map((tier) => (
          <TierCard
            key={tier.tierId}
            tier={tier}
            isEditing={editingTierId === tier.tierId}
            editingName={editingTierName}
            editingIconUrl={editingTierIconUrl}
            onEditingNameChange={setEditingTierName}
            onEditingIconUrlChange={setEditingTierIconUrl}
            onEdit={() => {
              setEditingTierId(tier.tierId);
              setEditingTierName(tier.name);
              setEditingTierIconUrl(tier.iconUrl || "");
            }}
            onSave={() => handleUpdateTierName(tier.tierId)}
            onCancelEdit={() => {
              setEditingTierId(null);
              setEditingTierName("");
              setEditingTierIconUrl("");
            }}
            onDelete={() => {
              setDeleteTargetId(tier.tierId);
              setShowDeleteConfirm(true);
            }}
            isUpdatePending={updateTier.isPending}
            isDeletePending={deleteTier.isPending}
          />
        ))}
      </Section>

      <AddTierModal
        guildId={guildId}
        presetId={presetId}
        isOpen={showTierForm}
        onClose={() => setShowTierForm(false)}
      />
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteTargetId(null);
        }}
        onConfirm={handleDeleteTier}
        title="티어 삭제"
        message="정말 이 티어를 삭제하시겠습니까?"
        confirmText="삭제"
        isPending={deleteTier.isPending}
      />
    </Section>
  );
}
