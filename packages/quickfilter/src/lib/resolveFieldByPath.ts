import type { ClientField, FieldAffectingData } from 'payload';

export interface ResolvedField {
  /** The resolved leaf field definition */
  field: ClientField;
  /** The dotted path to use as the where clause key (numeric indices removed) */
  path: string;
}

/**
 * Resolves a dotted-path string against a field tree, walking through
 * group, array, and blocks containers. Skips numeric path segments.
 * Returns null if any segment cannot be resolved or if the path is empty.
 *
 * **Blocks ambiguity:** When a blocks field contains multiple block definitions
 * with the same field name, the resolver returns the first match found
 * (iterating blocks in declaration order). This is intentional — the filter
 * widget only needs the leaf field's type and options, which should be
 * consistent across blocks sharing the same field name.
 */
export function resolveFieldByPath(
  fields: ClientField[],
  dottedPath: string,
): ResolvedField | null {
  if (!dottedPath || !fields || fields.length === 0) {
    return null;
  }

  const segments = dottedPath.split('.');
  if (segments.length === 0) {
    return null;
  }

  // Filter out numeric segments for the output path, but keep them for walking
  const nonNumericSegments: string[] = [];
  let currentFields = fields;
  let resolvedField: ClientField | null = null;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];

    // Skip numeric segments (array indices like "0", "1", etc.)
    if (/^\d+$/.test(segment)) {
      continue;
    }

    nonNumericSegments.push(segment);

    // Find the field matching this segment at the current level
    const matchedField = findFieldAtLevel(currentFields, segment);

    if (!matchedField) {
      return null;
    }

    // If this is the last non-numeric segment, we've found our leaf
    const remainingNonNumeric = segments.slice(i + 1).filter((s) => !/^\d+$/.test(s));

    if (remainingNonNumeric.length === 0) {
      resolvedField = matchedField;
      break;
    }

    // Otherwise, descend into the container field
    const childFields = getChildFields(matchedField);
    if (!childFields) {
      return null;
    }
    currentFields = childFields;
  }

  if (!resolvedField) {
    return null;
  }

  // Path with only numeric segments would result in empty nonNumericSegments
  if (nonNumericSegments.length === 0) {
    return null;
  }

  return {
    field: resolvedField,
    path: nonNumericSegments.join('.'),
  };
}

/**
 * Finds a field by name at the current level of the field tree.
 * Also searches through layout-only containers (rows, collapsibles, tabs)
 * that don't contribute to the dotted path.
 */
function findFieldAtLevel(fields: ClientField[], name: string): ClientField | null {
  for (const field of fields) {
    // Direct name match
    if ('name' in field && (field as FieldAffectingData).name === name) {
      return field;
    }

    // Search through layout containers that don't add to the path
    if (
      (field.type === 'row' || field.type === 'collapsible') &&
      'fields' in field &&
      Array.isArray(field.fields)
    ) {
      const nested = findFieldAtLevel(field.fields, name);
      if (nested) return nested;
    }

    if (field.type === 'tabs' && 'tabs' in field && Array.isArray(field.tabs)) {
      for (const tab of field.tabs) {
        if ('fields' in tab && Array.isArray(tab.fields)) {
          const nested = findFieldAtLevel(tab.fields, name);
          if (nested) return nested;
        }
      }
    }
  }

  return null;
}

/**
 * Gets the child fields of a container field (group, array, blocks).
 * For blocks, returns a flattened array of all fields from all block definitions.
 */
function getChildFields(field: ClientField): ClientField[] | null {
  if (field.type === 'group' && 'fields' in field && Array.isArray(field.fields)) {
    return field.fields;
  }

  if (field.type === 'array' && 'fields' in field && Array.isArray(field.fields)) {
    return field.fields;
  }

  if (field.type === 'blocks' && 'blocks' in field && Array.isArray(field.blocks)) {
    // Flatten all block fields into a single searchable array
    const allBlockFields: ClientField[] = [];
    for (const block of field.blocks) {
      if ('fields' in block && Array.isArray(block.fields)) {
        allBlockFields.push(...block.fields);
      }
    }
    return allBlockFields.length > 0 ? allBlockFields : null;
  }

  return null;
}
