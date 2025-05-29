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
    const {username, password} = body as {username: string; password: string};

    await $`useradd ${username}`.nothrow().quiet();
    await $`echo ${username}:${password} | chpasswd`.nothrow().quiet();
    await $`htpasswd -b /etc/squid/passwd usr-${username} pwd-${password}`.nothrow().quiet();

    return {message: 'User created successfully'};
  })
  .delete('/', async ({body}) => {
    const {username} = body as {username: string};

    await $`userdel ${username}`.nothrow().quiet();
    await $`htpasswd -D /etc/squid/passwd usr-${username}`.nothrow().quiet();

    return {message: 'User deleted successfully'};
  })
  .listen(4000);

console.log(`Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
