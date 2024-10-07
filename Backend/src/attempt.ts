import type {AttemptFn} from './types';

export default async function attempt(func: Promise<unknown>, SuccessMessage: string): Promise<AttemptFn> {
  try {
    await func;
    return {message: SuccessMessage, type: 'success'};
  } catch (error: unknown) {
    if (error instanceof Error) {
      return {message: error.message, type: 'alert'};
    }
    return {message: 'Something went wrong', type: 'alert'};
  }
}
