export interface FieldOverride {
  fieldTypes: string[];
  relationTo?: string | string[];
  overrides: {
    admin?: Record<string, any>;
    [key: string]: any;
  };
}

export interface FieldsAuthoringConfig {
  overrides: FieldOverride[];
  excludedCollections?: string[];
  excludedGlobals?: string[];
}
