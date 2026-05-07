import type { ServerFunctionClient, ServerFunctionHandler } from 'payload'

import { SERVER_FUNCTION_KEY } from '../labels.js'
import { renderChangesDiffHandler } from './renderChangesDiff.js'

/**
 * Type of the per-call object Payload passes to a `ServerFunctionClient`.
 * (Mirrors the shape `RootLayout` invokes the prop with — `name` + `args`.)
 */
type ServerFunctionClientArgs = Parameters<ServerFunctionClient>[0]

/**
 * Wrap the upstream `handleServerFunctions` so the `render-changes-diff` key
 * is dispatched to this plugin's handler before falling through to the
 * default Payload registry.
 *
 * Usage in `app/(payload)/layout.tsx`:
 *
 * ```ts
 * import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
 * import { wrapServerFunctions } from '@shefing/changes-button/server'
 * import config from '@payload-config'
 * import { importMap } from './admin/importMap.js'
 *
 * const baseServerFunction: ServerFunctionClient = async function (args) {
 *   'use server'
 *   return handleServerFunctions({ ...args, config, importMap })
 * }
 *
 * const serverFunction = wrapServerFunctions(baseServerFunction)
 *
 * export default async function Layout({ children }) {
 *   return (
 *     <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
 *       {children}
 *     </RootLayout>
 *   )
 * }
 * ```
 *
 * This shim is only required until Payload PR-B
 * (`config.admin.serverFunctions` registry) ships in a release; once it
 * does, the plugin can self-register and this wrapper can be removed from
 * `(payload)/layout.tsx`.
 */
export function wrapServerFunctions(
  baseServerFunction: ServerFunctionClient,
): ServerFunctionClient {
  const wrapped = async function (args: ServerFunctionClientArgs) {
    'use server'
    if (args.name === SERVER_FUNCTION_KEY) {
      // The plugin handler expects a `req`. The base `ServerFunctionClient`
      // receives only `{ name, args }`; an upstream `handleServerFunctions`
      // shim normally injects `req` for the resolved handler. We don't have
      // direct access to `req` here, so we route the request through the
      // base handler with a registry override that prepends our key to the
      // built-in lookup.
      return baseServerFunction({
        ...args,
        // `serverFunctions` is the registry the user can pass through to
        // `handleServerFunctions` — Payload merges it before the built-ins.
        serverFunctions: {
          ...((args as ServerFunctionClientArgs & {
            serverFunctions?: Record<string, unknown>
          }).serverFunctions ?? {}),
          [SERVER_FUNCTION_KEY]: renderChangesDiffHandler,
        },
      } as ServerFunctionClientArgs)
    }
    return baseServerFunction(args)
  } as ServerFunctionClient
  return wrapped
}

/**
 * Lower-level helper for users who construct `handleServerFunctions` calls
 * directly (no `ServerFunctionClient` wrapper). Returns a new handler that
 * routes `render-changes-diff` to this plugin and forwards everything else
 * to `base`.
 */
export function wrapHandleServerFunctions(
  base: ServerFunctionHandler,
): ServerFunctionHandler {
  return async (args) => {
    return base({
      ...args,
      serverFunctions: {
        ...(args.serverFunctions ?? {}),
        [SERVER_FUNCTION_KEY]: renderChangesDiffHandler,
      },
    })
  }
}
