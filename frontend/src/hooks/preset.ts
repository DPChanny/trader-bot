import { useMutation, useQuery, useQueryClient } from "@tanstack/preact-query";
import type { Preset, PresetDetail, ApiResponse } from "@/dto";
import { PRESET_API_ENDPOINT } from "@/env";
import { getAuthHeadersForMutation } from "@/utils/auth";
import { toCamelCase, toSnakeCase } from "@/utils/dto";

interface AddPresetData {
  name: string;
  points: number;
  time: number;
  pointScale?: number;
  statistics?: string;
}

interface UpdatePresetData {
  name?: string;
  points?: number;
  time?: number;
  pointScale?: number;
  statistics?: string;
}

export function usePresets() {
  return useQuery({
    queryKey: ["presets"],
    queryFn: async (): Promise<Preset[]> => {
      const response = await fetch(`${PRESET_API_ENDPOINT}`);
      if (!response.ok) throw new Error("Failed to fetch presets");
      const json: ApiResponse<any[]> = await response.json();
      return toCamelCase<Preset[]>(json.data);
    },
  });
}

export function usePresetDetail(presetId: number | null) {
  return useQuery({
    queryKey: ["preset", presetId],
    queryFn: async (): Promise<PresetDetail | null> => {
      if (!presetId) return null;
      const response = await fetch(`${PRESET_API_ENDPOINT}/${presetId}`);
      if (!response.ok) throw new Error("Failed to fetch preset detail");
      const json: ApiResponse<any> = await response.json();
      return toCamelCase<PresetDetail>(json.data);
    },
    enabled: !!presetId,
  });
}

export function useAddPreset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AddPresetData): Promise<Preset> => {
      const response = await fetch(`${PRESET_API_ENDPOINT}`, {
        method: "POST",
        headers: getAuthHeadersForMutation(),
        body: JSON.stringify(toSnakeCase(data)),
      });
      if (!response.ok) throw new Error("Failed to add preset");
      const json: ApiResponse<any> = await response.json();
      return toCamelCase<Preset>(json.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["presets"] });
    },
  });
}

export function useUpdatePreset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      presetId,
      data,
    }: {
      presetId: number;
      data: UpdatePresetData;
    }): Promise<Preset> => {
      const response = await fetch(`${PRESET_API_ENDPOINT}/${presetId}`, {
        method: "PATCH",
        headers: getAuthHeadersForMutation(),
        body: JSON.stringify(toSnakeCase(data)),
      });
      if (!response.ok) throw new Error("Failed to update preset");
      const json: ApiResponse<any> = await response.json();
      return toCamelCase<Preset>(json.data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["presets"] });
      queryClient.invalidateQueries({
        queryKey: ["preset", variables.presetId],
      });
    },
  });
}

export function useDeletePreset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (presetId: number): Promise<void> => {
      const response = await fetch(`${PRESET_API_ENDPOINT}/${presetId}`, {
        method: "DELETE",
        headers: getAuthHeadersForMutation(),
      });
      if (!response.ok) throw new Error("Failed to delete preset");
    },
    onSuccess: (_, presetId) => {
      queryClient.invalidateQueries({ queryKey: ["presets"] });
      queryClient.removeQueries({ queryKey: ["preset", presetId] });
    },
  });
}
