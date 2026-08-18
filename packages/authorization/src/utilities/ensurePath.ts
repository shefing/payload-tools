/* eslint-disable @typescript-eslint/no-explicit-any */

// Segments that would walk out of `obj` and into `Object.prototype`, turning a
// nested-object helper into a prototype-pollution primitive (CWE-1321).
const UNSAFE_PATH_SEGMENTS = new Set(['__proto__', 'constructor', 'prototype']);

export function ensurePath(obj: any, path: any[]) {
  return path.reduce((acc, key) => {
    const segment = String(key);

    if (UNSAFE_PATH_SEGMENTS.has(segment)) {
      throw new Error(`ensurePath: refusing unsafe path segment "${segment}"`);
    }

    // Own properties only — an inherited value must not be traversed or mutated.
    if (!Object.prototype.hasOwnProperty.call(acc, segment) || acc[segment] == null) {
      acc[segment] = {};
    }

    return acc[segment];
  }, obj);
}
