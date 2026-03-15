import { useMutation, useQuery, useQueryClient } from "@tanstack/preact-query";
import type { User, ApiResponse } from "@/dto";
import { USER_API_ENDPOINT } from "@/env";
import { getAuthHeadersForMutation } from "@/utils/auth";
import { toCamelCase, toSnakeCase } from "@/utils/dto";

export const userApi = {
  getAll: async (): Promise<User[]> => {
    const response = await fetch(`${USER_API_ENDPOINT}/`);
    if (!response.ok) throw new Error("Failed to fetch users");
    const json: ApiResponse<any[]> = await response.json();
    return toCamelCase<User[]>(json.data);
  },

  getById: async (userId: number): Promise<User> => {
    const response = await fetch(`${USER_API_ENDPOINT}/${userId}`);
    if (!response.ok) throw new Error("Failed to fetch user");
    const json: ApiResponse<any> = await response.json();
    return toCamelCase<User>(json.data);
  },

  add: async (data: {
    name: string;
    riotId: string;
    discordId: string;
  }): Promise<User> => {
    const response = await fetch(`${USER_API_ENDPOINT}/`, {
      method: "POST",
      headers: getAuthHeadersForMutation(),
      body: JSON.stringify(toSnakeCase(data)),
    });
    if (!response.ok) throw new Error("Failed to add user");
    const json: ApiResponse<any> = await response.json();
    return toCamelCase<User>(json.data);
  },

  update: async (
    userId: number,
    data: Partial<{
      name: string;
      riotId: string;
      discordId: string;
    }>,
  ): Promise<User> => {
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
    const json: ApiResponse<any> = await response.json();
    return toCamelCase<User>(json.data);
  },

  delete: async (userId: number): Promise<void> => {
    const response = await fetch(`${USER_API_ENDPOINT}/${userId}`, {
      method: "DELETE",
      headers: getAuthHeadersForMutation(),
    });
    if (!response.ok) throw new Error("Failed to delete user");
  },

  updateDiscordProfile: async (userId: number): Promise<User> => {
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
    const json: ApiResponse<any> = await response.json();
    return toCamelCase<User>(json.data);
  },
};

export const useUsers = () => {
  return useQuery({
    queryKey: ["users"],
    queryFn: userApi.getAll,
  });
};

export const useUser = (userId: number) => {
  return useQuery({
    queryKey: ["users", userId],
    queryFn: () => userApi.getById(userId),
    enabled: !!userId,
  });
};

export const useAddUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.add,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: number;
      data: Partial<{
        name: string;
        riotId: string;
        discordId: string;
      }>;
    }) => userApi.update(userId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users", variables.userId] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.delete,
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.removeQueries({ queryKey: ["users", userId] });
      queryClient.invalidateQueries({ queryKey: ["preset"] });
    },
  });
};

export const useUpdateDiscordProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.updateDiscordProfile,
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users", userId] });
    },
  });
};
