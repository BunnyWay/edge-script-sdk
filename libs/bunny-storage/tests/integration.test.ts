import * as process from "node:process";
import * as ULID from "ulid";
import * as BunnyStorageSDK from "../src/lib.ts";
import { ReadableStream } from 'stream/web';
import * as crypto from "crypto";

const init_generation_id = ULID.ulid();
const base_path = `/tests/${init_generation_id}`;

function pathFromGenerationId(): string {
  return `${base_path}/${ULID.ulid()}/`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Computes the SHA-256 checksum of a ReadableStream
 * @param stream The ReadableStream to compute the checksum for
 * @returns A Promise that resolves to the SHA-256 checksum as a hex string
 */
async function computeSha256Checksum(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const hash = crypto.createHash('sha256');

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      hash.update(value);
    }

    return hash.digest('hex');
  } finally {
    reader.releaseLock();
  }
}

/**
 * Creates a ReadableStream of random bytes
 * @param size The number of bytes to generate
 * @param chunkSize The size of each chunk (default: 1024)
 * @returns A ReadableStream containing random bytes
 */
function createRandomByteStream(size: number, chunkSize: number = 1024): ReadableStream<Uint8Array> {
  let bytesGenerated = 0;

  return new ReadableStream({
    start(_controller) { },
    pull(controller) {
      if (bytesGenerated >= size) {
        controller.close();
        return;
      }

      const remainingBytes = size - bytesGenerated;
      const currentChunkSize = Math.min(chunkSize, remainingBytes);
      const chunk = new Uint8Array(currentChunkSize);

      // Fill with random bytes
      for (let i = 0; i < currentChunkSize; i++) {
        chunk[i] = Math.floor(Math.random() * 256);
      }

      controller.enqueue(chunk);
      bytesGenerated += currentChunkSize;
    }
  });
}

describe('Integration test with Storage', () => {
  describe('List', () => {
    it('The list should be a single tests forlder', async () => {
      let sz_zone = process.env.STORAGE_ZONE!;
      let access_key = process.env.STORAGE_ACCESS_KEY!;

      let sz = BunnyStorageSDK.zone.connect_with_accesskey(BunnyStorageSDK.regions.StorageRegion.Falkenstein, sz_zone, access_key);

      let list = await BunnyStorageSDK.file.list(sz, "/");
      expect(list.map(x => x.objectName)).toMatchSnapshot();
    });
  });
  describe('Create', () => {
    it('Let\'s create a file', async () => {
      const generation_id = pathFromGenerationId();
      let sz_zone = process.env.STORAGE_ZONE!;
      let access_key = process.env.STORAGE_ACCESS_KEY!;

      let sz = BunnyStorageSDK.zone.connect_with_accesskey(BunnyStorageSDK.regions.StorageRegion.Falkenstein, sz_zone, access_key);

      {
        let result = await BunnyStorageSDK.file.createDirectory(sz, generation_id);
        expect(result).toBeTruthy();
      }

      let random_bytes_10kb: ReadableStream<Uint8Array> = createRandomByteStream(1024 * 10);

      {
        let result = await BunnyStorageSDK.file.upload(sz, `${generation_id}new_file`, random_bytes_10kb);
        expect(result).toBeTruthy();
      }

      let list = await BunnyStorageSDK.file.list(sz, generation_id);
      expect(list.length).toStrictEqual(1);
      const first = list[0];
      expect(first.objectName).toBe("new_file");
    });

    it('Fail to create a proper file with invalid checksum', async () => {
      const generation_id = pathFromGenerationId();
      let sz_zone = process.env.STORAGE_ZONE!;
      let access_key = process.env.STORAGE_ACCESS_KEY!;

      let sz = BunnyStorageSDK.zone.connect_with_accesskey(BunnyStorageSDK.regions.StorageRegion.Falkenstein, sz_zone, access_key);

      {
        let result = await BunnyStorageSDK.file.createDirectory(sz, generation_id);
        expect(result).toBeTruthy();
      }

      let random_bytes_10kb: ReadableStream<Uint8Array> = createRandomByteStream(1024 * 10);

      try {
        await BunnyStorageSDK.file.upload(sz, `${generation_id}new_file`, random_bytes_10kb, { sha256Checksum: "12" });
        // Should not be here.
        expect(false).toBeTruthy();
      } catch (e) {
        expect(e).toMatchSnapshot("invalid_fail_file_1");
      }

      let list = await BunnyStorageSDK.file.list(sz, generation_id);
      expect(list.length).toStrictEqual(0);
    });

    it('Able to create a proper file with a proper checksum', async () => {
      const generation_id = pathFromGenerationId();
      let sz_zone = process.env.STORAGE_ZONE!;
      let access_key = process.env.STORAGE_ACCESS_KEY!;

      let sz = BunnyStorageSDK.zone.connect_with_accesskey(BunnyStorageSDK.regions.StorageRegion.Falkenstein, sz_zone, access_key);

      {
        let result = await BunnyStorageSDK.file.createDirectory(sz, generation_id);
        expect(result).toBeTruthy();
      }

      // Ugly shit but will give us the test we want so be it.
      let random_bytes_1kb: ReadableStream<Uint8Array> = createRandomByteStream(1024);
      const chunks: Uint8Array[] = [];

      // Collect chunks
      const reader = random_bytes_1kb.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      const streamForChecksum = new ReadableStream({
        start(controller) {
          chunks.forEach(chunk => controller.enqueue(chunk));
          controller.close();
        }
      });

      const streamForUpload = new ReadableStream({
        start(controller) {
          chunks.forEach(chunk => controller.enqueue(chunk));
          controller.close();
        }
      });

      const sha256Checksum = await computeSha256Checksum(streamForChecksum);

      {
        let result = await BunnyStorageSDK.file.upload(sz, `${generation_id}new_file`, streamForUpload, { sha256Checksum });
        expect(result).toBeTruthy();
      }

      let list = await BunnyStorageSDK.file.list(sz, generation_id);
      expect(list.length).toStrictEqual(1);
      const first = list[0];
      expect(first.objectName).toBe("new_file");
    });
  });

  describe('Download', () => {
    it('Let\'s create a file', async () => {
      const generation_id = pathFromGenerationId();
      let sz_zone = process.env.STORAGE_ZONE!;
      let access_key = process.env.STORAGE_ACCESS_KEY!;

      let sz = BunnyStorageSDK.zone.connect_with_accesskey(BunnyStorageSDK.regions.StorageRegion.Falkenstein, sz_zone, access_key);

      {
        let result = await BunnyStorageSDK.file.createDirectory(sz, generation_id);
        expect(result).toBeTruthy();
      }

      let random_bytes_10kb: ReadableStream<Uint8Array> = createRandomByteStream(1024 * 10);

      {
        let result = await BunnyStorageSDK.file.upload(sz, `${generation_id}new_file`, random_bytes_10kb);
        expect(result).toBeTruthy();
      }

      let list = await BunnyStorageSDK.file.list(sz, generation_id);
      expect(list.length).toStrictEqual(1);
      const first = list[0];
      expect(first.objectName).toBe("new_file");

      {
        let result = await BunnyStorageSDK.file.download(sz, `${generation_id}new_file`);
        expect(result.length).toStrictEqual(1024 * 10);
      }
    });
  });

  describe('Delete a file', () => {
    it('Let\'s create a file and delete it', async () => {
      const generation_id = pathFromGenerationId();
      let sz_zone = process.env.STORAGE_ZONE!;
      let access_key = process.env.STORAGE_ACCESS_KEY!;

      let sz = BunnyStorageSDK.zone.connect_with_accesskey(BunnyStorageSDK.regions.StorageRegion.Falkenstein, sz_zone, access_key);

      {
        let result = await BunnyStorageSDK.file.createDirectory(sz, generation_id);
        expect(result).toBeTruthy();
      }

      let random_bytes_10kb: ReadableStream<Uint8Array> = createRandomByteStream(1024 * 10);

      {
        let result = await BunnyStorageSDK.file.upload(sz, `${generation_id}new_file`, random_bytes_10kb);
        expect(result).toBeTruthy();
      }

      // If we trigger the delete just after, you could have a slight race
      // condition that would not properly delete it.
      await sleep(1000);

      {
        let list = await BunnyStorageSDK.file.list(sz, generation_id);
        expect(list.length).toStrictEqual(1);
        const first = list[0];
        expect(first.objectName).toBe("new_file");
      }


      {
        let result = await BunnyStorageSDK.file.remove(sz, `${generation_id}new_file`);
        expect(result).toBeTruthy();
      }

      {
        let list = await BunnyStorageSDK.file.list(sz, generation_id);
        expect(list.length).toStrictEqual(0);
      }
    });
  });

  afterAll(async () => {
    // Auto clean up tests artifacts
    let sz_zone = process.env.STORAGE_ZONE!;
    let access_key = process.env.STORAGE_ACCESS_KEY!;

    let sz = BunnyStorageSDK.zone.connect_with_accesskey(BunnyStorageSDK.regions.StorageRegion.Falkenstein, sz_zone, access_key);
    let result = await BunnyStorageSDK.file.removeDirectory(sz, base_path);
    expect(result).toBeTruthy();
  })
});
