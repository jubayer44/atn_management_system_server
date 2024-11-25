export interface TPagination {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface TTimeSheetQueryKeys {
  searchTerm?: string;
  startDate?: string;
  endDate?: string;
}
