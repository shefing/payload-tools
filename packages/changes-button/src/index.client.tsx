'use client'
/**
 * Client entry — referenced by Payload's import map via the path
 * `@shefing/changes-button/client#ChangesButton`. Keeping this barrel slim
 * means the `react-server` boundary stays clear: nothing in this file or
 * its transitive imports may run on the server.
 */
export { ChangesButton } from './components/ChangesButton/index.js'
export { useChangesDrawer } from './components/ChangesDrawer/index.js'
export type {
  UseChangesDrawerArgs,
  UseChangesDrawerReturn,
} from './components/ChangesDrawer/index.js'
