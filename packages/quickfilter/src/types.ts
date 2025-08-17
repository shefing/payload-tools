import type {StaticLabel} from "payload";
import {EntityType} from "@payloadcms/ui/shared";

export type CollectionFilterPluginConfig = {
  /**
   * List of collections to add filters to
   */
  disabled?: boolean;
};


// Extend the Entity type to include the href property
export type EntityWithHref = {
  label: StaticLabel;
  slug: string;
  type: EntityType;
  href?: string;
};