export interface ProdType {
  label: string;
  value: string;
}

export interface BasicResponse {
  typeList: ProdType[];
}

export type QueryBasic = () => Promise<BasicResponse>;

export interface Page {
  total: number;
  pageNo: number;
  pageSize: number;
}

export interface Prod {
  id: string;
  name: string;
  description: string;
  type: string;
  date: string;
}

export interface ListResponse {
  page: Page;
  list: Prod[];
}

export interface Filter {
  keyword: string;
  type: string;
  pageSize: number;
  pageNo: number;
}

export type QueryList = (filter: Filter) => Promise<ListResponse>;
