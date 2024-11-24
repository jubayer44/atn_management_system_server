import { TPagination } from "../app/interfaces/common";
import { ParsedQs } from "qs";

export const parsePaginationOptions = (
  query: Partial<ParsedQs>
): TPagination => {
  return {
    page: parseInt(query.page as string, 10) || 1, // Default to page 1 if not provided
    limit: parseInt(query.limit as string, 10) || 10, // Default to 10 items per page
    sortBy: query.sortBy as string | undefined,
    sortOrder:
      query.sortOrder === "asc" || query.sortOrder === "desc"
        ? query.sortOrder
        : undefined, // Ensure correct values for sortOrder
  };
};
