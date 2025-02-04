import _ from 'lodash';
import type { Config, Field, Plugin } from 'payload';
import { FieldsAuthoringConfig } from './types';

function findFieldsByType(fields: Field[], fieldType: string): Field[] {
  let results: Field[] = [];

  function recursiveSearch(fields: Field[]) {
    const filteredFields = fields.filter((field) => field.type === fieldType);
    results.push(...filteredFields);

    fields.forEach((item) => {
      if (
        (item.type === 'array' || item.type === 'row' || item.type === 'collapsible') &&
        'fields' in item &&
        Array.isArray(item.fields)
      ) {
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

const DynamicFieldOverrides =
  (options: FieldsAuthoringConfig): Plugin =>
  (incomingConfig: Config): Config => {
    if (!incomingConfig || !incomingConfig.collections) {
      throw new Error('Invalid incoming configuration or collections are missing');
    }

    const { collections } = incomingConfig;
    const { fieldType, componentPath } = options;

    collections.forEach((collection) => {
      if (collection.fields) {
        const matchingFields = findFieldsByType(collection.fields, fieldType);
        matchingFields.forEach((field) => {
          if (field) {
            field.admin = field.admin || {};
            field.admin.components = field.admin.components || {};
            field.admin.components.Field = componentPath;
          }
        });
      }
    });

    return {
      ...incomingConfig,
      collections,
    };
  };

export default DynamicFieldOverrides;
