declare module 'dropbox' {
    export class Dropbox {
      constructor(options: { accessToken: string });
      filesUpload(arg: {
        path: string;
        contents: Buffer;
      }): Promise<any>;
    }
  }