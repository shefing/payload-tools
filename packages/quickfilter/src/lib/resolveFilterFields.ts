import type { ClientField, FieldAffectingData, OptionObject, SelectField } from 'payload';
import type { FilterDetaild } from '../filters/types/filters-type';
import { resolveFieldByPath } from './resolveFieldByPath';

type FieldConfig = {
  field: string | { name: string; width: string; virtualName: string };
  rowIndex: number;
  fieldIndex: number;
};

/**
 * Resolves a list of filter field configs (flat names + dotted paths) against
 * a collection's field tree. Returns FilterDetaild entries in the original
 * declared order, skipping any that cannot be resolved.
 */
export function resolveFilterFields(
  flattenedFieldConfigs: FieldConfig[],
  collectionFields: ClientField[],
  translateLabel: (label: any) => string,
  findFieldsByName: (fields: ClientField[], names: string[]) => ClientField[],
): FilterDetaild[] {
  const fieldNames = flattenedFieldConfigs.map(({ field }) =>
    typeof field === 'string' ? field : field.virtualName ? field.virtualName : field.name,
  );

  // Separate dotted paths from flat names
  const flatFieldNames: string[] = [];
  const dottedPathEntries: { name: string; configIndex: number }[] = [];

  fieldNames.forEach((name, index) => {
    if (name.includes('.')) {
      dottedPathEntries.push({ name, configIndex: index });
    } else {
      flatFieldNames.push(name);
    }
  });

  // Resolve flat fields using existing recursive search
  const matchedFlatFields = findFieldsByName(collectionFields, flatFieldNames);

  const simplifiedFields: FilterDetaild[] = matchedFlatFields.map((field) => {
    const label = (field as FieldAffectingData).label;
    const translatedLabel = translateLabel(label);
    const fieldName = (field as FieldAffectingData).name as string;
    const fieldConfig = flattenedFieldConfigs.find(({ field: f }) =>
      typeof f === 'string' ? f === fieldName : f.name === fieldName,
    );
    const virtualFieldName = 'virtual' in field ? (field.virtual as string | boolean) : undefined;
    return {
      name: fieldName || (virtualFieldName as string),
      label: translatedLabel as string,
      type: field.type,
      options: (field as SelectField).options as OptionObject[],
      row: fieldConfig ? fieldConfig.rowIndex : 0,
      virtual: virtualFieldName,
      width:
        typeof fieldConfig?.field === 'object' && 'width' in fieldConfig.field
          ? fieldConfig.field.width
          : undefined,
    };
  });

  // Resolve dotted-path fields using the path resolver
  const dottedPathFields: FilterDetaild[] = [];
  for (const { name: dottedPath, configIndex } of dottedPathEntries) {
    const resolved = resolveFieldByPath(collectionFields as any, dottedPath);
    if (!resolved) continue;

    const leafField = resolved.field;
    const label = (leafField as FieldAffectingData).label;
    const translatedLabel = translateLabel(label);
    const fieldConfig = flattenedFieldConfigs[configIndex];

    dottedPathFields.push({
      name: dottedPath,
      label: translatedLabel as string,
      type: leafField.type,
      options: (leafField as SelectField).options as OptionObject[],
      row: fieldConfig ? fieldConfig.rowIndex : 0,
      virtual: undefined,
      width:
        typeof fieldConfig?.field === 'object' && 'width' in fieldConfig.field
          ? fieldConfig.field.width
          : undefined,
      path: resolved.path,
    });
  }

  // Combine and sort by original filterList order
  const allResolvedFields = [...simplifiedFields, ...dottedPathFields];

  return flattenedFieldConfigs
    .map(({ field }) => {
      const fieldName = typeof field === 'string' ? field : field.name;
      return allResolvedFields.find((f) => {
        if (f.path && f.path === fieldName) return true;
        if (f.name === fieldName) return true;
        if (typeof f.virtual === 'string') {
          return f.virtual === fieldName;
        }
        return false;
      });
    })
    .filter((f): f is FilterDetaild => !!f);
}
