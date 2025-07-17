import retrieveInformation from './retrieve-information';
import regeneratePicture from './regenerate-picture';
import updateInformation from './update-information';
import regenerateName from './regenerate-name';
import regenerateBio from './regenerate-bio';
import type {Route} from '$type';

const routes: Route[] = [
  {
    title: 'retrieve information',
    description: retrieveInformation.description,
    url: '/identity/:id',
    method: 'GET',
    code: retrieveInformation.code,
    response: retrieveInformation.response,
  },
  {
    title: 'regenerate name',
    description: regenerateName.description,
    url: '/identity/regenerate-name/:id',
    method: 'PATCH',
    code: regenerateName.code,
    response: regenerateName.response,
  },
  {
    title: 'regenerate bio',
    description: regenerateBio.description,
    url: '/identity/regenerate-bio/:id',
    method: 'PATCH',
    code: regenerateBio.code,
    response: regenerateBio.response,
  },
  {
    title: 'regenerate picture',
    description: regeneratePicture.description,
    url: '/identity/regenerate-picture/:id',
    method: 'PATCH',
    code: regeneratePicture.code,
    response: regeneratePicture.response,
  },
  {
    title: 'update information',
    description: updateInformation.description,
    url: '/identity/update/:id',
    method: 'PUT',
    code: updateInformation.code,
    response: updateInformation.response,
  },
];

export default routes;
