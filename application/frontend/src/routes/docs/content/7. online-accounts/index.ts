import retrieveAccounts from './retrieve-accounts';
import updateEncryption from './update-encryption';
import deleteAccount from './delete-account';
import editAccount from './edit-account';
import addAccount from './add-account';
import type {Route} from '$type';

const routes: Route[] = [
  {
    title: 'retrieve accounts',
    description: retrieveAccounts.description,
    url: '/account/:id',
    method: 'GET',
    code: retrieveAccounts.code,
    response: retrieveAccounts.response,
  },
  {
    title: 'add account',
    description: addAccount.description,
    url: '/account/add-account/:id',
    method: 'POST',
    code: addAccount.code,
    response: addAccount.response,
  },
  {
    title: 'edit account',
    description: editAccount.description,
    url: '/account/edit-account/:id',
    method: 'PUT',
    code: editAccount.code,
    response: editAccount.response,
  },
  {
    title: 'update encryption',
    description: updateEncryption.description,
    url: '/account/update-encryption/:id',
    method: 'PUT',
    code: updateEncryption.code,
    response: updateEncryption.response,
  },
  {
    title: 'delete account',
    description: deleteAccount.description,
    url: '/account/delete-account/:id',
    method: 'DELETE',
    code: deleteAccount.code,
    response: deleteAccount.response,
  },
];

export default routes;
