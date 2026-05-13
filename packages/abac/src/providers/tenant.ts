import type { AttributeProvider } from '../types.js'

type TenantAttributeOptions = {
  userField?: string
  docField?: string
  jwtKey?: string
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
  userField = 'tenant',
  docField = 'tenant',
  jwtKey = userField,
}: TenantAttributeOptions = {}): AttributeProvider => {
  return {
    key: 'tenant',
    fromUser: async (user) => normalizeRelationshipValue(getValueAtPath(user, userField) ?? null),
    match: (userValue, docValue) => userValue != null && userValue === docValue,
    toWhere: (userValue) => ({ [docField]: { equals: userValue } }),
    enrichJWT: async (user) => ({ [jwtKey]: normalizeRelationshipValue(getValueAtPath(user, userField) ?? null) }),
  }
}

export default tenantAttribute