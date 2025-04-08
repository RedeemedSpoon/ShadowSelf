import type {Route} from '$type';
import listIdentities from './list-identities';

const routes: Route[] = [
  {
    title: 'list identities',
    description: listIdentities.description,
    url: '/',
    method: 'GET',
    code: listIdentities.code,
    response: listIdentities.response,
  },
];

export default routes;
