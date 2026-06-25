/**
 * Ambient type declarations for the Bunny Scriptable DNS runtime.
 *
 * The DNS sandbox injects these objects as globals. Scripts use them with no
 * import (e.g. `new ARecord("1.1.1.1", 30)`). This file ships types only and no
 * runtime code, matching how the runtime actually works.
 *
 * To activate, reference it once from your script or tsconfig:
 *
 *   /// <reference types="@bunny.net/edgescript-sdk/dns" />
 *
 * or add `"@bunny.net/edgescript-sdk/dns"` to `compilerOptions.types`.
 *
 * @see https://docs.bunny.net/dns/scriptable/introduction
 */

export {};

declare global {
  // ---------------------------------------------------------------------------
  // Query objects
  // https://docs.bunny.net/dns/scriptable/introduction
  // ---------------------------------------------------------------------------

  /** The object passed to {@link handleQuery}. */
  interface DnsRequest {
    /** The DNS query request that contains the details about the query. */
    request: DnsQuery;
  }

  interface DnsQuery {
    /** The hostname that is being queried. */
    hostname: string;
    /** The IP of the remote client that sent the DNS query. */
    clientIP: string;
    /**
     * The query question type. Common values are `A`, `AAAA`, and `TXT`; the
     * `(string & {})` member keeps autocomplete for these while still allowing
     * any other type the runtime may send.
     */
    queryType: "A" | "AAAA" | "TXT" | (string & {});
    /** The EDNS0 IP of the DNS query that was attached by the client. */
    ednsIP: string;
    /** The geo location of the client. */
    geoLocation: GeoLocation;
    /** The server zone of the DNS server that received the query (DE, UK, SG, etc.). */
    serverZone: string;
  }

  interface GeoLocation {
    /** The latitude location of the client. */
    latitude: number;
    /** The longitude location of the client. */
    longitude: number;
    /** The detected two letter ISO country code of the client. */
    country: string;
    /** The detected ASN number of the client. */
    asn: number;
  }

  // ---------------------------------------------------------------------------
  // Response objects
  // https://docs.bunny.net/dns/scriptable/query-response-object-types
  // ---------------------------------------------------------------------------

  /** The A type DNS answer, used to return A records. */
  class ARecord {
    constructor(ip: string, ttl?: number);
    /** The IP of the A record. */
    ip: string;
    /** The TTL of the answer. */
    ttl: number;
  }

  /** The AAAA type DNS answer, used to return AAAA records. */
  class AaaaRecord {
    constructor(ip: string, ttl?: number);
    /** The IP of the AAAA record. */
    ip: string;
    /** The TTL of the answer. */
    ttl: number;
  }

  /** The CNAME type DNS answer, used to return CNAME records. */
  class CnameRecord {
    constructor(hostname: string, ttl?: number);
    /** The hostname of the CNAME record. */
    hostname: string;
    /** The TTL of the answer. */
    ttl: number;
  }

  /**
   * The TXT type DNS answer, used to return TXT records.
   *
   * Documented through the runtime examples (Monitoring/GeoDatabase) rather than
   * the response-object-types reference page.
   */
  class TxtRecord {
    constructor(value: string, ttl?: number);
    /** The value of the TXT record. */
    value: string;
    /** The TTL of the answer. */
    ttl: number;
  }

  /**
   * Maps the response to a Pull Zone, letting the DNS system automatically
   * resolve to the appropriate A or AAAA records for that pull zone.
   */
  class PullZoneRecord {
    constructor(pullzone: string);
    /** The name of the pull zone. */
    pullzone: string;
  }

  // ---------------------------------------------------------------------------
  // Helper objects
  // https://docs.bunny.net/dns/scriptable/helper-objects
  // ---------------------------------------------------------------------------

  /** The status of an IP as reported by {@link Monitoring.getStatus}. */
  interface MonitoringStatus {
    /** The current status of the IP (true: online, false: offline). */
    isOnline: boolean;
    /** The last measured latency from the DNS server to this IP. */
    latency: number;
  }

  /**
   * Check and monitor the uptime status of an IP. Useful for uptime checking
   * when returning DNS records.
   */
  const Monitoring: {
    /** Returns the current status of the IP. */
    getStatus(ip: string): MonitoringStatus;
  };

  /** A wrapper around a GeoDNS library for looking up the geo location of an IP. */
  const GeoDatabase: {
    /** Returns the {@link GeoLocation} for the specified IP based on a GeoDNS database. */
    resolve(ip: string): GeoLocation;
  };

  /** Helper methods to calculate the distance between two geographical points. */
  const GeoDistance: {
    /** Distance between two latitude/longitude pairs. */
    calculate(lat1: number, lon1: number, lat2: number, lon2: number): number;
    /** Distance between two {@link GeoLocation} objects. */
    calculate(loc1: GeoLocation, loc2: GeoLocation): number;
    /** Distance between a {@link Server} and a {@link GeoLocation}. */
    calculate(server: Server, location: GeoLocation): number;
  };

  /**
   * Dynamic geographic routing, weight calculation, and round robin logic based
   * on a list of servers.
   */
  const RoutingEngine: {
    /**
     * Returns one server from an array based on a round robin weighted random
     * principle.
     *
     * @param onlineOnly  Filter to online servers only. Defaults to `false`.
     * @param applyWeight Apply server weights. Defaults to `true`.
     */
    getWeightedRandom(
      servers: Server[],
      onlineOnly?: boolean,
      applyWeight?: boolean,
    ): Server;
    /**
     * Returns the server closest to the given location, using the same weighted
     * round robin principle.
     *
     * @param onlineOnly  Filter to online servers only. Defaults to `false`.
     * @param applyWeight Apply server weights. Defaults to `true`.
     */
    getClosestServer(
      servers: Server[],
      location: GeoLocation,
      onlineOnly?: boolean,
      applyWeight?: boolean,
    ): Server;
  };

  /**
   * Passes or returns server information to the routing helpers. Holds data
   * only and has no behaviour of its own.
   */
  class Server {
    constructor(
      ip: string,
      latitude?: number,
      longitude?: number,
      weight?: number,
      online?: boolean,
    );
    /** The IP of the server. */
    ip: string;
    /** The geographical latitude of the server's location. */
    latitude: number;
    /** The geographical longitude of the server's location. */
    longitude: number;
    /** The routing weight of the server in a weighted routing scenario. */
    weight: number;
    /** Whether the server is considered online. */
    online: boolean;
  }

  // ---------------------------------------------------------------------------
  // Entry point
  // ---------------------------------------------------------------------------

  /** A DNS answer, or an array of answers, returned from {@link handleQuery}. */
  type DnsResponse =
    | ARecord
    | AaaaRecord
    | CnameRecord
    | TxtRecord
    | PullZoneRecord;

  /**
   * The signature of the statically defined `handleQuery` entry function that
   * the Scriptable DNS pipeline executes for each query.
   *
   * @example
   * ```ts
   * export default function handleQuery(query: DnsRequest): DnsResponse {
   *   if (query.request.geoLocation.country === "DE") {
   *     return new ARecord("222.222.222.222", 30);
   *   }
   *   return new ARecord("111.111.111.111", 30);
   * }
   * ```
   */
  type HandleQuery = (query: DnsRequest) => DnsResponse | DnsResponse[];
}
