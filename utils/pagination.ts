import { Document, FilterQuery, Model } from "mongoose";

// Define a generic type for the pagination options
interface PaginationOptions {
  page?: number;
  limit?: number;
}

// Define a generic type for the paginated result
interface PaginatedResult<T> {
  results: any;
  pageInfo: {
    page: number;
    limit: number;
    totalDocuments: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// Modify the paginate function to be generic and accept search fields
export async function paginate<T extends Document>(
  model: Model<T>,
  baseQuery: FilterQuery<T>,
  searchTerm: string | undefined,
  searchFields: string[],
  { page = 1, limit = 10 }: PaginationOptions
): Promise<PaginatedResult<T>> {
  const skip = (page - 1) * limit;
  let query: any = baseQuery;

  // Apply search condition if searchTerm is provided
  if (searchTerm) {
    query = {
      ...query,
      $or: searchFields.map((field) => ({
        [field]: { $regex: new RegExp(searchTerm, "i") },
      })),
    };
  }

  const totalDocuments = await model.countDocuments(query);

  // Log the search query before executing the database query
  console.log("Search Query:", query);
  const results = await model.find(query).skip(skip).limit(limit).lean();

  return {
    results,
    pageInfo: {
      page,
      limit,
      totalDocuments,
      totalPages: Math.ceil(totalDocuments / limit),
      hasNextPage: page * limit < totalDocuments,
      hasPreviousPage: page > 1,
    },
  };
}
