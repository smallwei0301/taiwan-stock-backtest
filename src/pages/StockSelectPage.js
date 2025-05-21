import React, { useState, useEffect } from 'react';
import { Typography, Input, Button, Table, Card, Spin, Alert, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { searchStocks } from '../services/api';

const { Title, Paragraph } = Typography;
const { Search } = Input;

const StockSelectPage = () => {
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [error, setError] = useState('');

  // 從本地存儲中獲取已選擇的股票
  useEffect(() => {
    const savedStock = localStorage.getItem('selectedStock');
    if (savedStock) {
      setSelectedStock(JSON.parse(savedStock));
    }
  }, []);

  const handleSearch = async (value) => {
    if (!value) {
      setError('請輸入股票代碼或名稱');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // 調用API搜索股票
      const results = await searchStocks(value);
      setSearchResults(results);
      setLoading(false);
      
      if (results.length === 0) {
        setError('找不到符合的股票，請嘗試其他關鍵字');
      }
    } catch (err) {
      setError('搜索股票時發生錯誤，請稍後再試');
      setLoading(false);
      console.error('搜索股票錯誤:', err);
    }
  };

  const handleSelectStock = (record) => {
    setSelectedStock(record);
    // 將選擇的股票保存到本地存儲
    localStorage.setItem('selectedStock', JSON.stringify(record));
    message.success(`已選擇 ${record.name} (${record.symbol})`);
  };

  const columns = [
    {
      title: '股票代碼',
      dataIndex: 'symbol',
      key: 'symbol',
    },
    {
      title: '股票名稱',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '交易所',
      dataIndex: 'exchange',
      key: 'exchange',
    },
    {
      title: '產業',
      dataIndex: 'industry',
      key: 'industry',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="primary" 
          onClick={() => handleSelectStock(record)}
          disabled={selectedStock && selectedStock.symbol === record.symbol}
        >
          {selectedStock && selectedStock.symbol === record.symbol ? '已選擇' : '選擇'}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Typography>
        <Title level={2}>選擇股票</Title>
        <Paragraph>
          請輸入股票代碼或名稱進行搜索，然後選擇您想要分析的台灣股票。
        </Paragraph>
      </Typography>

      <Card className="stock-search">
        <Search
          placeholder="輸入股票代碼或名稱"
          enterButton={<><SearchOutlined /> 搜索</>}
          size="large"
          onSearch={handleSearch}
          style={{ maxWidth: 500 }}
        />
        
        {error && <Alert message={error} type="error" style={{ marginTop: 16 }} />}
        
        {loading ? (
          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <Spin tip="搜索中..." />
          </div>
        ) : (
          searchResults.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <Table 
                dataSource={searchResults} 
                columns={columns} 
                rowKey="symbol"
                pagination={false}
              />
            </div>
          )
        )}
      </Card>

      {selectedStock && (
        <Card title="已選擇的股票" style={{ marginTop: 20 }}>
          <p><strong>股票代碼:</strong> {selectedStock.symbol}</p>
          <p><strong>股票名稱:</strong> {selectedStock.name}</p>
          <p><strong>交易所:</strong> {selectedStock.exchange}</p>
          <p><strong>產業:</strong> {selectedStock.industry}</p>
          <Button type="primary" href="/strategy">
            繼續設定策略
          </Button>
        </Card>
      )}
    </div>
  );
};

export default StockSelectPage;
