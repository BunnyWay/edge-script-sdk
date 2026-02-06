/**
 * Cache Options for the CacheApi.match, CacheApi.matchAll, CacheApi.delete
 */
export type CacheOptions = {
  /**
   * A boolean value that specifies whether to ignore the query string in the URL. For example, if set to true the
   * ?value=bar part of https://example.com/?value=bar would be ignored when performing a match. It defaults to false.
   */
  ignoreSearch?: boolean | undefined;

  /**
   * When true, the request is considered to be a GET request regardless of its actual value. It defaults to false.
   */
  ignoreMethod?: boolean | undefined;
};

/**
 * CacheApi interface
 */
export interface CacheApi {
  /**
   * Takes a URL, retrieves it and adds the resulting response object to the given cache. This is functionally
   * equivalent to calling fetch(), then using put() to add the results to the cache.
   *
   * Note: add() will overwrite any key/value pair previously stored in the cache that matches the request.
   *
   * @example
   * cache
   *  .default
   *  .add(request);
   *
   * @param {Request | URL | string} request
   * @returns {Promise<undefined>}
   * @throws {TypeError} Returned if the URL scheme is not http or https.
   */
  add(request: Request | URL | string): Promise<undefined>;

  /**
   * Takes an array of URLs, retrieves them, and adds the resulting response objects to the given cache.
   *
   * @example
   * cache
   *  .default
   *  .addAll([new URL("example.com")]);
   *
   * @param {(Request | URL | string)[]} requests
   * @returns {Promise<undefined>}
   * @throws {TypeError} Returned if the URL scheme is not http or https.
   */
  addAll(requests: (Request | URL | string)[]): Promise<undefined>;

  /**
   * Finds the Cache entry whose key is the request, returning a Promise that resolves to true if a matching Cache
   * entry is found and deleted. If no Cache entry is found, the promise resolves to false.
   *
   * @example
   * cache
   *  .default
   *  .delete(""/images/image.png"")
   *  .then((successful) => {
   *    someUIUpdateFunction();
   *  });
   *
   * @param {Request | URL | string} request
   * @param {CacheOptions} [options]
   * @returns {Promise<boolean>} Resolves to true if a matching Cache entry is found and deleted
   */
  delete(
    request: Request | URL | string,
    options?: CacheOptions,
  ): Promise<boolean>;

  /**
   * Not Supported - this method is not supported and will always throw
   *
   * @throws {Error} Not Supported
   */
  keys(
    request?: Request | URL | string,
    options?: CacheOptions,
  ): Promise<Request[]>;

  /**
   * Returns a Promise that resolves to the response associated with the first matching request in the Cache object.
   *
   * Unlike the browser Cache API, BunnyEdgeScripting does not support the ignoreVary options on match().
   * You can accomplish this behavior by removing HTTP headers at put() time.
   *
   * @example
   * cache
   *  .default
   *  .match("/", { ignoreSearch: true })
   *  .then((responses) => {
   *    console.log(`Found ${responses.length} matching responses`);
   *  });
   *
   * @param {Request | URL | string} request The Request for which you are attempting to find responses in the Cache.
   * @param {CacheOptions} [options]
   * @returns {Promise<Response | undefined>} Returns the response from the cache or undefined if there is no entry
   */
  match(
    request: Request | URL | string,
    options?: CacheOptions,
  ): Promise<Response | undefined>;

  /**
   * Not Supported - this method is not supported and will always throw
   *
   * @throws {Error} Not Supported
   */
  matchAll(
    request: Request | URL | string,
    options?: CacheOptions,
  ): Promise<Response[]>;

  /**
   * Takes both a request and its response and adds it to the given cache.
   *
   * @example
   * fetch(url).then((response) => {
   *  if (!response.ok) {
   *     throw new TypeError("Bad response status");
   *  }
   *  return cache
   *    .default
   *    .put(url, response);
   * });
   *
   * @param {Request | URL | string} request
   * @param {Response} response
   * @returns {Promise<undefined>}
   */
  put(request: Request | URL | string, response: Response): Promise<undefined>;
}
