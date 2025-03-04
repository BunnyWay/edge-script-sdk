import * as Regions from './regions.ts';

describe('StorageRegion enum', () => {
  it('should have the correct region codes', () => {
    expect(Regions.StorageRegion.Falkenstein).toBe('de');
    expect(Regions.StorageRegion.London).toBe('uk');
    expect(Regions.StorageRegion.NewYork).toBe('ny');
    expect(Regions.StorageRegion.LosAngeles).toBe('la');
    expect(Regions.StorageRegion.Singapore).toBe('sg');
    expect(Regions.StorageRegion.Stockholm).toBe('se');
    expect(Regions.StorageRegion.SaoPaulo).toBe('br');
    expect(Regions.StorageRegion.Johannesburg).toBe('jh');
    expect(Regions.StorageRegion.Sydney).toBe('syd');
  });
});

describe('addr function', () => {
  it('should return the correct URL for Falkenstein', () => {
    const url = Regions.addr(Regions.StorageRegion.Falkenstein);
    expect(url.toString()).toBe('https://storage.bunnycdn.com/');
  });

  it('should return the correct URL for London', () => {
    const url = Regions.addr(Regions.StorageRegion.London);
    expect(url.toString()).toBe('https://uk.storage.bunnycdn.com/');
  });

  it('should return the correct URL for New York', () => {
    const url = Regions.addr(Regions.StorageRegion.NewYork);
    expect(url.toString()).toBe('https://ny.storage.bunnycdn.com/');
  });

  it('should return the correct URL for Los Angeles', () => {
    const url = Regions.addr(Regions.StorageRegion.LosAngeles);
    expect(url.toString()).toBe('https://la.storage.bunnycdn.com/');
  });

  it('should return the correct URL for Singapore', () => {
    const url = Regions.addr(Regions.StorageRegion.Singapore);
    expect(url.toString()).toBe('https://sg.storage.bunnycdn.com/');
  });

  it('should return the correct URL for Stockholm', () => {
    const url = Regions.addr(Regions.StorageRegion.Stockholm);
    expect(url.toString()).toBe('https://se.storage.bunnycdn.com/');
  });

  it('should return the correct URL for Sao Paulo', () => {
    const url = Regions.addr(Regions.StorageRegion.SaoPaulo);
    expect(url.toString()).toBe('https://br.storage.bunnycdn.com/');
  });

  it('should return the correct URL for Johannesburg', () => {
    const url = Regions.addr(Regions.StorageRegion.Johannesburg);
    expect(url.toString()).toBe('https://jh.storage.bunnycdn.com/');
  });

  it('should return the correct URL for Sydney', () => {
    const url = Regions.addr(Regions.StorageRegion.Sydney);
    expect(url.toString()).toBe('https://syd.storage.bunnycdn.com/');
  });

  it('should throw an error for invalid region', () => {
    // @ts-expect-error Testing with invalid input
    expect(() => Regions.addr('invalid-region')).toThrow('Invalid Storage Region');
  });
});
