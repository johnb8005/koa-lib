import { HTTP } from '@nexys/lib';
import Utils from '@nexys/utils';

import * as Errors from '../error';


export const handler = (messages={}) => async (ctx, next) => {
  try {
    await next();

    // NOTE: in downstream middleware: ctx.state.response = await someFunction()
    if (ctx.state instanceof HTTP.Success) {
      const { status, body } = ctx.state;
      ctx.send(status, body);
      return;
    }

    switch (ctx.status) {
      case 401: {
        ctx.unauthorized(messages.unauthorized || 'Unauthorized');
        break;
      }
      case 404: {
        ctx.notFound(messages.notFound || 'Not found. The requested route does not exist');
        break;
      }
      default: 
        if (Utils.ds.isEmpty(ctx.body)) {
          ctx.send(204, 'No Content');
        }
    }
  } catch (err) {
    Errors.handler(ctx, err);
  }
}