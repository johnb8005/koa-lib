import compose from 'koa-compose';
import passport from 'koa-passport';

// NOTE: { session: false } - because after successful authentication, Passport will establish a persistent login session
const config = { session: false };

// NOTE: can also be solved by just checking ctx.isAuthenticated() when working with sessions
const isAuthenticated = passport.authenticate('jwt', config);

const hasPermissions = permissions => async (ctx, next) => {
  const { auth } = ctx.state.user;
  const authorized = permissions.every(p => auth.includes(p));
  if (authorized) {
    await next();
  } else {
    //ctx.throw(401, {error: 'Unauthorized'});
    ctx.status = 401;
    ctx.body = {error: 'Unauthorized'};
  }
}
const isAuthorized = permissions => compose([isAuthenticated, hasPermissions(permissions)]);

// NOTE: assuming roles: user (default), admin; more roles: hasRole('admin')
const hasAdminRights = async (ctx, next) => {
  const { admin } = ctx.state.user;
  if (admin) {
    await next();
  } else {
    //ctx.throw(401, );
    ctx.status = 401;
    ctx.body = {error: 'Unauthorized'};
  }
}
const isAdmin = compose([isAuthenticated, hasAdminRights]);

export default {
  isAuthenticated,
  isAuthorized,
  isAdmin
};