import listIdentities from './list-identities';
import listProxies from './list-proxies';
import type {Route} from '$type';

const routes: Route[] = [
  {
    title: 'list identities',
    description: listIdentities.description,
    url: '/',
    method: 'GET',
    code: listIdentities.code,
    response: listIdentities.response,
  },
  {
    title: 'list proxies',
    description: listProxies.description,
    url: '/',
    method: 'GET',
    code: listProxies.code,
    response: listProxies.response,
  },
];

export default routes;
