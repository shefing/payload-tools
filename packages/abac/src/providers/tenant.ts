import type { AttributeProvider } from '../types.js'

type TenantAttributeOptions = {
  key?: string
  userField?: string
  docField?: string
  jwtKey?: string
  multiValue?: boolean
}

const getValueAtPath = (value: Record<string, unknown>, path: string): unknown => {
  return path.split('.').reduce<unknown>((currentValue, segment) => {
    if (currentValue && typeof currentValue === 'object' && segment in currentValue) {
      return (currentValue as Record<string, unknown>)[segment]
    }

    return undefined
  }, value)
}

const normalizeRelationshipValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeRelationshipValue(entry))
  }

  if (value && typeof value === 'object' && 'id' in value) {
    return normalizeRelationshipValue((value as { id?: unknown }).id)
  }

  return value
}

export const tenantAttribute = ({
  key = 'tenant',
  userField = 'tenant',
  docField = 'tenant',
  jwtKey = userField,
  multiValue = false,
}: TenantAttributeOptions = {}): AttributeProvider => {
  if (multiValue) {
    return {
      key,
      isMultiValue: true,
      fromUser: async (user) => {
        const raw = getValueAtPath(user, userField)
        const arr = Array.isArray(raw) ? raw : raw != null ? [raw] : []
        return arr.map(normalizeRelationshipValue)
      },
      match: (userTenants, docTenant) => Array.isArray(userTenants) && userTenants.includes(docTenant as string),
      toWhere: (userTenants) => ({
        [docField]: { in: userTenants as string[] },
      }),
      enrichJWT: async (user) => {
        const raw = getValueAtPath(user, userField)
        const arr = Array.isArray(raw) ? raw : raw != null ? [raw] : []
        return { [jwtKey]: arr.map(normalizeRelationshipValue) }
      },
    }
  }

  return {
    key,
    fromUser: async (user) => normalizeRelationshipValue(getValueAtPath(user, userField) ?? null),
    match: (userValue, docValue) => userValue != null && userValue === docValue,
    toWhere: (userValue) => ({ [docField]: { equals: userValue } }),
    enrichJWT: async (user) => ({ [jwtKey]: normalizeRelationshipValue(getValueAtPath(user, userField) ?? null) }),
  }
}

export default tenantAttribute