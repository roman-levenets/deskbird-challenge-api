export const nullify = <T>(value: T | undefined | null | ''): T | null => {
  if (value === undefined || value === null || value === '') return null;
  return value;
};
