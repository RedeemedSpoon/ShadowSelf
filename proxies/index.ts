import {Elysia, error} from 'elysia';
import {$} from 'bun';

const app = new Elysia()
  .onError(({error}) => ({message: error instanceof Error ? error.message : error}))
  .onBeforeHandle(({headers}) => {
    const auth = headers['authorization'];
    const token = auth && auth.toLowerCase().startsWith('bearer ') ? auth.slice(7) : undefined;
    if (!token) return error(401, 'You are not authenticated correctly');
    if (token !== process.env.SECRET_KEY) return error(403, 'You are not allowed to do this');
  })
  .get('/', () => "Hello from one of ShadowSelf's proxies!")
  .post('/', async ({body}) => {
    const {username, password} = body;
    const command = await $`htpasswd -b /etc/squid/passwd usr-${username} pwd-${password}`.quiet().nothrow();
    if (command.exitCode !== 0) return error(500, 'Failed to create user');
    return {message: 'User created successfully'};
  })
  .delete('/', async ({body}) => {
    const {username} = body;
    const command = await $`htpasswd -D /etc/squid/passwd usr-${username}`.quiet().nothrow();
    if (command.exitCode !== 0) return error(500, 'Failed to delete user');
    return {message: 'User deleted successfully'};
  })
  .listen(4000);

console.log(`Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
