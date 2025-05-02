import {Elysia, error} from 'elysia';

const app = new Elysia()
  .onError(({error}) => ({message: error instanceof Error ? error.message : error}))
  .onBeforeHandle(({headers}) => {
    const auth = headers['authorization'];
    const token = auth && auth.toLowerCase().startsWith('bearer ') ? auth.slice(7) : undefined;
    if (!token) return error(401, 'You are not authenticated correctly');
    if (token !== process.env.SECRET_KEY) return error(403, 'You are not allowed to do this');
  })
  .get('/', () => "Hello from one of ShadowSelf's proxies!")
  .post('/', async ({body}) => console.log(body))
  .delete('/', async ({body}) => console.log(body))
  .listen(4000);

console.log(`Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
