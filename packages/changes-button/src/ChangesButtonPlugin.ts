import type { Config, PayloadComponent } from 'payload'

import { hasDraftsEnabled } from 'payload/shared'

export interface ChangesButtonPluginConfig {
  /** Slugs of collections that should NOT receive the Changes button. */
  excludedCollections?: string[]
  /** Slugs of globals that should NOT receive the Changes button. */
  excludedGlobals?: string[]
  /** Disable the plugin entirely without removing it from `plugins`. */
  disabled?: boolean
}

const defaultConfig: Required<Omit<ChangesButtonPluginConfig, 'disabled'>> & {
  disabled: boolean
} = {
  excludedCollections: [],
  excludedGlobals: [],
  disabled: false,
}

const CHANGES_BUTTON_COMPONENT: PayloadComponent = {
  path: '@shefing/changes-button/client#ChangesButton',
}

/**
 * Pushes the ChangesButton into the `beforeDocumentControls` slot of an entity's
 * edit view, idempotently (won't double-add on repeated runs).
 */
function injectButton(
  entity: { admin?: { components?: Record<string, unknown> } & Record<string, unknown> } & Record<
    string,
    unknown
  >,
): void {
  // Defensive object construction — mirrors the `ensurePath` pattern used by
  // `@shefing/custom-version-view`.
  const admin = ((entity.admin as Record<string, unknown> | undefined) ?? (entity.admin = {})) as {
    components?: {
      edit?: { beforeDocumentControls?: PayloadComponent[] } & Record<string, unknown>
    } & Record<string, unknown>
  }
  const components = (admin.components ?? (admin.components = {})) as {
    edit?: { beforeDocumentControls?: PayloadComponent[] } & Record<string, unknown>
  }
  const edit = (components.edit ?? (components.edit = {})) as {
    beforeDocumentControls?: PayloadComponent[]
  }
  const arr = (edit.beforeDocumentControls ?? (edit.beforeDocumentControls = [])) as Array<
    PayloadComponent | string
  >

  // Idempotency check — match by `path` if present. `PayloadComponent` is
  // `string | { path?: string; ... }` so we narrow before reading `.path`.
  const targetPath =
    typeof CHANGES_BUTTON_COMPONENT === 'string'
      ? CHANGES_BUTTON_COMPONENT
      : (CHANGES_BUTTON_COMPONENT as { path?: string }).path
  const alreadyPresent = arr.some((c) => {
    if (typeof c === 'string') {
      return c === targetPath
    }
    return c && (c as { path?: string }).path === targetPath
  })
  if (!alreadyPresent) {
    arr.push(CHANGES_BUTTON_COMPONENT)
  }
}

/**
 * `changesButtonPlugin` adds a "Changes" button to every drafts-enabled
 * collection and global edit view. Clicking it opens a diff between the
 * current document state (or the latest draft) and the latest published
 * version, reusing the same diff UI as the built-in Versions view.
 *
 * Server function registration: until Payload merges PR-B
 * (`config.admin.serverFunctions` registry), the consumer must wire the
 * plugin's server function into `(payload)/layout.tsx` themselves using
 * the `wrapServerFunctions` helper exported from this package. See README.
 */
export const changesButtonPlugin =
  (pluginConfig: ChangesButtonPluginConfig = {}) =>
  (config: Config): Config => {
    const merged = { ...defaultConfig, ...pluginConfig }

    if (merged.disabled) {
      return config
    }

    // 1. Inject button into drafts-enabled collections.
    if (Array.isArray(config.collections)) {
      for (const collection of config.collections) {
        if (merged.excludedCollections.includes(collection.slug)) {
          continue
        }
        if (!hasDraftsEnabled(collection)) {
          continue
        }
        injectButton(collection as unknown as Record<string, unknown>)
      }
    }

    // 2. Inject button into drafts-enabled globals.
    if (Array.isArray(config.globals)) {
      for (const global of config.globals) {
        if (merged.excludedGlobals.includes(global.slug)) {
          continue
        }
        if (!hasDraftsEnabled(global)) {
          continue
        }
        injectButton(global as unknown as Record<string, unknown>)
      }
    }

    return config
  }

export default changesButtonPlugin
