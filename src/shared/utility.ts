export const entries = Object.entries as <T>(
  obj: T
) => Array<[keyof T, T[keyof T]]>;
export const keys = Object.keys as <T>(obj: T) => Array<keyof T>;
export const values = Object.values as <T>(obj: T) => Array<T[keyof T]>;
