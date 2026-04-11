import { useState } from "preact/hooks";
import { useDeleteTier, useTiers, useUpdateTier } from "@/hooks/tier";
import { Loading } from "@/components/commons/loading";
import { Error } from "@/components/commons/error";
import { PrimaryButton } from "@/components/commons/button";
import { Bar } from "@/components/commons/bar";
import { AddTierModal } from "./addTierModal";
import { EditTierModal } from "./editTierModal";
import { ConfirmModal } from "@/components/commons/modal";
import { TierCard } from "./tierCard";
import styles from "@/styles/pages/guild/presetEditor/tierEditor/tierList.module.css";
import { Section } from "@/components/commons/section";
import type { TierDTO } from "@/dtos/tierDto";

interface TierEditorProps {
  guildId: string;
  presetId: number;
}

export function TierEditor({ guildId, presetId }: TierEditorProps) {
  const [showTierForm, setShowTierForm] = useState(false);
  const [editingTier, setEditingTier] = useState<TierDTO | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const { data: tiers, isLoading, error } = useTiers(guildId, presetId);
  const updateTier = useUpdateTier();
  const deleteTier = useDeleteTier();

  const handleUpdateTier = async (name: string, iconUrl: string | null) => {
    if (!editingTier || !guildId || !presetId) return;
    try {
      await updateTier.mutateAsync({
        guildId,
        presetId,
        tierId: editingTier.tierId,
        dto: { name, iconUrl },
      });
      setEditingTier(null);
      updateTier.reset();
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
      {isLoading && <Loading />}
      {error && (
        <Error detail={error?.message}>
          티어 목록을 불러오는데 실패했습니다.
        </Error>
      )}
      {deleteTier.isError && (
        <Error detail={deleteTier.error?.message}>
          티어 작업 중 오류가 발생했습니다.
        </Error>
      )}

      <Section
        variantTone="ghost"
        variantLayout="column"
        variantIntent="secondary"
        className={styles.tierList}
      >
        {tiers?.map((tier) => (
          <TierCard
            key={tier.tierId}
            tier={tier}
            onEdit={() => setEditingTier(tier)}
            onDelete={() => {
              setDeleteTargetId(tier.tierId);
              setShowDeleteConfirm(true);
            }}
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
      <EditTierModal
        tier={editingTier}
        onClose={() => {
          setEditingTier(null);
          updateTier.reset();
        }}
        onSubmit={handleUpdateTier}
        isPending={updateTier.isPending}
        error={updateTier.isError ? updateTier.error : undefined}
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
