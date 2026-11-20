import { z } from "zod";

const detectionSchema = z.tuple([z.string(), z.number().min(0).max(100)]);
const eventSchema = z.tuple([z.string(), z.string()]);

export const propertySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  address: z.string().min(1),
  city: z.string().default("San Antonio"),
  state: z.string().length(2).default("TX"),
  lat: z.number(),
  lng: z.number(),
  zone: z.string(),
  legal: z.string(),
  recorded: z.string(),
  confidence: z.number().min(0).max(100),
  tags: z.array(z.string()),
  status: z.enum(["opportunity", "changed", "construction", "stable"]),
  observed: z.string(),
  imageDate: z.string(),
  detections: z.array(detectionSchema),
  events: z.array(eventSchema),
});

export const propertyCollectionSchema = z.array(propertySchema);
