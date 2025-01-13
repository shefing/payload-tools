import { createServerFeature } from '@payloadcms/richtext-lexical';

export const commentFeature = createServerFeature({
  feature: {
    ClientFeature: '@michalklor/comments/client#commentClientFeature',
  },
  key: 'comment',
});
