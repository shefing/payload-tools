import { PayloadRequest } from 'payload';
interface DataWithUpdatedByField {
  [key: string]: unknown;
  [key: number]: unknown; // Allow numeric keys as well if needed
}
export const authorHook = (
  updatedByFieldName: string,
  createdByFieldName: string,
  publishedAtFieldName: string,
  noOp: boolean = false,
): ((args: {
  /* eslint-disable */
  [x: string]: any;
  /* eslint-enable */
  data: DataWithUpdatedByField;
  req: PayloadRequest;
  operation?: string;
}) => Promise<DataWithUpdatedByField>) => {
  return async (args) => {
    //For Globals not operation is passed so have it update
    if (!args?.operation)
      args.operation = 'update';
    if (args?.operation === 'update' && args.data !== undefined && args.req.user !== undefined) {
      args.data[updatedByFieldName] = args.req.user?.completeName || 'system';
    }
    if (args?.operation == 'create' && args.data !== undefined && args.req.user !== undefined) {
      args.data[createdByFieldName] = args.req.user?.completeName || 'system';
    }
    if (args?.data !== undefined && args.req.user !== undefined) {
      switch (args?.operation) {
        case 'create':
          if (args?.data._status === 'published') {
            args.data[publishedAtFieldName] = new Date();
          }
          break;
        case 'update':
          if (args?.originalDoc._status === 'draft' && args?.data._status === 'published') {
            args.data[publishedAtFieldName] = new Date();
          }
          break;
      }
    }

    if (noOp) {
      delete args.operation;
    }
    return args.data;
  };
};
