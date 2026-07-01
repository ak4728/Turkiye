import { z } from "zod";

export const pinInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  category: z.string().trim().min(1).max(50),
  description: z.string().max(5000).nullish(),
  notes: z.string().max(5000).nullish(),
  address: z.string().max(500).nullish(),
  imageUrl: z.string().trim().max(2000).nullish(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  rating: z.number().int().min(1).max(5).nullish(),
  tags: z.array(z.string().trim().min(1).max(50)).max(30).optional(),
});

export const pinUpdateSchema = pinInputSchema.partial();

export type PinInputSchema = z.infer<typeof pinInputSchema>;
