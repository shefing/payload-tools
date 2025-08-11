'use client'

import type { groupNavItems } from '@payloadcms/ui/shared'
import type { NavPreferences, StaticLabel } from 'payload'

// Extend the Entity type to include the href property
type EntityWithHref = {
    label: StaticLabel;
    slug: string;
    type: EntityType;
    href?: string;
};


import { getTranslation } from '@payloadcms/translations'
import { BrowseByFolderButton, Link, NavGroup, useConfig, useTranslation } from '@payloadcms/ui'
import { EntityType } from '@payloadcms/ui/shared'
import { usePathname } from 'next/navigation.js'
import { formatAdminURL } from 'payload/shared'
import React, { Fragment } from 'react'

const baseClass = 'nav'

export const DefaultNavClient: React.FC<{
  groups: ReturnType<typeof groupNavItems>
  navPreferences: NavPreferences
}> = ({ groups, navPreferences }) => {
  const pathname = usePathname()

  const {
    config,
  } = useConfig()

  const { i18n } = useTranslation()

  const folderURL = formatAdminURL({
    adminRoute: config.routes.admin,
    path: config.admin.routes.browseByFolder,
  })

  const viewingRootFolderView = pathname.startsWith(folderURL)

  return (
    <Fragment>
      {config.folders && config.folders.browseByFolder && <BrowseByFolderButton active={viewingRootFolderView} />}
      {groups.map(({ entities, label }, key) => {
        return (
          <NavGroup isOpen={navPreferences?.groups?.[label]?.open} key={key} label={label}>
            {entities.map(({ slug, type, label, href: entityHref }: EntityWithHref, i) => {
              let href: string = entityHref || ""
              let id: string = ""

              // If href is not provided from the server component, calculate it here
              if (!href) {
                if (type === EntityType.collection) {
                  href = formatAdminURL({ adminRoute: config.routes.admin, path: `/collections/${slug}` })
                  id = `nav-${slug}`
                }

                if (type === EntityType.global) {
                  href = formatAdminURL({ adminRoute: config.routes.admin, path: `/globals/${slug}` })
                  id = `nav-global-${slug}`
                }
              } else {
                // If href is provided, still set the id
                if (type === EntityType.collection) {
                  id = `nav-${slug}`
                }
                if (type === EntityType.global) {
                  id = `nav-global-${slug}`
                }
              }

              const isActive =
                pathname.startsWith(href) && ['/', undefined].includes(pathname[href.length])

              const Label = (
                <>
                  {isActive && <div className={`${baseClass}__link-indicator`} />}
                  <span className={`${baseClass}__link-label`}>{getTranslation(label, i18n)}</span>
                </>
              )

              // If the URL matches the link exactly
              if (pathname === href) {
                return (
                  <div className={`${baseClass}__link`} id={id} key={i}>
                    {Label}
                  </div>
                )
              }

              return (
                <Link className={`${baseClass}__link`} href={href} id={id} key={i} prefetch={false}>
                  {Label}
                </Link>
              )
            })}
          </NavGroup>
        )
      })}
    </Fragment>
  )
}
