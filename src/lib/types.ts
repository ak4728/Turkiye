import type { CategoryId } from "./categories";

export interface Pin {
  id: string;
  name: string;
  category: CategoryId | string;
  description: string | null;
  notes: string | null;
  address: string | null;
  imageUrl: string | null;
  latitude: number;
  longitude: number;
  rating: number | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PinInput {
  name: string;
  category: string;
  description?: string | null;
  notes?: string | null;
  address?: string | null;
  imageUrl?: string | null;
  latitude: number;
  longitude: number;
  rating?: number | null;
  tags?: string[];
}
