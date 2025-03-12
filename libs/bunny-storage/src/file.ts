import { z } from 'zod';
import * as StorageZone from "./zone";
import { StorageFileListing, StorageFileSchemaDescribe } from './api';
import { ReadableStream } from 'stream/web';

export const ZoneSchema = z.union([
  z.literal("SE"),
  z.literal("CZ"),
  z.literal("UK"),
  z.literal("ES"),
  z.literal("NY"),
  z.literal("WA"),
  z.literal("MI"),
  z.literal("LA"),
  z.literal("JH"),
  z.literal("HK"),
  z.literal("BR"),
  z.literal("SG"),
  z.literal("JP"),
  z.literal("SYD")
]);

export type Zone = z.infer<typeof ZoneSchema>;

/**
 * A [StorageFile] stored in a Storage Zone.
 *
 * Can be a Folder (fake folder)
 */
export type StorageFile = {
  readonly _tag: "StorageFile",
  /**
   * The unique GUID of the file.
   */
  guid: string;
  /**
   * The associated ID of the User that holds the file.
   */
  userId: string;
  /**
   * The date when the file was last modified with a ISO 8601 Date.
   */
  lastChanged: Date;
  /**
   * The date when the file was created.
   */
  dateCreated: Date;
  /**
   * The name of the storage zone to which the file is linked.
   */
  storageZoneName: string;
  /**
   * The path to the object
   */
  path: string;
  /**
   * The object name
   */
  objectName: string;
  /**
   * The total length in bytes.
   */
  length: number;
  /**
   * The storage zone internal ID
   */
  storageZoneId: number;
  /**
   * If this is a directory or a file
   */
  isDirectory: boolean;
  /**
   * The server internal ID where the file is stored in your current resolution.
   */
  serverId: number;
  /**
   * The associated checksum of the file you want.
   */
  checksum: string | null;
  /**
   * The zone where the file is actually replicated.
   */
  replicatedZones: Zone[] | null;
  // ArrayNumber
  /**
   * The associated content-type of the file.
   */
  contentType: string;
  /**
   * Calling this function will fire a Promise that you'll be able to await to
   * have the stream which will fetch the content of the body of the file you
   * want.
   */
  data: () => Promise<{
    stream: ReadableStream<Uint8Array>;
    response: Response;
    length?: number;
  }>,
};

/**
 * Fetch the metadata of a file from a [StorageZone], to have the data of this
 * file, you'll need to download it.
 *
 * You can download the content of a [StorageFile] by awaitng the `data()`
 * function of this file.
 *
 * @throws
 *
 * ## Example
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
 *   let file: BunnyStorageSDK.file.StorageFile = await BunnyStorageSDK.file.get(sz, "/somefile");
 *   // Here the body will be in the `stream` file, you can collect it in whatever
 *   // way you need.
 *   // The response will contain the rest of the metadata available.
 *   let promise_to_fetch_the_file: { stream: ReadableStream<Uint8Array>; response: Response; length?: number; } = await file.data();
 * ```
 */
export async function get(storageZone: StorageZone.StorageZone, path: string): Promise<StorageFile> {
  const url = StorageZone.addr(storageZone);
  url.pathname = `${url.pathname}${path}`;
  const [auth_header, key] = StorageZone.key(storageZone);
  const response = await fetch(url, { method: "DESCRIBE", headers: { 'Accept': 'application/json', [auth_header]: key } });

  if (!response.ok) {
    throw statusCodeToException(storageZone, response.status, path);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawData: { LastChanged?: string, DateCreated?: string } = await response.json() as unknown as any;
  const processedData = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...rawData as unknown as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    LastChanged: new Date(rawData.LastChanged as unknown as any),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    DateCreated: new Date(rawData.DateCreated as unknown as any)
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = StorageFileSchemaDescribe.parse(processedData as unknown as any);

  return ({
    _tag: "StorageFile",
    guid: result.Guid,
    userId: result.UserId,
    lastChanged: result.LastChanged,
    dateCreated: result.DateCreated,
    storageZoneName: result.StorageZoneName,
    path: result.Path,
    objectName: result.ObjectName,
    length: result.Length,
    storageZoneId: result.StorageZoneId,
    isDirectory: result.IsDirectory,
    serverId: result.ServerId,
    checksum: result.Checksum,
    replicatedZones: result.ReplicatedZones,
    contentType: result.ContentType,
    data: () => download(storageZone, path),
  })
}

/**
 * List files and folders in a directory from a [StorageZone].
 *
 * @throws
 */
export async function list(storageZone: StorageZone.StorageZone, path: string): Promise<StorageFile[]> {
  const url = StorageZone.addr(storageZone);
  const directory_path = path.endsWith("/") ? path : `${path}/`;
  url.pathname = `${url.pathname}${directory_path}`;
  const [auth_header, key] = StorageZone.key(storageZone);
  const response = await fetch(url, { method: "GET", headers: { 'Accept': 'application/json', [auth_header]: key } });

  if (!response.ok) {
    throw statusCodeToException(storageZone, response.status, path);
  }

  const j = await response.json();

  try {
    StorageFileListing.parse(j);
  } catch (e) {
    console.error(e);
  }

  return StorageFileListing.parse(j).map(result => ({
    _tag: "StorageFile",
    guid: result.Guid,
    userId: result.UserId,
    lastChanged: result.LastChanged,
    dateCreated: result.DateCreated,
    storageZoneName: result.StorageZoneName,
    path: result.Path,
    objectName: result.ObjectName,
    length: result.Length,
    storageZoneId: result.StorageZoneId,
    isDirectory: result.IsDirectory,
    serverId: result.ServerId,
    checksum: result.Checksum,
    replicatedZones: result.ReplicatedZones,
    contentType: result.ContentType,
    data: () => download(storageZone, result.Path),
  }));
}

/**
 * Remove files and folders in a directory from a [StorageZone].
 *
 * @throws
 */
export async function remove(storageZone: StorageZone.StorageZone, path: string): Promise<boolean> {
  const url = StorageZone.addr(storageZone);
  url.pathname = `${url.pathname}${path}`;

  const [auth_header, key] = StorageZone.key(storageZone);
  const response = await fetch(url, { method: "DELETE", headers: { [auth_header]: key } });

  return response.ok;
}

/**
 * Create a new Directory in the [StorageZone].
 *
 * @throws
 */
export async function createDirectory(storageZone: StorageZone.StorageZone, path: string): Promise<boolean> {
  const url = StorageZone.addr(storageZone);
  const directory_path = path.endsWith("/") ? path : `${path}/`;
  url.pathname = `${url.pathname}${directory_path}`;
  const [auth_header, key] = StorageZone.key(storageZone);
  const response = await fetch(url, { method: "PUT", headers: { [auth_header]: key } });

  return response.ok;
}

/**
 * Remove recursively a Directory in the [StorageZone].
 *
 * @throws
 */
export async function removeDirectory(storageZone: StorageZone.StorageZone, path: string): Promise<boolean> {
  const url = StorageZone.addr(storageZone);
  const directory_path = path.endsWith("/") ? path : `${path}/`;
  url.pathname = `${url.pathname}${directory_path}`;
  const [auth_header, key] = StorageZone.key(storageZone);
  const response = await fetch(url, { method: "DELETE", headers: { [auth_header]: key } });

  return response.ok;
}


export type UploadOptions = {
  /**
   * The SHA256 Checksum associated to the data you want to send. If null then
   * the server will automatically calculate it.
   */
  sha256Checksum?: string;
  /**
   * You can override the content-type of the file you upload with this option.
   */
  contentType?: string;
};

/**
 * Upload a Stream to a [StorageZone].
 * Can be used while asynchronously reading a file or reading a network call.
 *
 * @throws
 */

export async function upload(storageZone: StorageZone.StorageZone, path: string, stream: ReadableStream<Uint8Array>, options?: UploadOptions): Promise<boolean>;
export async function upload(storageZone: StorageZone.StorageZone, path: string, stream: ReadableStream<Uint8Array>): Promise<boolean>;
export async function upload(storageZone: StorageZone.StorageZone, path: string, stream: ReadableStream<Uint8Array>, options?: UploadOptions): Promise<boolean> {
  const url = StorageZone.addr(storageZone);
  url.pathname = `${url.pathname}${path}`;

  const [auth_header, key] = StorageZone.key(storageZone);
  const headers = {
    [auth_header]: key,
    'Content-Type': "application/octet-stream"
  };

  if (options?.contentType) headers["Override-Content-Type"] = options!.contentType!;
  if (options?.sha256Checksum) headers["Checksum"] = options!.sha256Checksum!;

  const response = await fetch(url, { method: "PUT", headers, body: stream, duplex: "half" });

  if (!response.ok) {
    throw statusCodeToException(storageZone, response.status, path);
  }

  return response.ok;
}

/**
 * Download a Stream to a [StorageZone].
 *
 * @throws
 */
export async function download(storageZone: StorageZone.StorageZone, path: string): Promise<{
  stream: ReadableStream<Uint8Array>;
  response: Response;
  length?: number;
}> {
  const url = StorageZone.addr(storageZone);
  url.pathname = `${url.pathname}${path}`;

  const [auth_header, key] = StorageZone.key(storageZone);
  const response = await fetch(url, { method: "GET", headers: { [auth_header]: key } });

  if (!response.ok) {
    throw statusCodeToException(storageZone, response.status, path);
  }

  const contentLength = response.headers.has("content-length")
    ? parseInt(response.headers.get("content-length")!)
    : undefined;

  if (!response.body) {
    // TODO: Rework this part
    throw new Error("Response has no body");
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stream: ReadableStream<Uint8Array> = response.body as unknown as any;


  return ({ stream, response, length: contentLength });
}


function statusCodeToException(storageZone: StorageZone.StorageZone, status: number, path: string): Error {
  switch (status) {
    case 404:
      return new Error(`File not found: ${path}`);
    case 400:
      return new Error("Unable to upload file. Either invalid path specified, either provided checksum invalid");
    case 401:
      return new Error(
        `Unauthorized access to storage zone: ${StorageZone.name(storageZone)}`,
      );
    default:
      return new Error("An unknown error has occurred during the request.");
  }
}
