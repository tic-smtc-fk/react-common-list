import {
  BasicResponse,
  QueryBasic,
  QueryList,
  Filter,
  ListResponse,
  Prod,
  ProdType,
} from './types';

const typeList: ProdType[] = new Array(5).fill(undefined).map((item, index) => ({
  label: `产品类型${index + 1}`,
  value: `type${index + 1}`,
}));

const prodList: Prod[] = new Array(40).fill(undefined).map((item, index) => ({
  id: `${index + 1}`,
  name: `产品${index + 1}`,
  description: `这是产品描述${index + 1}`,
  date: '2020-12-12 12:12:12',
  type: `type${Math.floor(Math.random() * typeList.length) + 1}`,
}));

export const queryBasic: QueryBasic = (): Promise<BasicResponse> => {
  return new Promise((resolve) => {
    resolve({
      typeList,
    });
  });
};

export const queryList: QueryList = async (filter: Filter): Promise<ListResponse> => {
  const newList = prodList
    .filter((item) => !filter.type || item.type === filter.type)
    .filter(
      (item) =>
        item.name.indexOf(filter.keyword) > -1 || item.description.indexOf(filter.keyword) > -1,
    );

  const start = (filter.pageNo - 1) * filter.pageSize;
  const end = start + filter.pageSize;

  await sleep(400);
  return new Promise((resolve) => {
    // if (Math.random() * 2 > 1) {
    //   reject(Error('请求超时，点击重试'));
    //   return;
    // }

    resolve({
      list: newList.slice(start, end),
      page: {
        total: newList.length,
        pageNo: filter.pageNo,
        pageSize: filter.pageSize,
      },
    });
  });
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}
