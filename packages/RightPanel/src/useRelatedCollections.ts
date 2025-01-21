'use client';
import { useConfig } from '@payloadcms/ui';
import { useState } from 'react';

export const useRelatedCollections = (relationTo: string | string[]) => {
  const { config } = useConfig();

  const [relatedCollections] = useState(() => {
    if (relationTo) {
      const relations = typeof relationTo === 'string' ? [relationTo] : relationTo;
      return relations.map((relation) =>
        config.collections.find((collection) => collection.slug === relation),
      );
    }
    return [];
  });

  return relatedCollections;
};
