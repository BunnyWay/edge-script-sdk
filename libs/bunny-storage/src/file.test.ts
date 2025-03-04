
import * as File from './file';
import * as Zone from './zone';
import * as Regions from './regions';
import { ReadableStream } from 'stream/web';

// Mock fetch globally
global.fetch = jest.fn();

describe('StorageFile operations', () => {
  let mockStorageZone: Zone.StorageZone;

  beforeEach(() => {
    mockStorageZone = Zone.connect_with_accesskey(
      Regions.StorageRegion.Falkenstein,
      'test-zone',
      'test-access-key'
    );

    // Reset mocks before each test
    (global.fetch as jest.Mock).mockReset();
  });

  describe('get function', () => {
    it('should fetch a file successfully', async () => {
      const mockResponse = {
        Guid: '123',
        UserId: 'user1',
        LastChanged: '2023-01-01T00:00:00Z',
        DateCreated: '2022-01-01T00:00:00Z',
        StorageZoneName: 'test-zone',
        Path: '/test/path',
        ObjectName: 'test-file.txt',
        Length: 100,
        StorageZoneId: 1,
        IsDirectory: false,
        ServerId: 1,
        Checksum: 'abc123',
        ReplicatedZones: 'UK,NY',
        ContentType: 'text/plain'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockResponse)
      });

      const result = await File.get(mockStorageZone, '/test/path/test-file.txt');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(URL),
        expect.objectContaining({
          method: 'DESCRIBE',
          headers: {
            'Accept': 'application/json',
            'AccessKey': 'test-access-key'
          }
        })
      );

      expect(result).toEqual(expect.objectContaining({
        _tag: 'StorageFile',
        guid: '123',
        userId: 'user1',
        path: '/test/path',
        objectName: 'test-file.txt',
        length: 100,
        isDirectory: false,
        replicatedZones: ['UK', 'NY'],
        contentType: 'text/plain'
      }));

      expect(result.lastChanged).toBeInstanceOf(Date);
      expect(result.dateCreated).toBeInstanceOf(Date);
    });

    it('should throw an error when file is not found', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      await expect(File.get(mockStorageZone, '/not-found.txt')).rejects.toThrow('File not found');
    });
  });

  describe('list function', () => {
    it('should list files in a directory', async () => {
      const mockResponse = [
        {
          Guid: '123',
          UserId: 'user1',
          LastChanged: '2023-01-01T00:00:00Z',
          DateCreated: '2022-01-01T00:00:00Z',
          StorageZoneName: 'test-zone',
          Path: '/test/path',
          ObjectName: 'test-file1.txt',
          Length: 100,
          StorageZoneId: 1,
          IsDirectory: false,
          ServerId: 1,
          Checksum: 'abc123',
          ReplicatedZones: 'UK,NY',
          ContentType: 'text/plain'
        },
        {
          Guid: '456',
          UserId: 'user1',
          LastChanged: '2023-01-02T00:00:00Z',
          DateCreated: '2022-01-02T00:00:00Z',
          StorageZoneName: 'test-zone',
          Path: '/test/path',
          ObjectName: 'test-folder',
          Length: 0,
          StorageZoneId: 1,
          IsDirectory: true,
          ServerId: 1,
          Checksum: null,
          ReplicatedZones: null,
          ContentType: 'application/octet-stream'
        }
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockResponse)
      });

      const result = await File.list(mockStorageZone, '/test/path');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(URL),
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'AccessKey': 'test-access-key'
          }
        })
      );

      expect(result).toHaveLength(2);
      expect(result[0].objectName).toBe('test-file1.txt');
      expect(result[0].isDirectory).toBe(false);
      expect(result[1].objectName).toBe('test-folder');
      expect(result[1].isDirectory).toBe(true);
    });
  });

  describe('upload function', () => {
    it('should upload a file successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true
      });

      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array([1, 2, 3]));
          controller.close();
        }
      });

      const result = await File.upload(mockStorageZone, '/test/file.txt', mockStream);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(URL),
        expect.objectContaining({
          method: 'PUT',
          headers: {
            'AccessKey': 'test-access-key',
            'Content-Type': 'application/octet-stream'
          },
          body: mockStream,
          duplex: 'half'
        })
      );

      expect(result).toBe(true);
    });
  });

  describe('download function', () => {
    it('should download a file successfully', async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array([1, 2, 3]));
          controller.close();
        }
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: mockStream,
        headers: new Headers({
          'content-length': '3'
        })
      });

      const result = await File.download(mockStorageZone, '/test/file.txt');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(URL),
        expect.objectContaining({
          method: 'GET',
          headers: {
            'AccessKey': 'test-access-key'
          }
        })
      );

      expect(result.stream).toBe(mockStream);
      expect(result.length).toBe(3);
    });
  });

  describe('directory operations', () => {
    it('should create a directory successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true
      });

      const result = await File.createDirectory(mockStorageZone, '/test/new-folder');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(URL),
        expect.objectContaining({
          method: 'PUT',
          headers: {
            'AccessKey': 'test-access-key'
          }
        })
      );

      expect(result).toBe(true);
    });

    it('should remove a directory successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true
      });

      const result = await File.removeDirectory(mockStorageZone, '/test/folder-to-remove');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(URL),
        expect.objectContaining({
          method: 'DELETE',
          headers: {
            'AccessKey': 'test-access-key'
          }
        })
      );

      expect(result).toBe(true);
    });
  });

  describe('remove function', () => {
    it('should remove a file successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true
      });

      const result = await File.remove(mockStorageZone, '/test/file-to-remove.txt');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(URL),
        expect.objectContaining({
          method: 'DELETE',
          headers: {
            'AccessKey': 'test-access-key'
          }
        })
      );

      expect(result).toBe(true);
    });
  });
});
