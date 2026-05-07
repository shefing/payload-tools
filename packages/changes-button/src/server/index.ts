/**
 * Server entry — re-exports the server function for consumers who prefer
 * manual wiring (e.g. registering it directly in `(payload)/layout.tsx`'s
 * `extraServerFunctions` instead of relying on the plugin's auto-registration
 * via `config.admin.serverFunctions`).
 */
export { renderChangesDiffHandler } from './renderChangesDiff.js'
export type {
  CompareFrom,
  RenderChangesDiffArgs,
  RenderChangesDiffResult,
} from './renderChangesDiff.js'
export { SERVER_FUNCTION_KEY } from '../labels.js'
export { wrapHandleServerFunctions, wrapServerFunctions } from './wrapServerFunctions.js'
