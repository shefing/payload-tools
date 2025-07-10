import type { Config, Field, Plugin } from 'payload';
import { FieldsAuthoringConfig } from './types.js';

function findFieldsByTypes(fields: Field[], fieldTypes: string[]): Field[] {
  let results: Field[] = [];

  function recursiveSearch(fields: Field[]) {
    const filteredFields = fields.filter((field) => fieldTypes.includes(field.type));
    results.push(...filteredFields);

    fields.forEach((item) => {
      if ('fields' in item && Array.isArray(item.fields)) {
        recursiveSearch(item.fields);
      }
      if (item.type === 'tabs' && 'tabs' in item && Array.isArray(item.tabs)) {
        item.tabs.forEach((tab) => {
          if ('fields' in tab && Array.isArray(tab.fields)) {
            recursiveSearch(tab.fields);
          }
        });
      }
      if (item.type === 'blocks' && 'blocks' in item && Array.isArray(item.blocks)) {
        item.blocks.forEach((block) => {
          if ('fields' in block && Array.isArray(block.fields)) {
            recursiveSearch(block.fields);
          }
        });
      }
    });
  }

  recursiveSearch(fields);
  return results;
}

function applyOverrideToField(field: Field, override: any) {
  // Admin overrides
  if (override.admin) {
    field.admin = field.admin || {};
    Object.entries(override.admin).forEach(([key, value]) => {
      if (field.admin?.[key] === undefined) {
        field.admin[key] = value;
      }
    });
  }

  // Regular overrides
  Object.entries(override).forEach(([key, value]) => {
    if (key === 'admin') return;
    if (field[key] === undefined) {
      field[key] = value;
    }
  });
}

const DynamicFieldOverrides =
  (options: FieldsAuthoringConfig): Plugin =>
  (incomingConfig: Config): Config => {
    if (!incomingConfig?.collections) {
      throw new Error('Invalid config or collections missing');
    }

    const { collections, globals } = incomingConfig;

    collections.forEach((collection) => {
      if (options.excludedCollections?.includes(collection.slug)) return;
      if (!collection.fields) return;

      options.overrides.forEach((override) => {
        let matchingFields = findFieldsByTypes(collection.fields, override.fieldTypes);

        if (override.relationTo) {
          const relationFilter = Array.isArray(override.relationTo)
            ? override.relationTo
            : [override.relationTo];

          matchingFields = matchingFields.filter((field) => {
            if (field.type !== 'relationship') return false;
            if (!field.relationTo) return false;

            const fieldRelations = Array.isArray(field.relationTo)
              ? field.relationTo
              : [field.relationTo];

            return fieldRelations.some((rel) => relationFilter.includes(rel));
          });
        }

        matchingFields.forEach((field) => applyOverrideToField(field, override.overrides));
      });
    });

    globals?.forEach((global) => {
      if (options.excludedGlobals?.includes(global.slug)) return;
      if (!global.fields) return;

      options.overrides.forEach((override) => {
        let matchingFields = findFieldsByTypes(global.fields, override.fieldTypes);

        if (override.relationTo) {
          const relationFilter = Array.isArray(override.relationTo)
            ? override.relationTo
            : [override.relationTo];

          matchingFields = matchingFields.filter((field) => {
            if (field.type !== 'relationship') return false;
            if (!field.relationTo) return false;

            const fieldRelations = Array.isArray(field.relationTo)
              ? field.relationTo
              : [field.relationTo];

            return fieldRelations.some((rel) => relationFilter.includes(rel));
          });
        }

        matchingFields.forEach((field) => applyOverrideToField(field, override.overrides));
      });
    });

    return {
      ...incomingConfig,
      collections,
      globals,
    };
  };

export default DynamicFieldOverrides;
