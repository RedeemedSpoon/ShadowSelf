import {Elysia, t} from 'elysia';
import {mkdir, open, rename, rm} from 'node:fs/promises';
import {join} from 'node:path';

const secret = process.env.SECRET_KEY;
if (!secret) throw new Error('SECRET_KEY is required');

const authDirectory = process.env.PROXY_AUTH_DIRECTORY || '/var/lib/shadowself/proxy-auth';
await mkdir(authDirectory, {recursive: true, mode: 0o755});
const passwordFile = join(authDirectory, 'passwd');
const initialFile = await open(passwordFile, 'a', 0o644);
await initialFile.close();

let pendingWrite = Promise.resolve();

const app = new Elysia({serve: {maxRequestBodySize: 4096}})
  .onError(({code, set}) => {
    set.status = code === 'VALIDATION' ? 400 : 500;
    return {message: code === 'VALIDATION' ? 'Invalid proxy account' : 'Proxy account operation failed'};
  })
  .onBeforeHandle(({headers, set}) => {
    const auth = headers['authorization'];
    const token = auth && auth.toLowerCase().startsWith('bearer ') ? auth.slice(7) : undefined;

    if (!token) {
      set.status = 401;
      return 'You are not authenticated correctly';
    }

    if (token !== secret) {
      set.status = 403;
      return 'You are not permitted to access this route';
    }
  })
  .get('/', () => "Hello from one of ShadowSelf's proxies!")
  .post(
    '/',
    async ({body}) => {
      await updatePassword(body.username, body.password);

      return {message: 'User created successfully'};
    },
    {body: t.Object({username: t.String({pattern: '^[a-f0-9]{12}$'}), password: t.String({pattern: '^[a-f0-9]{32}$'})})},
  )
  .delete(
    '/',
    async ({body}) => {
      await updatePassword(body.username);

      return {message: 'User deleted successfully'};
    },
    {body: t.Object({username: t.String({pattern: '^[a-f0-9]{12}$'})})},
  )
  .listen(Number(process.env.PORT || 4000));

console.log(`Elysia is running at ${app.server?.hostname}:${app.server?.port}`);

async function updatePassword(username: string, password?: string) {
  const write = pendingWrite.then(async () => {
    const entries = (await Bun.file(passwordFile).text()).split('\n').filter(Boolean);
    const remaining = entries.filter((line) => !line.startsWith(`usr-${username}:`));
    if (password) remaining.push(`usr-${username}:${await Bun.password.hash(`pwd-${password}`, {algorithm: 'bcrypt', cost: 12})}`);
    else if (remaining.length === entries.length) return;

    const temporary = join(authDirectory, `.passwd-${crypto.randomUUID()}`);
    try {
      const file = await open(temporary, 'wx', 0o644);
      try {
        await file.writeFile(remaining.length ? `${remaining.join('\n')}\n` : '');
        await file.sync();
      } finally {
        await file.close();
      }
      await rename(temporary, passwordFile);
    } finally {
      await rm(temporary, {force: true});
    }
  });
  pendingWrite = write.catch(() => {});
  await write;
}
