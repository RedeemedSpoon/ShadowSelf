export interface Notification {
  id: number | null;
  message: string;
  type: 'success' | 'alert' | 'info';
}
