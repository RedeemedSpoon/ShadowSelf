import type {Actions} from './$types';

export const actions = {
  default: async ({request}) => {
    const data = await request.formData();
    const email = data.get('email') as string;

    if (email.match(/^[\w\-.]+@([\w-]+\.)+[\w-]{2,}$/gm) === null) {
      return {message: 'Please enter a valid email address.', type: 'alert'};
    }

    try {
      await fetch('/api/join', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email}),
      });
      return {message: 'Thanks for signing up!', type: 'success'};
    } catch {
      return {message: 'An error occurred. Please try again later.', type: 'alert'};
    }
  },
} satisfies Actions;
