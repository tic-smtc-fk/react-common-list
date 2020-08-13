import React, { FC, useState } from 'react';
import { Table, Spin, Empty, Select, Input, Pagination } from 'antd';
import { stringify, parse } from 'qs';
import { useHistory, useLocation } from 'react-router-dom';
import { unstable_batchedUpdates } from 'react-dom';

import styles from './ProdList.module.less';
import { queryBasic, queryList } from './service';
import { ListResponse, Filter, BasicResponse } from './types';
import { useDidMount, useDidUpdate } from './hooks';

interface State {
  err?: Error;
  data?: ListResponse;
}

const { Option } = Select;
const { Search } = Input;

export const List: FC = () => {
  const history = useHistory();
  const { pathname, search } = useLocation();
  const [info, setInfo] = useState<BasicResponse>();
  const [state, setState] = useState<State>({});
  const [filter, $setFilter] = useState<Filter>(() => {
    return {
      keyword: '',
      type: '',
      pageNo: 1,
      pageSize: 10,
    };
  });
  const setFilter = (newFilter: Partial<Filter>) => {
    $setFilter({ ...filter, pageNo: 1, ...newFilter });
  };

  const fetchList = async () => {
    setState({});
    try {
      const res = await queryList(filter);
      setState({ data: res });
    } catch (error) {
      setState({ err: error as Error });
    }
  };

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

  if (!info)
    return (
      <div className={styles.loading}>
        <Spin tip="基本信息查询中..." />
      </div>
    );

  const { typeList } = info;

  return (
    <div className={styles.wrapper}>
      <h3>产品列表</h3>
      <ul className={styles.filter}>
        <li>
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
        </li>
        <li>
          <Search
            defaultValue={filter.keyword}
            onSearch={(e) => {
              if (e === filter.keyword) return;
              setFilter({ keyword: e });
            }}
            style={{ width: 250 }}
            placeholder="输入名称、描述模糊查询"
          />
        </li>
      </ul>
      {renderList()}
    </div>
  );

  function renderList() {
    const { data, err } = state;

    if (err)
      return (
        <div className={styles.error} onClick={fetchList}>
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

    const columns = [
      {
        title: '名称',
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: '描述',
        dataIndex: 'description',
        key: 'description',
      },
      {
        title: '类型',
        dataIndex: 'type',
        key: 'type',
        render(v: string) {
          return typeList.filter((item) => item.value === v)[0].label;
        },
      },
      {
        title: '日期',
        dataIndex: 'date',
        key: 'date',
      },
    ];

    return (
      <>
        <Table columns={columns} dataSource={data.list} rowKey="id" pagination={false} />
        <div className={styles.page}>
          <Pagination
            total={data.page.total}
            current={filter.pageNo}
            pageSize={filter.pageSize}
            pageSizeOptions={['10', '20']}
            onChange={(current, size) => setFilter({ pageNo: current, pageSize: size })}
            showSizeChanger
          />
        </div>
      </>
    );
  }
};
