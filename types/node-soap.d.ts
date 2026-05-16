declare module 'node-soap' {
  export interface Server {
    handleRequest(req: unknown, onResponse: (xml: string) => void, onError: (e: Error) => void): void;
  }

  export interface ListenOptions {
    path: string;
    services: unknown;
    xml: string;
  }

  export function listen(
    server: unknown,
    options: ListenOptions,
    services: unknown,
    wsdl: string,
    callback: (err: Error | null, server: Server) => void,
  ): Server;

  export function createClient(
    url: string,
    callback: (err: Error | null, client: SoapClient) => void,
  ): void;

  export function createClientAsync(url: string): Promise<SoapClient>;

  export interface SoapClient {
    [operation: string]: (args: unknown, callback: (err: Error | null, result: unknown) => void) => void;
  }
}
