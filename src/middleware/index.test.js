import * as Index from './index';

test('Validate', () => {
  expect(typeof Index.Validate).toEqual('object');
});

test('Response.handler', () => {
  expect(typeof Index.Response.handler).toEqual('function');
});

test('routes', () => {
  expect(typeof Index.routes).toEqual('function');
});

test('Mount', () => {
  expect(typeof Index.Mount).toEqual('object');
});

test('Init', () => {
  expect(typeof Index.Init).toEqual('object');
});


// TODO: test hasPermissions / isAuthorized (session setup)