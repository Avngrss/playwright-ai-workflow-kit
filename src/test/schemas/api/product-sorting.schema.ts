import { z } from 'zod';

export const productSortingItemSchema = z.object({
  name: z.string(),
  price: z.number().finite(),
  co2_rating: z.string().optional(),
});

export const paginatedProductSortingResponseSchema = z.object({
  current_page: z.number().int().optional(),
  data: z.array(productSortingItemSchema),
  per_page: z.number().int().optional(),
  total: z.number().int().optional(),
  from: z.number().int().optional(),
  to: z.number().int().optional(),
  last_page: z.number().int().optional(),
});

export type ProductSortingItem = z.infer<typeof productSortingItemSchema>;
export type PaginatedProductSortingResponse = z.infer<typeof paginatedProductSortingResponseSchema>;
