export interface Link {
  url: string;
  rel: string;
  [queryParam: string]: string;
}

export interface Links {
  [rel: string]: Link;
}

export interface Options {
  maxHeaderLength?: number
  throwOnMaxHeaderLengthExceeded?: boolean
}

declare function parseLinkHeader(linkHeader: string | null | undefined, options?: Options): Links | null

export { parseLinkHeader }
