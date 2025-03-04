
import * as Zone from './zone';
import * as Regions from './regions';

describe('StorageZone operations', () => {
  describe('connect_with_accesskey function', () => {
    it('should create a valid StorageZone object', () => {
      const storageZone = Zone.connect_with_accesskey(
        Regions.StorageRegion.Falkenstein,
        'test-zone',
        'test-access-key'
      );

      expect(storageZone).toEqual({
        _tag: 'StorageZone',
        region: 'de',
        name: 'test-zone',
        accessKey: 'test-access-key'
      });
    });
  });

  describe('addr function', () => {
    it('should return the correct URL for a storage zone', () => {
      const storageZone = Zone.connect_with_accesskey(
        Regions.StorageRegion.Falkenstein,
        'test-zone',
        'test-access-key'
      );

      const url = Zone.addr(storageZone);

      expect(url.toString()).toBe('https://storage.bunnycdn.com/test-zone/');
    });

    it('should return the correct URL for a storage zone in a different region', () => {
      const storageZone = Zone.connect_with_accesskey(
        Regions.StorageRegion.London,
        'uk-zone',
        'test-access-key'
      );

      const url = Zone.addr(storageZone);

      expect(url.toString()).toBe('https://uk.storage.bunnycdn.com/uk-zone/');
    });
  });

  describe('name function', () => {
    it('should return the name of the storage zone', () => {
      const storageZone = Zone.connect_with_accesskey(
        Regions.StorageRegion.Falkenstein,
        'test-zone',
        'test-access-key'
      );

      const name = Zone.name(storageZone);

      expect(name).toBe('test-zone');
    });
  });

  describe('key function', () => {
    it('should return the correct authentication header and key', () => {
      const storageZone = Zone.connect_with_accesskey(
        Regions.StorageRegion.Falkenstein,
        'test-zone',
        'test-access-key'
      );

      const [header, key] = Zone.key(storageZone);

      expect(header).toBe('AccessKey');
      expect(key).toBe('test-access-key');
    });
  });
});
