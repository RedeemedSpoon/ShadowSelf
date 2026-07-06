declare module '@fontsource-variable/fira-code';
declare module '@fontsource-variable/inter';

declare module 'ws' {
  export default class WebSocket {
    constructor(url: string, options?: {headers?: Record<string, string>});
    on(event: 'open', listener: () => void): void;
    on(event: 'message', listener: (data: string) => void): void;
    ping(): void;
  }
}

declare module 'hpagent' {
  export class HttpsProxyAgent {
    constructor(options: {proxy: string});
  }
}
