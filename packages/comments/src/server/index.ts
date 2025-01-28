import { createServerFeature } from '@payloadcms/richtext-lexical';

export const commentFeature = createServerFeature({
  feature: {
    ClientFeature: '@shefing/comments/client#commentClientFeature',
  },
  key: 'comment',
});
