/**
 * Safely extracts a display string from a Payload field label.
 * The label can be a plain string, an i18n object ({ en: 'Color', ... }),
 * false, or undefined.
 */
export function getLabelString(
  label: string | Record<string, string> | false | undefined,
  fallback = 'Color',
): string {
  if (typeof label === 'string') return label
  if (label && typeof label === 'object') {
    return (Object.values(label)[0] as string) ?? fallback
  }
  return fallback
}
