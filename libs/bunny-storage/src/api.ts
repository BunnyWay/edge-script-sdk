import { z } from 'zod';
import { ZoneSchema } from './file';

export const ReplicatedZonesStringSchema = z.string();

export const ReplicatedZonesSchema = ReplicatedZonesStringSchema.transform((str) => {
  const zones = str.split(',').map(zone => zone.trim()).filter(x => x != '');
  return zones.map(zone => ZoneSchema.parse(zone));
});


export const StorageFileSchemaDescribe = z.object({
  Guid: z.string(),
  UserId: z.string(),
  LastChanged: z.coerce.date(),
  DateCreated: z.coerce.date(),
  StorageZoneName: z.string(),
  Path: z.string(),
  ObjectName: z.string(),
  Length: z.number(),
  StorageZoneId: z.number(),
  IsDirectory: z.boolean(),
  ServerId: z.number(),
  Checksum: z.nullable(z.string()),
  ReplicatedZones: z.nullable(ReplicatedZonesSchema),
  ContentType: z.string(),
});

export const StorageFileListing = z.array(StorageFileSchemaDescribe);
