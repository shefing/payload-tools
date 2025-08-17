import type { EntityToGroup } from '@payloadcms/ui/shared'
import type {
  NavPreferences,
  PayloadRequest,
  SanitizedPermissions,
  ServerProps,
} from 'payload'

import { Logout } from '@payloadcms/ui'
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import { EntityType, groupNavItems } from '@payloadcms/ui/shared'
import React from 'react'
import { processNavGroups } from '../lib/utils'

import { NavHamburger } from './NavHamburger'
import { NavWrapper } from './NavWrapper'
// Import SCSS only in browser environment
// This prevents Node.js from trying to import SCSS directly
// which causes ERR_UNKNOWN_FILE_EXTENSION error
if (typeof window !== 'undefined') {
  // @ts-expect-error - Dynamic import of CSS is not recognized by TypeScript
  import('./index.scss').catch(err => {
    console.warn('Failed to load SCSS file:', err);
  });
}

const baseClass = 'nav'

import { getNavPrefs } from './getNavPrefs'
import { DefaultNavClient } from './index.client'

export type NavProps = {
  req?: PayloadRequest
} & ServerProps

export const NavDefaultFilter: React.FC<NavProps> = async (props) => {
  const {
    documentSubViewType,
    i18n,
    locale,
    params,
    payload,
    permissions,
    req,
    searchParams,
    user,
    viewType,
    visibleEntities,
  } = props

  if (!payload?.config) {
    return null
  }

  const {
    admin: {
      components: { afterNavLinks, beforeNavLinks, logout },
    },
    collections,
    globals,
  } = payload.config

  const groups = groupNavItems(
    [
      ...collections
        .filter(({ slug }) => visibleEntities?.collections.includes(slug))
        .map(
          (collection) =>
            ({
              type: EntityType.collection,
              entity: collection,
            }) satisfies EntityToGroup,
        ),
      ...globals
        .filter(({ slug }) => visibleEntities?.globals.includes(slug))
        .map(
          (global) =>
            ({
              type: EntityType.global,
              entity: global,
            }) satisfies EntityToGroup,
        ),
    ],
    permissions as SanitizedPermissions,
    i18n,
  )

  const navPreferences = await getNavPrefs(req as PayloadRequest)

  // Process collections to calculate URLs with defaultFilter
  const processedGroups = processNavGroups(groups, collections, payload, i18n);

  const LogoutComponent = RenderServerComponent({
    clientProps: {
      documentSubViewType,
      viewType,
    },
    Component: logout?.Button,
    Fallback: Logout,
    importMap: payload.importMap,
    serverProps: {
      i18n,
      locale,
      params,
      payload,
      permissions,
      searchParams,
      user,
    },
  })

  return (
    <NavWrapper baseClass={baseClass}>
      <nav className={`${baseClass}__wrap`}>
        {RenderServerComponent({
          clientProps: {
            documentSubViewType,
            viewType,
          },
          Component: beforeNavLinks,
          importMap: payload.importMap,
          serverProps: {
            i18n,
            locale,
            params,
            payload,
            permissions,
            searchParams,
            user,
          },
        })}
        <DefaultNavClient groups={processedGroups} navPreferences={navPreferences as NavPreferences} />
        {RenderServerComponent({
          clientProps: {
            documentSubViewType,
            viewType,
          },
          Component: afterNavLinks,
          importMap: payload.importMap,
          serverProps: {
            i18n,
            locale,
            params,
            payload,
            permissions,
            searchParams,
            user,
          },
        })}
        <div className={`${baseClass}__controls`}>{LogoutComponent}</div>
      </nav>
      <div className={`${baseClass}__header`}>
        <div className={`${baseClass}__header-content`}>
          <NavHamburger baseClass={baseClass} />
        </div>
      </div>
    </NavWrapper>
  )
}
export default NavDefaultFilter;
