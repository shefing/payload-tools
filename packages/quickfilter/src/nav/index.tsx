import type { EntityToGroup } from '@payloadcms/ui/shared'
import type {
  Field,
  NavPreferences,
  PayloadRequest,
  SanitizedPermissions,
  SelectField,
  ServerProps,
  UIField,
} from 'payload'

import { Logout } from '@payloadcms/ui'
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import { EntityType, groupNavItems } from '@payloadcms/ui/shared'
import React from 'react'
import { formatAdminURL } from 'payload/shared'
import { parseWhereClauseToFilterValues, buildQuickFilterConditions } from '../lib/utils'
import type { FilterDetaild } from '../filters/types/filters-type'
import type { SupportedLocale } from '../labels'
import { stringify } from 'qs-esm'

import { NavHamburger } from './NavHamburger'
import { NavWrapper } from './NavWrapper'
// Import SCSS only in browser environment
// This prevents Node.js from trying to import SCSS directly
// which causes ERR_UNKNOWN_FILE_EXTENSION error
if (typeof window !== 'undefined') {
  // @ts-ignore
  import('./index.scss').catch(err => {
    console.warn('Failed to load SCSS file:', err);
  });
}

const baseClass = 'nav'

import { getNavPrefs } from './getNavPrefs'
import { DefaultNavClient } from './index.client'
import { FieldAffectingData } from 'payload'

// Recursive function to find a field by name
function findFieldByName(fields: Field[], fieldName: string): Field {
  // First check at the current level
  const directMatch = fields.find(
    (f) => (f as FieldAffectingData).name === fieldName,
  )
  if (directMatch) return directMatch

  // If not found, search recursively in nested structures
  for (const item of fields) {
    // Check in array, row, or collapsible fields
    if (
      (item.type === 'array' || item.type === 'row' || item.type === 'collapsible') &&
      'fields' in item &&
      Array.isArray(item.fields)
    ) {
      const nestedMatch = findFieldByName(item.fields, fieldName)
      if (nestedMatch) return nestedMatch
    } 
    // Check in tabs
    else if (item.type === 'tabs' && Array.isArray(item.tabs)) {
      for (const tab of item.tabs) {
        if ('fields' in tab && Array.isArray(tab.fields)) {
          const tabMatch = findFieldByName(tab.fields, fieldName)
          if (tabMatch) return tabMatch
        }
      }
    } 
    // Check in blocks
    else if (item.type === 'blocks' && Array.isArray(item.blocks)) {
      for (const block of item.blocks) {
        if ('fields' in block && Array.isArray(block.fields)) {
          const blockMatch = findFieldByName(block.fields, fieldName)
          if (blockMatch) return blockMatch
        }
      }
    }
  }

  return null
}

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
  const processedGroups = groups.map(group => {
    const processedEntities = group.entities.map(entity => {
      if (entity.type === EntityType.collection) {
        const collection = collections.find(c => c.slug === entity.slug);
        debugger
        // Check if collection has defaultFilter in custom props
        if (collection?.custom?.defaultFilter) {
          // Base URL without query parameters
          const baseHref = formatAdminURL({ 
            adminRoute: payload.config.routes.admin, 
            path: `/collections/${entity.slug}` 
          });

          // Get the fields from the collection for parsing the where clause
          const fields: FilterDetaild[] =
            collection.custom.filterList
              ?.flat()
              .map((field: { name: string; width: string | undefined }) => {
                const fieldName = field.name
                const fieldConfig = findFieldByName(collection.fields, fieldName)
                return {
                  name: fieldName,
                  type: fieldConfig?.type,
                  options: (fieldConfig as  SelectField )?.options,
                  label: (fieldConfig as UIField)?.label || fieldName,
                  row: 0,
                  width: typeof field === 'object' && 'width' in field ? field.width : undefined,
                } as FilterDetaild
              })
              .filter(Boolean) || []

          // If we have fields and a defaultFilter, calculate the URL with where clause
          if (fields.length > 0) {
            // Parse the defaultFilter to get filter values
            const filterValues = parseWhereClauseToFilterValues(
              collection.custom.defaultFilter,
              fields,
              i18n.language as SupportedLocale
            );
            // If we have filter values, add them to the URL
            if (Object.keys(filterValues).length > 0) {
              const quickFilterConditions = buildQuickFilterConditions(filterValues, fields, i18n.language as SupportedLocale)


              const whereCondition = quickFilterConditions.length === 1 ? quickFilterConditions[0] : { and: quickFilterConditions };
              const query = {
                where: whereCondition,
              };
              const stringifiedQuery = stringify(query, { addQueryPrefix: true });
              return {
                ...entity,
                href: `${baseHref}${stringifiedQuery}`
              };
            }
          }
        }
      }
      return entity;
    });

    return {
      ...group,
      entities: processedEntities
    };
  });

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
