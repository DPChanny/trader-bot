export interface PresetDTO {
  presetId: number;
  guildId: string;
  name: string;
  points: number;
  timer: number;
  teamSize: number;
  pointScale: number;
}

export interface AddPresetDTO {
  name: string;
  points: number;
  timer: number;
  teamSize: number;
  pointScale: number;
}

export interface UpdatePresetDTO {
  name?: string;
  points?: number;
  timer?: number;
  teamSize?: number;
  pointScale?: number;
}
