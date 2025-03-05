/**
 * Regions available for the primary storage region of your storage Zone
 */
export enum StorageRegion {
  Falkenstein = "de",
  London = "uk",
  NewYork = "ny",
  LosAngeles = "la",
  Singapore = "sg",
  Stockholm = "se",
  SaoPaulo = "br",
  Johannesburg = "jh",
  Sydney = "syd",
};

/**
 * Give the associated URL Address for a Storage Region.
 *
 * @throws: If the value is not a proper storage region.
 */
export function addr(value: StorageRegion): URL {
  switch (value) {
    case StorageRegion.Falkenstein:
      return new URL("https://storage.bunnycdn.com");
    case StorageRegion.London:
      return new URL("https://uk.storage.bunnycdn.com");
    case StorageRegion.NewYork:
      return new URL("https://ny.storage.bunnycdn.com");
    case StorageRegion.LosAngeles:
      return new URL("https://la.storage.bunnycdn.com");
    case StorageRegion.Singapore:
      return new URL("https://sg.storage.bunnycdn.com");
    case StorageRegion.Stockholm:
      return new URL("https://se.storage.bunnycdn.com");
    case StorageRegion.SaoPaulo:
      return new URL("https://br.storage.bunnycdn.com");
    case StorageRegion.Johannesburg:
      return new URL("https://jh.storage.bunnycdn.com");
    case StorageRegion.Sydney:
      return new URL("https://syd.storage.bunnycdn.com");
    default:
      throw new Error("Invalid Storage Region");
  }
}
