import * as Regions from "./regions";

export type StorageZone = {
  readonly _tag: "StorageZone",
  region: Regions.StorageRegion,
  accessKey: string,
  name: string,

  // If this is set up, the reading will not goes into the API but it'll goes to
  // the associated PZ, it'll increase greatly the scalibility of the read & the
  // performance.
  // Especially if caching is activated on a PullZone.
  // optimized_reading_pz: null,
};

/**
 * Give the associated URL Address for a [StorageZone].
 *
 * @throws If the value is not a proper [StorageRegion].
 */
export function addr(value: StorageZone): URL {
  return new URL(`${Regions.addr(value.region)}${value.name}/`);
}

/**
 * Give the associated Name for a [StorageZone].
 *
 * @throws If the value is not a proper [StorageRegion].
 */
export function name(value: StorageZone): string {
  return value.name;
}

/**
 * Give the associated Authentification header with it's content.
 */
export function key(value: StorageZone): [string, string] {
  return ["AccessKey", value.accessKey]
}

/**
 * Connect to an associated [StorageZone]
 * 
 * ## Examples
 *
 * ### Listing files
 *
 * ```typescript
 *   import * as process from "node:process";
 *   import * as BunnyStorageSDK from "@bunny.net/storage-sdk";
 *   
 *   let sz_zone = process.env.STORAGE_ZONE;
 *   let access_key = process.env.STORAGE_ACCESS_KEY;
 *   
 *   let region = BunnyStorageSDK.regions.StorageRegion.Falkenstein;
 *   let sz = BunnyStorageSDK.zone.connect_with_accesskey(region, sz_zone, access_key);
 *   
 *   let list: BunnyStorageSDK.file.StorageFile[] = await BunnyStorageSDK.file.list(sz, "/");
 * ```
 *
 *
 */
export function connect_with_accesskey(region: Regions.StorageRegion, name: string, accessKey: string): StorageZone {
  return ({
    _tag: "StorageZone",
    region,
    name,
    accessKey,
  });
}

