import {Elysia} from 'elysia';
import {$} from 'bun';

const app = new Elysia()
  .onError(({error}) => ({message: error instanceof Error ? error.message : error}))
  .onBeforeHandle(({headers, set}) => {
    const auth = headers['authorization'];
    const token = auth && auth.toLowerCase().startsWith('bearer ') ? auth.slice(7) : undefined;

    if (!token) {
      set.status = 401;
      return 'You are not authenticated correctly';
    }

    if (token !== process.env.SECRET_KEY) {
      set.status = 403;
      return 'You are not permitted to access this route';
    }
  })
  .get('/', () => "Hello from one of ShadowSelf's proxies!")
  .post('/', async ({body}) => {
    const {username, password} = body as {username: string; password: string};
    await $`htpasswd -b /etc/squid/passwd usr-${username} pwd-${password}`.nothrow().quiet();
    return {message: 'User created successfully'};
  })
  .delete('/', async ({body}) => {
    const {username} = body as {username: string};
    await $`htpasswd -D /etc/squid/passwd usr-${username}`.nothrow().quiet();
    return {message: 'User deleted successfully'};
  })
  .listen(4000);

console.log(`Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
