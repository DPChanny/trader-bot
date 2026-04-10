export interface TierDTO {
  tierId: number;
  presetId: number;
  name: string;
  iconUrl: string | null;
}

export interface AddTierDTO {
  name: string;
  iconUrl: string | null;
}

export interface UpdateTierDTO {
  name?: string;
  iconUrl?: string | null;
}
