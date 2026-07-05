export interface SearchParamsPaginationDefault {
  limit?: string;
  page?: string; // current page
  q?: string;
}

export interface GetListPayload<T> {
  data: T[];
  error?: string;
  limit?: number;
  page?: number; // current page
  total?: number;
  totalPage?: number;
}

export interface GetItemPayload<T> {
  data: T;
  error?: string;
}
