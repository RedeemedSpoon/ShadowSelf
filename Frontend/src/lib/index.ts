import {notification} from '$store';
import type {Notification} from '$types';
import {get} from 'svelte/store';

export function notify(message: Notification['message'], type: Notification['type'] = 'info') {
  const id = Math.floor(Math.random() * 10000);
  notification.set({message, type, id});
  setTimeout(() => {
    if (get(notification).id === id) {
      notification.set({id: null, message: '', type: 'info'});
    }
  }, 5000);
}
