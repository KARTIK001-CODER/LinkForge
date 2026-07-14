export function paramToString(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0];
  return param ?? '';
}

export function ensureString(value: string | string[] | undefined | null): string {
  if (value == null) return '';
  if (Array.isArray(value)) return value[0] ?? '';
  return value;
}
