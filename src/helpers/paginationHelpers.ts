type TOptions = {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: string;
};

type TResultOptions = {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: string;
};

const calculatePagination = (options: Partial<TOptions>): TResultOptions => {
  const page: number = Number(options?.page) || 1;
  const limit: number = Number(options?.limit) || 10;
  const skip: number = (page - 1) * limit;

  const sortBy: string = options?.sortBy || "createdAt";
  const sortOrder: string = options?.sortOrder || "asc";

  return {
    page,
    limit,
    skip,
    sortBy,
    sortOrder,
  };
};

export const paginationHelpers = {
  calculatePagination,
};
