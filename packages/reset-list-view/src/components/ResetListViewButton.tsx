'use client'
import {Button, useConfig, useTranslation } from '@payloadcms/ui'
import { useAuth } from '@payloadcms/ui/providers/Auth'
import { stringify } from 'qs-esm'

type Props = {
  slug: string
}

export const ResetListViewButton: React.FC<Props> = ({ slug }) => {
  const { config } = useConfig()
  const { user } = useAuth()
  const {  t } = useTranslation()

  const {
    routes: { api },
    serverURL,
  } = config
  const handleReset = async () => {
    try {
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
    } catch (error) {
      console.error('Error resetting list view preferences:', error)
    }
  }

  return <Button onClick={handleReset} size="small">
    {t('general:resetPreferences')}
  </Button>
}
 export default ResetListViewButton