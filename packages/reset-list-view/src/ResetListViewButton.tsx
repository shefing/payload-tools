'use client'
import { getTranslation } from '@payloadcms/translations'
import {PopupList, useConfig, useTranslation } from '@payloadcms/ui'
import { useAuth } from '@payloadcms/ui/providers/Auth'
//import { stringify } from 'qs-esm'
import {usePreferences} from "@payloadcms/ui";

type Props = {
  slug: string
}

export const ResetListViewButton: React.FC<Props> = ({ slug }) => {
  const { config ,getEntityConfig} = useConfig()
  const { user } = useAuth()
  const {  i18n ,t} = useTranslation()
  const currentCollectionConfig = getEntityConfig({ collectionSlug:slug })
  const { setPreference } = usePreferences()

  const {
    routes: { api },
    serverURL,
  } = config
  const handleReset = async () => {
    try {
      await setPreference(`collection-${slug}`,null)
      window.location.reload()
      /*
            // Build the apiquery parameter for the user ID
            const apiquery = {
              depth: 0, // Fetch more details for a single company
              where: {
                key: { equals: `collection-${slug}` },
                'user.id': { equals: user?.id },
              },
            }
            const stringifyQuery = stringify(apiquery, { addQueryPrefix: true })
            // Direct call to the Payload API to delete preferences for a specific view
            const response = await fetch(`${serverURL}${api}/payload-preferences?${stringifyQuery}`, {
              credentials: 'include',
              method: 'DELETE',
              mode: 'cors',
            })

            if (response.ok) {
              window.location.reload()
            } else {
              console.error('Failed to reset list view preferences')
            }
      */
    } catch (error) {
      console.error('Error resetting list view preferences:', error)
    }
  }
  return (
      <PopupList.Button onClick={handleReset}>
        {t('general:resetPreferences')+"-"+getTranslation(currentCollectionConfig.labels.plural, i18n)}
      </PopupList.Button>)
}
 export default ResetListViewButton