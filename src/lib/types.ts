export interface Notification {
  id: number | null;
  message: string | Error;
  type: 'success' | 'alert' | 'info';
}
