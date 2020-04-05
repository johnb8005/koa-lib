import Router from 'koa-router';
import bodyParser from 'koa-body';
import Passport from 'koa-passport';
import request from 'supertest';

import * as Middleware from './index';
import * as App from '../app';

import * as Type from '../types';

test('Validate', () => {
  expect(typeof Middleware.Validate).toEqual('object');
});

test('Response.handler', () => {
  expect(typeof Middleware.Response.handler).toEqual('function');
});

test('routes', () => {
  expect(typeof Middleware.routes).toEqual('function');
});

describe('auth middleware', () => {
  let server = null;
  let cookie = null;

  beforeAll(async () => {
    const session:Type.ISession = {
      key: 'app_test',
      local: {
        persistent: false
      },
      duration: 5000,
      signed: false,
      signatureKeys: []
    };

    const options = {
      type: 'local',
      handleLogin: () => ({ id: 1, name: 'Smith' })
    };

    const auth = { strategies: [options] };
    const app = App.init({ session, auth });

    const router = new Router();
    router.post('/login', bodyParser(), ctx => {
      return Passport.authenticate('local', async (_err, data) => {
        await ctx.login(data);
        //ctx.res('');
      })(ctx, next);
    });

    router.get('/auth', Middleware.isAuthenticated(), ctx => ctx.body = ctx.session.passport.user);
    router.get('/admin', Middleware.isAdmin, ctx => ctx.body = ctx.session.passport.user);
    router.get('/basic', Middleware.isBasicAuthenticated('user', 'pass'), ctx => ctx.body = 'basic');
    router.get('/or', Middleware.or(Middleware.isAdmin, Middleware.isBasicAuthenticated('user', 'pass')), ctx => ctx.body = 'basic');
    router.get('/orauth', Middleware.or(Middleware.isAuthenticated(), Middleware.isBasicAuthenticated('user', 'pass')), ctx => ctx.body = 'authenticated');
    router.get('/orerror', Middleware.or(Middleware.isAuthenticated(), Middleware.isBasicAuthenticated('user', 'pass')), ctx => { ctx.throw(400, 'Something went wrong'); });
    
    app.use(router.routes());
    const server = app.listen();

    const response = await request(server).post('/login').send({ username: 'john.smith', password: '123456Aa' });
    cookie = response.headers['set-cookie'][0].split(' ')[0];
  });

  // NOTE: after all async?
  afterAll(() => {
    /* eslint-disable */
    if(server !== null) {
      /* tslint:disable */
      server.close() // tslint:disable
    }
  });

  test('auth', async () => {
    const response = await request(server).get('/auth').set('Cookie', cookie);
    expect(response.status).toBe(200);
    expect(response.body.id).toBe(1);
  });

  test('admin', async () => {
    const response = await request(server).get('/admin').set('Cookie', cookie);
    expect(response.status).toBe(401);
  });

  test('basic auth', async () => {
    const response = await request(server).get('/basic').auth('user', 'pass', { type: 'basic' });
    expect(response.status).toBe(200);
    expect(response.text).toBe('basic');
  });

  test('or - edge cases', async () => {
    try {
      await Middleware.or()({}, () => {});
    } catch (err) {
      expect(err.body).toEqual('Please provide at least two middleware functions to .or()');
    }

    try {
      await Middleware.or(Middleware.isAuthenticated())({}, () => {});
    } catch (err) {
      expect(err.body).toEqual('Please provide at least two middleware functions to .or()');
    }
  });

  test('or - auth and basic auth', async () => {
    let response = await request(server).get('/or').auth('user', 'pass', { type: 'basic' });
    expect(response.status).toBe(200);
    expect(response.text).toBe('basic');

    response = await request(server).get('/orauth').set('Cookie', cookie);
    expect(response.status).toBe(200);
    expect(response.text).toBe('authenticated');
  });

  test('or - controller error', async () => {
    const response = await request(server).get('/orerror').set('Cookie', cookie);
    console.log(response.body);
    expect(response.status).toBe(400);
  });

  // TODO: test hasPermissions / isAuthorized (session setup)
});
