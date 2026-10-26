import {ApiError} from '@core/security';
import type {PhoneProvider} from '@type';

function unavailable(): never {
  throw new ApiError(503, 'provider_unavailable', 'Phone service is unavailable until a provider is configured');
}

export const phoneProvider: PhoneProvider = {
  conversations: unavailable,
  conversation: unavailable,
  send: unavailable,
  removeConversation: unavailable,
  available: unavailable,
};
