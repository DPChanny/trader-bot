export interface TierDTO {
  tierId: number;
  presetId: number;
  name: string;
}

export interface AddTierDTO {
  name: string;
}

export interface UpdateTierDTO {
  name: string;
}
