export interface FieldsAuthoringConfig {
  fieldType: string;
  componentPath: string;
    /** Array of collection slugs to exclude */
    excludedCollections?: string[];
    /** Array of global slugs to exclude */
    excludedGlobals?: string[];
}
