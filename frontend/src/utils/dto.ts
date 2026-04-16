import { z } from "zod";

export const nameSchema = z.string().trim().min(1).max(256);

export const nullableNameSchema = z
  .string()
  .trim()
  .transform((v) => (v.length === 0 ? null : v))
  .pipe(nameSchema.nullable());

export const urlSchema = z
  .string()
  .trim()
  .min(1)
  .max(2048)
  .refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  });

export const nullableUrlSchema = z
  .string()
  .trim()
  .transform((v) => (v.length === 0 ? null : v))
  .pipe(urlSchema.nullable());

export function buildPatchDto<T extends object>(
  parsed: T,
  original: { [K in keyof T]?: unknown },
): Partial<T> | null {
  const dto: Partial<T> = {};
  for (const key of Object.keys(parsed) as (keyof T)[]) {
    if (parsed[key] !== original[key]) dto[key] = parsed[key];
  }
  return Object.keys(dto).length > 0 ? dto : null;
}

export function toCamelCase<T = any>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => toCamelCase(item)) as any;
  }

  if (typeof obj === "object" && obj.constructor === Object) {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) =>
        letter.toUpperCase(),
      );
      acc[camelKey] = toCamelCase(obj[key]);
      return acc;
    }, {} as any);
  }

  return obj;
}

export function toSnakeCase<T = any>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => toSnakeCase(item)) as any;
  }

  if (typeof obj === "object" && obj.constructor === Object) {
    return Object.keys(obj).reduce((acc, key) => {
      const snakeKey = key.replace(
        /[A-Z]/g,
        (letter) => `_${letter.toLowerCase()}`,
      );
      acc[snakeKey] = toSnakeCase(obj[key]);
      return acc;
    }, {} as any);
  }

  return obj;
}
