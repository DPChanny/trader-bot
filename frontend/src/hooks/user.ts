import { useMutation, useQuery, useQueryClient } from "@tanstack/preact-query";
import type { User } from "@/dto";
import { USER_API_ENDPOINT } from "@/env";
import { getAuthHeadersForMutation } from "@/utils/auth";
import { toCamelCase, toSnakeCase } from "@/utils/dto";

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
    queryFn: async (): Promise<User[]> => {
      const response = await fetch(`${USER_API_ENDPOINT}`);
      if (!response.ok) throw new Error("Failed to fetch users");
      const json = await response.json();
      return toCamelCase<User[]>(json);
    },
  });
}

export function useUser(userId: number) {
  return useQuery({
    queryKey: ["users", userId],
    queryFn: async (): Promise<User> => {
      const response = await fetch(`${USER_API_ENDPOINT}/${userId}`);
      if (!response.ok) throw new Error("Failed to fetch user");
      const json = await response.json();
      return toCamelCase<User>(json);
    },
    enabled: !!userId,
  });
}

export function useAddUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AddUserData): Promise<User> => {
      const response = await fetch(`${USER_API_ENDPOINT}`, {
        method: "POST",
        headers: getAuthHeadersForMutation(),
        body: JSON.stringify(toSnakeCase(data)),
      });
      if (!response.ok) throw new Error("Failed to add user");
      const json = await response.json();
      return toCamelCase<User>(json);
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
    }): Promise<User> => {
      const response = await fetch(`${USER_API_ENDPOINT}/${userId}`, {
        method: "PATCH",
        headers: getAuthHeadersForMutation(),
        body: JSON.stringify(toSnakeCase(data)),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Update user failed:", response.status, errorText);
        throw new Error(`Failed to update user: ${response.status}`);
      }
      const json = await response.json();
      return toCamelCase<User>(json);
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
      if (!response.ok) throw new Error("Failed to delete user");
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.removeQueries({ queryKey: ["users", userId] });
      queryClient.invalidateQueries({ queryKey: ["preset"] });
    },
  });
}

export function useUpdateDiscordProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: number): Promise<User> => {
      const response = await fetch(
        `${USER_API_ENDPOINT}/${userId}/discord-profile`,
        {
          method: "POST",
          headers: getAuthHeadersForMutation(),
        },
      );
      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "Update discord profile failed:",
          response.status,
          errorText,
        );
        throw new Error(`Failed to update discord profile: ${response.status}`);
      }
      const json = await response.json();
      return toCamelCase<User>(json);
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users", userId] });
    },
  });
}
