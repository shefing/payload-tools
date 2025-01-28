import type { Config } from 'payload';
import { videoCoverHook } from './hooks/videoCoverImage.js';
import { VideoCoverPluginConfig } from './types.js';

const defaultConfig: Required<VideoCoverPluginConfig> = {
  collections: ['media', 'videos'],
  framePosition: 'middle', // or 5 (seconds)
  imageFormat: 'webp',
};

export const videoCoverPlugin =
  (pluginConfig: VideoCoverPluginConfig = {}) =>
  (config: Config): Config => {
    const mergedConfig: Required<VideoCoverPluginConfig> = {
      ...defaultConfig,
      ...pluginConfig,
    };

    return {
      ...config,
      collections: config.collections?.map((collection) => {
        if (mergedConfig.collections?.includes(collection.slug)) {
          return {
            ...collection,
            fields: [
              ...(collection.fields || []),
              {
                name: 'coverImage',
                type: 'upload',
                relationTo: 'media',
                filterOptions: {
                  mimeType: { contains: 'image' },
                },
                admin: {
                  hidden: true,
                },
              },
              {
                name: 'thumbnailURL',
                type: 'text',
                admin: {
                  hidden: true,
                },
              },
              {
                name: 'startPosition',
                type: 'number',
                admin: {
                  hidden: true,
                },
              },
              {
                name: 'coverImageTitle',
                type: 'text',
                admin: {
                  hidden: true,
                },
              },
            ],
            hooks: {
              ...collection.hooks,
              beforeChange: [
                ...(collection.hooks?.beforeChange || []),
                videoCoverHook(mergedConfig),
              ],
            },
          };
        }
        return collection;
      }),
    };
  };
