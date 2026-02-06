import { CacheApi, CacheOptions } from "./types.ts";

/**
 *
 * @param {string} cache
 * @returns {CacheApi}
 */
function open(cache: string): Promise<CacheApi>;
async function open(_cache: string): Promise<CacheApi> {
  return root;
}

const root: CacheApi = {
  add: async (_request: Request | URL | string): Promise<undefined> => {
    throw new Error("Not Implemented");
  },
  addAll: async (_requests: (Request | URL | string)[]): Promise<undefined> => {
    throw new Error("Not Implemented");
  },
  delete: async (
    _request: Request | URL | string,
    _options?: CacheOptions,
  ): Promise<boolean> => {
    throw new Error("Not Implemented");
  },
  keys: async (
    _request?: Request | URL | string,
    _options?: CacheOptions,
  ): Promise<Request[]> => {
    throw new Error("Not Supported");
  },
  match: async (
    _request: Request | URL | string,
    _options?: CacheOptions,
  ): Promise<Response | undefined> => {
    throw new Error("Not Implemented");
  },
  matchAll: async (
    _request: Request | URL | string,
    _options?: CacheOptions,
  ): Promise<Response[]> => {
    throw new Error("Not Supported");
  },
  put: async (
    _request: Request | URL | string,
    _response: Response,
  ): Promise<undefined> => {
    throw new Error("Not Implemented");
  },
};

export { open, root as default };
