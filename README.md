# 前言

![](https://img.alicdn.com/tfs/TB1FEDaRoz1gK0jSZLeXXb9kVXa-895-779.png)

列表页在前端是一个很常见的场景，例如上面这样，那么如何开发出一个体验流畅、易拓展的列表页呢？这里我们使用以下库完成一个列表页演示

- React
- Antd
- Typescript，方便给大家查看接口设计

动手写代码之前，我们先做功能分析与设计

# 功能分析与设计

## 功能分析

列表页一般由三个部分组成

- 筛选区域，通过关键字等信息限定范围，帮助用户快速查找到需要的数据，形式有输入框，有下拉框等等。
- 列表区域，核心数据展示和操作区域，例如单条数据的编辑、删除等等
- 分页区域，页码和一页展示的条数

## 接口设计

后端需要提供两个接口

### 基本信息查询

包含筛选数据或者其他前期准备数据，例如筛选区域里有个类型的下拉，这个下拉列表数据肯定是需要后端提供的，定义结构

```ts
export interface ProdType {
  label: string;
  value: string;
}

export interface BasicResponse {
  typeList: ProdType[];
}

export type QueryBasic = () => Promise<BasicResponse>;
```

### 列表信息查询

需要满足以下几点条件

- 支持条件查询
- 返回列表信息
- 返回分页信息

定义结构

```ts
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
```

## 是否在前端做分页

很多方案是后端一次性把数据返回给前端，然后让前端去做分页、去做筛选，强烈不建议这么干， 几点理由：

- 数据是无限膨胀的，性能瓶颈是迟早的事情，相当于提前埋了个雷
- 和后端长时间没有交互，数据可能不是最新的，例如用户 A 编辑了某条数据，用户 B 是需要重新拉取所有数据才能看到变更
- 一般一个项目针对分页肯定是有统一的接口设计，是不是所有场景都是前端来做，如果不是那就是一个项目里存在 2 套分页逻辑，这些维护起来都是深坑

有人会说前端分页会更快一些，但是和上面的缺点来说不值一提，除非是有特殊场景，否则不要在前端做分页。

# 编码

先定义相应的 state

```ts
const [info, setInfo] = useState<BasicResponse>();
const [state, setState] = useState<ListResponse>();
const [filter, $setFilter] = useState<Filter>(() => {
  return {
    keyword: '',
    type: '',
    pageNo: 1,
    pageSize: 10,
  };
});
```

did mount 后发起接口调用，需要注意的是：`列表的查询不通过命令式调用，而是通过感知 filter 变化进行响应式更新`。

```ts
const fetchList = async () => {
  setState(undefined);
  const res = await queryList(filter);
  setState(res);
};

useDidMount(() => {
  (async () => {
    const res = await queryBasic();
    setInfo(res);
    setFilter(filter);
  })();
});

useDidUpdate(() => {
  fetchList();
}, [filter]);
```

处理 filter

```jsx
const setFilter = (newFilter: Partial<Filter>) => {
  $setFilter({ ...filter, ...newFilter });
};

<Select
  defaultValue={filter.type}
  style={{ width: 250 }}
  onChange={(v: string) => setFilter({ type: v })}
>
  <Option value="">全部产品类型</Option>
  {typeList.map((item) => (
    <Option value={item.value} key={item.value}>
      {item.label}
    </Option>
  ))}
</Select>
```

至此，一个列表页基本开发完成，可维护性和拓展性尚可，但是还有几个体验的点需要注意

- 用户在第 3 页的时候进行其它条件筛选，查询条件还是第 3 页，这个体验不够流畅，应该自动切回到第 1 页
- 查询接口出错目前无法重试，用户体验是中断的
- 用户进行了一系列筛选操作后，没法保存书签，也没法发送链接给其它人查看筛选过后的数据，体验太差

# 优化

第一个问题好解决，筛选条件变化时，页码归 1

```ts
const setFilter = (newFilter: Partial<Filter>) => {
  $setFilter({ ...filter, pageNo: 1, ...newFilter });
};
```

第二个问题需要稍微调整下结构，透出错误信息，并且给予用户重试的机会

```ts
interface State {
  err?: Error;
  data?: ListResponse;
}

const [state, setState] = useState<State>({});
```
```jsx
function renderList() {
  const { data, err } = state;

  if (err) return (
    <div 
      className={styles.error} 
      onClick={fetchList}
    >
      {err.message}
    </div>
  );
  if (!data)
    return (
      <div className={styles.loading}>
        <Spin tip="列表信息查询中..." />
      </div>
    );

  if (!data.list.length) return <Empty description="暂无数据" />;

  return (
   ...
  );
}
```

第三个问题需要在首次渲染的时候读取 search 并设置 filter，注意做好防御性编程；同时需要在 filter 更新的时候修改地址栏 search 的部分

```ts
useDidMount(() => {
  (async () => {
    const res = await queryBasic();
    unstable_batchedUpdates(() => {
      setInfo(res);

      const query = parse(search.slice(1));
      const typeItem = res.typeList.filter((item) => item.value === query.type)[0];

      setFilter({
        pageNo: Number(query.pageNo) || 1,
        pageSize: Number(query.pageSize) || 10,
        type: typeItem ? typeItem.value : '',
        keyword: (query.keyword as string) || '',
      });
    });
  })();
});

useDidUpdate(() => {
  fetchList();
  history.push(`${pathname}?${stringify(filter)}`);
}, [filter]);
```

> unstable_batchedUpdates 是为了保障异步事件里 setState 能够批量更新

# 小结

代码参见 https://github.com/tic-smtc-fk/react-common-list


```bash
git clone git@github.com:tic-smtc-fk/react-common-list.git
code react-common-list
npm install
npm run dev
```

访问 http://localhost:8070
