import { FilterQuery } from "mongoose";

export function applySearch<T>(
  baseQuery: FilterQuery<T>,
  searchTerm: string | undefined,
  searchFields: string[]
): FilterQuery<T> {
  if (!searchTerm || searchFields.length === 0) {
    return baseQuery;
  }

  const searchConditions: FilterQuery<T> = {
    $or: searchFields.map((field) => ({
      [field]: { $regex: new RegExp(searchTerm, "i") },
    })) as any,
  };

  return { ...baseQuery, ...searchConditions };
}
