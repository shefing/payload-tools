/* eslint-disable @typescript-eslint/no-explicit-any */
export function ensurePath(obj: any, path: any[]) {
  return path.reduce((acc, key) => (acc[key] ??= {}), obj);
}
