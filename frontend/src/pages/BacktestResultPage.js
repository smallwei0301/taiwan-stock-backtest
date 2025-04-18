import React, { useState, useEffect } from 'react';
import { Typography, Card, Tabs, Table, Statistic, Row, Col, Button, Divider, Alert, Spin, message } from 'antd';
import { LineChartOutlined, BarChartOutlined, DollarOutlined, PercentageOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;

const BacktestResultPage = () => {
  const [loading, setLoading] = useState(false);
  const [backtestResult, setBacktestResult] = useState(null);
  const [stockInfo, setStockInfo] = useState(null);
  const [strategyInfo, setStrategyInfo] = useState(null);
  const navigate = useNavigate();
  
  // 從本地存儲中獲取回測結果和股票信息
  useEffect(() => {
    const savedResult = localStorage.getItem('backtestResult');
    const savedStock = localStorage.getItem('selectedStock');
    const savedStrategy = localStorage.getItem('backtestStrategy');
    
    if (savedResult) {
      setBacktestResult(JSON.parse(savedResult));
    } else {
      message.warning('沒有回測結果，請先執行回測');
      navigate('/strategy');
    }
    
    if (savedStock) {
      setStockInfo(JSON.parse(savedStock));
    }
    
    if (savedStrategy) {
      setStrategyInfo(JSON.parse(savedStrategy));
    }
  }, [navigate]);

  const getStrategyName = (type) => {
    switch(type) {
      case 'ma_cross':
        return '移動平均線交叉策略';
      case 'rsi':
        return 'RSI超買超賣策略';
      case 'bollinger':
        return '布林帶突破策略';
      case 'kd_cross':
        return 'KD交叉策略';
      case 'macd':
        return 'MACD交叉策略';
      case 'multi':
        return '多指標組合策略';
      default:
        return '未知策略';
    }
  };

  const tradeColumns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: '類型',
      dataIndex: 'type',
      key: 'type',
      render: (text) => (
        <span style={{ color: text === '買入' ? '#1890ff' : '#52c41a' }}>
          {text}
        </span>
      ),
    },
    {
      title: '價格',
      dataIndex: 'price',
      key: 'price',
      render: (text) => `$${text}`,
    },
    {
      title: '股數',
      dataIndex: 'shares',
      key: 'shares',
    },
    {
      title: '金額',
      dataIndex: 'amount',
      key: 'amount',
      render: (text) => `$${text.toLocaleString()}`,
    },
    {
      title: '損益',
      dataIndex: 'pnl',
      key: 'pnl',
      render: (text) => (
        <span style={{ color: text > 0 ? '#52c41a' : text < 0 ? '#f5222d' : '#000000' }}>
          {text > 0 ? '+' : ''}{`$${text.toLocaleString()}`}
        </span>
      ),
    },
  ];

  const monthlyReturnColumns = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
    },
    {
      title: '月收益率',
      dataIndex: 'return',
      key: 'return',
      render: (text) => (
        <span style={{ color: text > 0 ? '#52c41a' : text < 0 ? '#f5222d' : '#000000' }}>
          {text > 0 ? '+' : ''}{`${(text * 100).toFixed(2)}%`}
        </span>
      ),
    },
  ];

  if (!backtestResult) {
    return (
      <div style={{ textAlign: 'center', margin: '50px 0' }}>
        <Spin tip="正在加載回測結果..." />
      </div>
    );
  }

  return (
    <div>
      <Typography>
        <Title level={2}>回測結果</Title>
        <Paragraph>
          以下是您的交易策略回測結果和績效報告。
        </Paragraph>
      </Typography>

      <Alert
        message="回測完成"
        description={`已成功完成「${stockInfo?.name || ''}」的「${getStrategyName(strategyInfo?.type) || ''}」回測。`}
        type="success"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="股票資訊" bordered={false}>
            <p><strong>股票代碼:</strong> {stockInfo?.symbol || ''}</p>
            <p><strong>股票名稱:</strong> {stockInfo?.name || ''}</p>
            <p><strong>交易所:</strong> {stockInfo?.exchange || ''}</p>
            <p><strong>產業:</strong> {stockInfo?.industry || ''}</p>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="策略資訊" bordered={false}>
            <p><strong>策略名稱:</strong> {getStrategyName(strategyInfo?.type) || ''}</p>
            <p><strong>策略參數:</strong> {strategyInfo?.params ? Object.entries(strategyInfo.params).map(([key, value]) => `${key}=${value}`).join(', ') : ''}</p>
          </Card>
        </Col>
      </Row>

      <Divider orientation="left">績效指標</Divider>

      <Row gutter={[16, 16]}>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="總收益率"
              value={(backtestResult.performance_metrics.total_return * 100).toFixed(2)}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              prefix={<PercentageOutlined />}
              suffix="%"
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="年化收益率"
              value={(backtestResult.performance_metrics.annualized_return * 100).toFixed(2)}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              prefix={<PercentageOutlined />}
              suffix="%"
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="夏普比率"
              value={backtestResult.performance_metrics.sharpe_ratio.toFixed(2)}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="最大回撤"
              value={(backtestResult.performance_metrics.max_drawdown * 100).toFixed(2)}
              precision={2}
              valueStyle={{ color: '#cf1322' }}
              prefix={<PercentageOutlined />}
              suffix="%"
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="勝率"
              value={(backtestResult.performance_metrics.win_rate * 100).toFixed(2)}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              prefix={<PercentageOutlined />}
              suffix="%"
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="交易次數"
              value={backtestResult.performance_metrics.total_trades}
              valueStyle={{ color: '#1890ff' }}
              prefix={<LineChartOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Divider orientation="left">詳細資訊</Divider>

      <Tabs defaultActiveKey="1">
        <TabPane tab="交易記錄" key="1">
          <Table 
            dataSource={backtestResult.trades} 
            columns={tradeColumns} 
            rowKey={(record, index) => index}
            pagination={{ pageSize: 10 }}
          />
        </TabPane>
        <TabPane tab="月度收益" key="2">
          <Table 
            dataSource={backtestResult.monthly_returns} 
            columns={monthlyReturnColumns} 
            rowKey={(record, index) => index}
            pagination={{ pageSize: 12 }}
          />
        </TabPane>
      </Tabs>

      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Button type="primary" onClick={() => window.print()} style={{ marginRight: 16 }}>
          列印報告
        </Button>
        <Button type="default" onClick={() => navigate('/optimize')} style={{ marginRight: 16 }}>
          優化參數
        </Button>
        <Button type="default" onClick={() => navigate('/strategy')}>
          修改策略
        </Button>
      </div>
    </div>
  );
};

export default BacktestResultPage;
