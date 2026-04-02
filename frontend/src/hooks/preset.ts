import { useMutation, useQuery, useQueryClient } from "@tanstack/preact-query";
import type { Preset, PresetDetail } from "@/dto";
import { GUILD_API_ENDPOINT } from "@/env";
import { getAuthHeaders, getAuthHeadersForMutation } from "@/utils/auth";
import { toCamelCase, toSnakeCase } from "@/utils/dto";
import { handleHttpError } from "@/utils/hook";

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

function presetEndpoint(guildId: number) {
  return `${GUILD_API_ENDPOINT}/${guildId}/preset`;
}

export function usePresets(guildId: number | null) {
  return useQuery({
    queryKey: ["presets", guildId],
    queryFn: async (): Promise<Preset[]> => {
      const response = await fetch(presetEndpoint(guildId!), {
        headers: getAuthHeaders(),
      });
      if (!response.ok) await handleHttpError(response);
      const json = await response.json();
      return toCamelCase<Preset[]>(json);
    },
    enabled: !!guildId,
  });
}

export function usePresetDetail(
  guildId: number | null,
  presetId: number | null,
) {
  return useQuery({
    queryKey: ["preset", guildId, presetId],
    queryFn: async (): Promise<PresetDetail | null> => {
      if (!guildId || !presetId) return null;
      const response = await fetch(`${presetEndpoint(guildId)}/${presetId}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) await handleHttpError(response);
      const json = await response.json();
      return toCamelCase<PresetDetail>(json);
    },
    enabled: !!guildId && !!presetId,
  });
}

export function useAddPreset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      guildId,
      data,
    }: {
      guildId: number;
      data: AddPresetData;
    }): Promise<Preset> => {
      const response = await fetch(presetEndpoint(guildId), {
        method: "POST",
        headers: getAuthHeadersForMutation(),
        body: JSON.stringify(toSnakeCase(data)),
      });
      if (!response.ok) await handleHttpError(response);
      const json = await response.json();
      return toCamelCase<Preset>(json);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["presets", variables.guildId],
      });
    },
  });
}

export function useUpdatePreset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      guildId,
      presetId,
      data,
    }: {
      guildId: number;
      presetId: number;
      data: UpdatePresetData;
    }): Promise<Preset> => {
      const response = await fetch(`${presetEndpoint(guildId)}/${presetId}`, {
        method: "PATCH",
        headers: getAuthHeadersForMutation(),
        body: JSON.stringify(toSnakeCase(data)),
      });
      if (!response.ok) await handleHttpError(response);
      const json = await response.json();
      return toCamelCase<Preset>(json);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["presets", variables.guildId],
      });
      queryClient.invalidateQueries({
        queryKey: ["preset", variables.guildId, variables.presetId],
      });
    },
  });
}

export function useDeletePreset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      guildId,
      presetId,
    }: {
      guildId: number;
      presetId: number;
    }): Promise<void> => {
      const response = await fetch(`${presetEndpoint(guildId)}/${presetId}`, {
        method: "DELETE",
        headers: getAuthHeadersForMutation(),
      });
      if (!response.ok) await handleHttpError(response);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["presets", variables.guildId],
      });
      queryClient.removeQueries({
        queryKey: ["preset", variables.guildId, variables.presetId],
      });
    },
  });
}
