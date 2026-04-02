import { useMutation, useQuery, useQueryClient } from "@tanstack/preact-query";
import type { UserDTO } from "@/dtos";
import { USER_API_ENDPOINT } from "@/env";
import { getAuthHeadersForMutation } from "@/utils/auth";
import { toCamelCase, toSnakeCase } from "@/utils/dto";
import { handleHttpError } from "@/utils/hook";

interface AddUserData {
  alias?: string | null;
  riotId?: string | null;
  discordId?: string | null;
}

interface UpdateUserData {
  alias?: string | null;
  riotId?: string | null;
  discordId?: string | null;
}

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async (): Promise<UserDTO[]> => {
      const response = await fetch(`${USER_API_ENDPOINT}`);
      if (!response.ok) await handleHttpError(response);
      const json = await response.json();
      return toCamelCase<UserDTO[]>(json);
    },
  });
}

export function useUser(userId: number) {
  return useQuery({
    queryKey: ["users", userId],
    queryFn: async (): Promise<UserDTO> => {
      const response = await fetch(`${USER_API_ENDPOINT}/${userId}`);
      if (!response.ok) await handleHttpError(response);
      const json = await response.json();
      return toCamelCase<UserDTO>(json);
    },
    enabled: !!userId,
  });
}

export function useAddUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AddUserData): Promise<UserDTO> => {
      const response = await fetch(`${USER_API_ENDPOINT}`, {
        method: "POST",
        headers: getAuthHeadersForMutation(),
        body: JSON.stringify(toSnakeCase(data)),
      });
      if (!response.ok) await handleHttpError(response);
      const json = await response.json();
      return toCamelCase<UserDTO>(json);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      data,
    }: {
      userId: number;
      data: UpdateUserData;
    }): Promise<UserDTO> => {
      const response = await fetch(`${USER_API_ENDPOINT}/${userId}`, {
        method: "PATCH",
        headers: getAuthHeadersForMutation(),
        body: JSON.stringify(toSnakeCase(data)),
      });
      if (!response.ok) await handleHttpError(response);
      const json = await response.json();
      return toCamelCase<UserDTO>(json);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users", variables.userId] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: number): Promise<void> => {
      const response = await fetch(`${USER_API_ENDPOINT}/${userId}`, {
        method: "DELETE",
        headers: getAuthHeadersForMutation(),
      });
      if (!response.ok) await handleHttpError(response);
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.removeQueries({ queryKey: ["users", userId] });
      queryClient.invalidateQueries({ queryKey: ["preset"] });
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: number): Promise<UserDTO> => {
      const response = await fetch(`${USER_API_ENDPOINT}/${userId}/profile`, {
        method: "POST",
        headers: getAuthHeadersForMutation(),
      });
      if (!response.ok) await handleHttpError(response);
      const json = await response.json();
      return toCamelCase<UserDTO>(json);
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users", userId] });
    },
  });
}
