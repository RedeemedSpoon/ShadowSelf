import type {PageServerLoad} from './$types';

export const load: PageServerLoad = () => {
  return {
    keywords: [
      {label: 'Sharlene', value: 'DE'},
      {label: 'Peter', value: 'FR'},
      {label: 'Troy', value: 'US'},
    ],
    identities: [
      {
        id: 'dd2c249985de',
        avatar: 'https://randomuser.me/api/portraits/women/27.jpg',
        name: 'Sharlene Olson',
        country: 'DE',
        location: 'Stuttgart, baden',
        email: 'sharlene@google.com',
        card: 8293_5562_1822_7463,
        wallet: '16cZ4Qvd13ZuTGN6CsMJhJLUjoetvRDdPU',
        phone: 156_806_7120,
      },
      {
        id: 'acf7a18abfd8',
        avatar: 'https://randomuser.me/api/portraits/men/33.jpg',
        name: 'Peter Ferguson',
        country: 'FR',
        location: 'Paris, Ile-de-France',
        email: 'fergus@venture.lol',
        phone: 642_852_4265,
        card: 8523_2359_0756_8296,
        wallet: 'xqcZ4Q4513ZuTGzd5sMJhJLzjoetvRDdnE',
      },
      {
        id: '18129fe791a1',
        avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
        name: 'Troy Cruz',
        country: 'US',
        location: 'San Francisco, CA',
        email: 'troy862@yahoo.com',
        phone: 726_555_5682,
        card: 4826_1234_8901_2345,
        wallet: '86cZ4Qvd13ZuTGN6ssMJhJLUvfetvRDd89',
      },
    ],
  };
};
