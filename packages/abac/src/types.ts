import type { CollectionSlug, PayloadRequest, Where } from 'payload'

export type AbacAction = 'read' | 'create' | 'update' | 'delete'

export type AbacDocument = Record<string, unknown>

export type AbacUser = Record<string, unknown> & {
  id?: number | string
}

export type AttributeProvider<
  UserValue = unknown,
  DocumentValue = unknown,
  User extends AbacUser = AbacUser,
> = {
  key: string
  fromUser(user: User, req: PayloadRequest): UserValue | Promise<UserValue>
  fromDoc?: Partial<Record<CollectionSlug, (doc: AbacDocument) => DocumentValue>>
  match(userValue: UserValue, docValue: DocumentValue): boolean | Promise<boolean>
  toWhere?(userValue: UserValue): Where
  enrichJWT?(user: User): Record<string, unknown> | Promise<Record<string, unknown>>
}

export type AbacCollectionAttributeConfig = {
  docField: string
  stampOnCreate?: boolean
  actions?: AbacAction[]
}

export type AbacCollectionConfig = Record<string, AbacCollectionAttributeConfig>

export type AbacPluginConfig = {
  attributes: AttributeProvider[]
  excludedCollections?: CollectionSlug[]
  includedCollections?: CollectionSlug[]
  policies?: unknown
}

export type ResolvedAttributeConfig = AbacCollectionAttributeConfig & {
  key: string
}

export type ResolvedProvider = {
  provider: AttributeProvider
  config: ResolvedAttributeConfig
}

export type AbacPermissionsResponse = {
  collection: string
  where: Where | null
  actions: AbacAction[]
}