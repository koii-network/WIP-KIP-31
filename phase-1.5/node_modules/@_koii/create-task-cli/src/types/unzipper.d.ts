// src/types/unzipper.d.ts
declare module 'unzipper' {
    export function Extract(options: { path: string }): NodeJS.ReadWriteStream;
  }
  