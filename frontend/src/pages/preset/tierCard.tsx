import {
  CloseButton,
  DeleteButton,
  EditButton,
  SaveButton,
} from "@/components/button";
import { Badge } from "@/components/badge";
import { Input } from "@/components/input";
import { Section } from "@/components/section";
import type { Tier } from "@/dto";
import styles from "@/styles/pages/preset/tierCard.module.css";

interface TierCardProps {
  tier: Tier;
  isEditing: boolean;
  editingName: string;
  onEditingNameChange: (name: string) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  isUpdatePending: boolean;
  isDeletePending: boolean;
}

export function TierCard({
  tier,
  isEditing,
  editingName,
  onEditingNameChange,
  onEdit,
  onSave,
  onCancelEdit,
  onDelete,
  isUpdatePending,
  isDeletePending,
}: TierCardProps) {
  return (
    <Section variantIntent="tertiary" variantLayout="row" className={styles.card}>
      {isEditing ? (
        <>
          <Input
            value={editingName}
            onChange={onEditingNameChange}
            onKeyPress={(e) => e.key === "Enter" && onSave()}
            variantSize="small"
          />
          <Section
            variantTone="ghost"
            variantLayout="row"
            variantIntent="tertiary"
          >
            <SaveButton
              variantSize="small"
              onClick={onSave}
              disabled={
                isUpdatePending ||
                editingName.trim() === tier.name ||
                !editingName.trim()
              }
            />
            <CloseButton variantSize="small" onClick={onCancelEdit} />
          </Section>
        </>
      ) : (
        <>
          <Badge variantColor="red" variantSize="large">
            {tier.name.charAt(0)}
          </Badge>
          <EditButton variantSize="small" onClick={onEdit} />
          <DeleteButton
            variantSize="small"
            disabled={isDeletePending}
            onClick={onDelete}
          />
        </>
      )}
    </Section>
  );
}
