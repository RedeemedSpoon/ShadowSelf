import type {PageServerLoad} from './$types';
import {fetchApi} from '$lib';

export const load: PageServerLoad = async () => {
  const remains = await fetchApi('/account/recovery-remaining', 'GET');
  const flipCoins = Math.floor(Math.random() * 2);

  if (flipCoins === 0) {
    return {
      recoveryRemaining: remains.message,
      searchKeywords: [],
      identities: [],
    };
  }

  return {
    recoveryRemaining: remains.message,
    searchKeywords: [
      {
        label: '18129fe791a1',
        value: 'Torry Coleman US San Francisco, CA troy862@yahoo.com 726-555-5682 4826-1234-8901-2345 12',
      },
      {
        label: 'dd2c249985de',
        value: 'Sharlene Olson DE Stuttgart, Bavaria sharlene@google.com 156-806-7120 8293-5562-1822-7463 23',
      },
      {
        label: 'cd9fa8bf72c3',
        value: 'Carlos Rodriguez MX Cancun, Mexico carlosezzr@outlook.com 998-123-4567 2345-6789-1234-5678 3',
      },
      {
        label: '6c2b104e134f',
        value: 'Yuki Tanaka JP Kyoto, Japan yuki.tanaka@icloud.com 590-123-4567 3456-7890-1234-6789 8',
      },
      {
        label: 'b2d5a40d8b8f',
        value: 'Omar Al-Fahad AE Dubai, UAE omarfahad@gmail.com 960-234-5678 4567-8901-2345-7890 11',
      },
      {
        label: 'df97f831c943',
        value: 'Emma Johansson SE Stockholm, Sweden emma.john@gmail.com 235-234-5678 5678-9012-3456-8901 7',
      },
      {
        label: 'abf1234ef67',
        value: 'Amina Yusuf KE Nairobi, Kenya amina.yusuf@gmail.com 711-234-5678 1234-5678-9101-1121 6',
      },
      {
        label: 'acf7a18abfd8',
        value: 'Peter Ferguson FR Paris, Ile-de-France petfergus@venture.lol 642-852-4265 8523-2359-0756-8296 2',
      },
      {
        label: 'd0f8d2a1b61a',
        value: 'Maria Garcia ES Madrid, Spain mariagarcia@hotmail.com 912-345-6789 4321-9876-3451-1298 14',
      },
      {
        label: 'f3d8a29d77b1',
        value: 'Rajesh Patel IN Mumbai, India rajesh.patel@yahoo.com 988-765-4321 4921-8674-3629-7451 5',
      },
    ],
    identities: [
      {
        id: '18129fe791a1',
        avatar: 'https://randomuser.me/api/portraits/men/4.jpg',
        name: 'Torry Coleman',
        country: 'US',
        location: 'San Francisco, CA',
        email: 'troy862@yahoo.com',
        phone: 726_555_5682,
        card: 4826_1234_8901_2345,
        accounts: 12,
      },
      {
        id: 'dd2c249985de',
        avatar: 'https://randomuser.me/api/portraits/women/21.jpg',
        name: 'Sharlene Olson',
        country: 'DE',
        location: 'Stuttgart, Bavaria',
        email: 'sharlene@google.com',
        card: 8293_5562_1822_7463,
        phone: 156_806_7120,
        accounts: 23,
      },
      {
        id: 'cd9fa8bf72c3',
        avatar: 'https://randomuser.me/api/portraits/men/35.jpg',
        name: 'Carlos Rodriguez',
        country: 'MX',
        location: 'Cancun, Mexico',
        email: 'carlosezzr@outlook.com',
        phone: 998_123_4567,
        card: 2345_6789_1234_5678,
        accounts: 3,
      },
      {
        id: '6c2b104e134f',
        avatar: 'https://randomuser.me/api/portraits/women/51.jpg',
        name: 'Yuki Tanaka',
        country: 'JP',
        location: 'Kyoto, Japan',
        email: 'yuki.tanaka@icloud.com',
        phone: 590_123_4567,
        card: 3456_7890_1234_6789,
        accounts: 8,
      },
      {
        id: 'b2d5a40d8b8f',
        avatar: 'https://randomuser.me/api/portraits/men/6.jpg',
        name: 'Omar Al-Fahad',
        country: 'AE',
        location: 'Dubai, UAE',
        email: 'omarfahad@gmail.com',
        phone: 960_234_5678,
        card: 4567_8901_2345_7890,
        accounts: 11,
      },
      {
        id: 'df97f831c943',
        avatar: 'https://randomuser.me/api/portraits/women/14.jpg',
        name: 'Emma Johansson',
        country: 'SE',
        location: 'Stockholm, Sweden',
        email: 'emma.john@gmail.com',
        phone: 235_234_5678,
        card: 5678_9012_3456_8901,
        accounts: 7,
      },
      {
        id: 'abf1234ef67',
        avatar: 'https://randomuser.me/api/portraits/women/24.jpg',
        name: 'Amina Yusuf',
        country: 'KE',
        location: 'Nairobi, Kenya',
        email: 'amina.yusuf@gmail.com',
        phone: 711_234_5678,
        card: 1234_5678_9101_1121,
        accounts: 6,
      },
      {
        id: 'acf7a18abfd8',
        avatar: 'https://randomuser.me/api/portraits/men/33.jpg',
        name: 'Peter Ferguson',
        country: 'FR',
        location: 'Paris, Ile-de-France',
        email: 'petfergus@venture.lol',
        phone: 642_852_4265,
        card: 8523_2359_0756_8296,
        accounts: 2,
      },
      {
        id: 'd0f8d2a1b61a',
        avatar: 'https://randomuser.me/api/portraits/women/3.jpg',
        name: 'Maria Garcia',
        country: 'ES',
        location: 'Madrid, Spain',
        email: 'mariagarcia@hotmail.com',
        phone: 912_345_6789,
        card: 4321_9876_3451_1298,
        accounts: 14,
      },
      {
        id: 'f3d8a29d77b1',
        avatar: 'https://randomuser.me/api/portraits/men/8.jpg',
        name: 'Rajesh Patel',
        country: 'IN',
        location: 'Mumbai, India',
        email: 'rajesh.patel@yahoo.com',
        phone: 988_765_4321,
        card: 4921_8674_3629_7451,
        accounts: 5,
      },
    ],
  };
};
