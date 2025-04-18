import React, { useState, useEffect } from 'react';
import { Typography, Card, Form, InputNumber, Select, Button, Slider, Table, Tabs, Alert, Space, Spin, message } from 'antd';
import { RocketOutlined, SettingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getStockData, runOptimization } from '../services/api';

const { Title, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const ParameterOptimizationPage = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [optimizationResults, setOptimizationResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stockData, setStockData] = useState(null);
  const [loadingStock, setLoadingStock] = useState(false);

  // 從本地存儲中獲取已選擇的股票
  useEffect(() => {
    const fetchStockData = async () => {
      const savedStock = localStorage.getItem('selectedStock');
      if (savedStock) {
        const stockInfo = JSON.parse(savedStock);
        setLoadingStock(true);
        try {
          const data = await getStockData(stockInfo.symbol);
          setStockData(data);
          message.success(`成功獲取 ${stockInfo.name} 的股票數據`);
        } catch (err) {
          message.error('獲取股票數據失敗，請返回選擇其他股票');
          console.error('獲取股票數據錯誤:', err);
        } finally {
          setLoadingStock(false);
        }
      } else {
        message.warning('請先選擇股票');
        navigate('/stock');
      }
    };

    fetchStockData();
  }, [navigate]);

  const onFinish = async (values) => {
    if (!stockData || !stockData.price_data) {
      message.error('無股票數據，無法執行參數優化');
      return;
    }

    setLoading(true);
    
    try {
      // 準備策略參數
      const strategyType = values.strategy_type || 'ma_cross';
      
      // 準備參數範圍
      const paramRanges = {};
      
      if (strategyType === 'ma_cross') {
        paramRanges.short = Array.from(
          { length: (values.params?.ma?.short_max - values.params?.ma?.short_min) / 1 + 1 },
          (_, i) => values.params?.ma?.short_min + i
        );
        
        paramRanges.long = Array.from(
          { length: (values.params?.ma?.long_max - values.params?.ma?.long_min) / 5 + 1 },
          (_, i) => values.params?.ma?.long_min + i * 5
        );
      } else if (strategyType === 'rsi') {
        paramRanges.period = Array.from(
          { length: (values.params?.rsi?.period_max - values.params?.rsi?.period_min) / 2 + 1 },
          (_, i) => values.params?.rsi?.period_min + i * 2
        );
        
        paramRanges.overbought = Array.from(
          { length: (values.params?.rsi?.overbought_max - values.params?.rsi?.overbought_min) / 5 + 1 },
          (_, i) => values.params?.rsi?.overbought_min + i * 5
        );
        
        paramRanges.oversold = Array.from(
          { length: (values.params?.rsi?.oversold_max - values.params?.rsi?.oversold_min) / 5 + 1 },
          (_, i) => values.params?.rsi?.oversold_min + i * 5
        );
      }
      
      // 執行參數優化
      const optimizationResult = await runOptimization(
        stockData.price_data,
        { type: strategyType },
        {
          method: values.optimization_method,
          target_metric: values.target_metric,
          param_ranges: paramRanges
        },
        values.initial_capital || 1000000
      );
      
      setOptimizationResults(optimizationResult);
      
      // 將最佳參數保存到本地存儲
      localStorage.setItem('optimizedParams', JSON.stringify(optimizationResult.best_params));
      localStorage.setItem('optimizationStrategy', JSON.stringify({
        type: strategyType,
        params: optimizationResult.best_params
      }));
      
      message.success('參數優化完成');
    } catch (err) {
      message.error('執行參數優化時發生錯誤');
      console.error('參數優化錯誤:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUseParams = (params) => {
    // 將選擇的參數保存到本地存儲
    localStorage.setItem('optimizedParams', JSON.stringify(params));
    
    // 跳轉到策略設定頁面
    message.success('已選擇最佳參數，正在跳轉到策略設定頁面');
    navigate('/strategy');
  };

  const columns = [
    {
      title: '短期MA',
      dataIndex: ['params', 'short'],
      key: 'shortMA',
      sorter: (a, b) => a.params.short - b.params.short,
      render: (text) => text || '-',
    },
    {
      title: '長期MA',
      dataIndex: ['params', 'long'],
      key: 'longMA',
      sorter: (a, b) => a.params.long - b.params.long,
      render: (text) => text || '-',
    },
    {
      title: 'RSI週期',
      dataIndex: ['params', 'period'],
      key: 'rsiPeriod',
      sorter: (a, b) => (a.params.period || 0) - (b.params.period || 0),
      render: (text) => text || '-',
    },
    {
      title: '總收益率',
      dataIndex: ['metrics', 'total_return'],
      key: 'totalReturn',
      sorter: (a, b) => a.metrics.total_return - b.metrics.total_return,
      render: (text) => `${(text * 100).toFixed(2)}%`,
    },
    {
      title: '夏普比率',
      dataIndex: ['metrics', 'sharpe_ratio'],
      key: 'sharpeRatio',
      sorter: (a, b) => a.metrics.sharpe_ratio - b.metrics.sharpe_ratio,
      render: (text) => text.toFixed(2),
    },
    {
      title: '最大回撤',
      dataIndex: ['metrics', 'max_drawdown'],
      key: 'maxDrawdown',
      sorter: (a, b) => a.metrics.max_drawdown - b.metrics.max_drawdown,
      render: (text) => `${(text * 100).toFixed(2)}%`,
    },
    {
      title: '勝率',
      dataIndex: ['metrics', 'win_rate'],
      key: 'winRate',
      sorter: (a, b) => a.metrics.win_rate - b.metrics.win_rate,
      render: (text) => `${(text * 100).toFixed(2)}%`,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="primary" 
          size="small" 
          onClick={() => handleUseParams(record.params)}
        >
          使用此參數
        </Button>
      ),
    },
  ];

  if (loadingStock) {
    return (
      <div style={{ textAlign: 'center', margin: '50px 0' }}>
        <Spin tip="正在獲取股票數據..." />
      </div>
    );
  }

  return (
    <div>
      <Typography>
        <Title level={2}>策略參數優化</Title>
        <Paragraph>
          通過參數優化可以找到更適合的策略參數，提高回測績效。請設定參數優化範圍和方法。
        </Paragraph>
      </Typography>

      {stockData && stockData.stock_info && (
        <Card title="當前選擇的股票" style={{ marginBottom: 20 }}>
          <p><strong>股票代碼:</strong> {stockData.stock_info.symbol}</p>
          <p><strong>股票名稱:</strong> {stockData.stock_info.name}</p>
          <p><strong>最新價格:</strong> {stockData.stock_info.regularMarketPrice} {stockData.stock_info.currency}</p>
        </Card>
      )}

      <Form
        form={form}
        name="optimization_form"
        onFinish={onFinish}
        layout="vertical"
        className="strategy-form"
        initialValues={{
          strategy_type: 'ma_cross',
          optimization_method: 'grid',
          target_metric: 'sharpe',
          iterations: 100,
          params: {
            ma: {
              short_min: 5,
              short_max: 15,
              long_min: 20,
              long_max: 50
            },
            rsi: {
              period_min: 7,
              period_max: 21,
              overbought_min: 65,
              overbought_max: 80,
              oversold_min: 20,
              oversold_max: 35
            }
          }
        }}
      >
        <Tabs defaultActiveKey="1">
          <TabPane 
            tab={<span><SettingOutlined />優化設定</span>} 
            key="1"
          >
            <Card title="策略選擇" size="small" style={{ marginBottom: 16 }}>
              <Form.Item name="strategy_type" label="選擇要優化的策略">
                <Select>
                  <Option value="ma_cross">移動平均線交叉策略</Option>
                  <Option value="rsi">RSI超買超賣策略</Option>
                  <Option value="bollinger">布林帶突破策略</Option>
                </Select>
              </Form.Item>
            </Card>
            
            <Card title="優化方法" size="small" style={{ marginBottom: 16 }}>
              <Form.Item name="optimization_method" label="優化算法">
                <Select>
                  <Option value="grid">網格搜索 (Grid Search)</Option>
                  <Option value="genetic">遺傳算法 (Genetic Algorithm)</Option>
                  <Option value="monte_carlo">蒙特卡洛模擬 (Monte Carlo)</Option>
                </Select>
              </Form.Item>
              
              <Form.Item name="target_metric" label="優化目標">
                <Select>
                  <Option value="return">最大化總收益</Option>
                  <Option value="sharpe">最大化夏普比率</Option>
                  <Option value="drawdown">最小化最大回撤</Option>
                  <Option value="custom">自定義目標函數</Option>
                </Select>
              </Form.Item>
              
              <Form.Item name="iterations" label="迭代次數">
                <InputNumber min={10} max={1000} />
              </Form.Item>
            </Card>
          </TabPane>
          
          <TabPane 
            tab={<span><RocketOutlined />參數範圍</span>} 
            key="2"
          >
            <Alert
              message="請為需要優化的參數設定搜索範圍"
              description="系統將在指定範圍內尋找最佳參數組合。範圍越大，優化時間越長，但可能找到更好的參數。"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            {form.getFieldValue('strategy_type') === 'ma_cross' && (
              <Card title="移動平均線參數範圍" size="small" style={{ marginBottom: 16 }}>
                <Form.Item label="短期MA範圍">
                  <Space style={{ display: 'flex', marginBottom: 8 }}>
                    <Form.Item name={['params', 'ma', 'short_min']} noStyle>
                      <InputNumber min={1} max={50} />
                    </Form.Item>
                    <span>至</span>
                    <Form.Item name={['params', 'ma', 'short_max']} noStyle>
                      <InputNumber min={1} max={50} />
                    </Form.Item>
                  </Space>
                  <Form.Item name={['params', 'ma', 'short_range']} noStyle>
                    <Slider range min={1} max={50} className="parameter-slider" />
                  </Form.Item>
                </Form.Item>
                
                <Form.Item label="長期MA範圍">
                  <Space style={{ display: 'flex', marginBottom: 8 }}>
                    <Form.Item name={['params', 'ma', 'long_min']} noStyle>
                      <InputNumber min={10} max={200} />
                    </Form.Item>
                    <span>至</span>
                    <Form.Item name={['params', 'ma', 'long_max']} noStyle>
                      <InputNumber min={10} max={200} />
                    </Form.Item>
                  </Space>
                  <Form.Item name={['params', 'ma', 'long_range']} noStyle>
                    <Slider range min={10} max={200} className="parameter-slider" />
                  </Form.Item>
                </Form.Item>
              </Card>
            )}
            
            {form.getFieldValue('strategy_type') === 'rsi' && (
              <Card title="RSI參數範圍" size="small" style={{ marginBottom: 16 }}>
                <Form.Item label="RSI週期範圍">
                  <Space style={{ display: 'flex', marginBottom: 8 }}>
                    <Form.Item name={['params', 'rsi', 'period_min']} noStyle>
                      <InputNumber min={1} max={50} />
                    </Form.Item>
                    <span>至</span>
                    <Form.Item name={['params', 'rsi', 'period_max']} noStyle>
                      <InputNumber min={1} max={50} />
                    </Form.Item>
                  </Space>
                  <Form.Item name={['params', 'rsi', 'period_range']} noStyle>
                    <Slider range min={1} max={50} className="parameter-slider" />
                  </Form.Item>
                </Form.Item>
                
                <Form.Item label="超買閾值範圍">
                  <Space style={{ display: 'flex', marginBottom: 8 }}>
                    <Form.Item name={['params', 'rsi', 'overbought_min']} noStyle>
                      <InputNumber min={50} max={90} />
                    </Form.Item>
                    <span>至</span>
                    <Form.Item name={['params', 'rsi', 'overbought_max']} noStyle>
                      <InputNumber min={50} max={90} />
                    </Form.Item>
                  </Space>
                  <Form.Item name={['params', 'rsi', 'overbought_range']} noStyle>
                    <Slider range min={50} max={90} className="parameter-slider" />
                  </Form.Item>
                </Form.Item>
                
                <Form.Item label="超賣閾值範圍">
                  <Space style={{ display: 'flex', marginBottom: 8 }}>
                    <Form.Item name={['params', 'rsi', 'oversold_min']} noStyle>
                      <InputNumber min={10} max={50} />
                    </Form.Item>
                    <span>至</span>
                    <Form.Item name={['params', 'rsi', 'oversold_max']} noStyle>
                      <InputNumber min={10} max={50} />
                    </Form.Item>
                  </Space>
                  <Form.Item name={['params', 'rsi', 'oversold_range']} noStyle>
                    <Slider range min={10} max={50} className="parameter-slider" />
                  </Form.Item>
                </Form.Item>
              </Card>
            )}
          </TabPane>
        </Tabs>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} className="backtest-button">
            開始參數優化
          </Button>
        </Form.Item>
      </Form>

      {optimizationResults && (
        <div className="result-container">
          <Card title="參數優化結果" bordered={false}>
            <Alert
              message="優化完成！"
              description={`根據${optimizationResults.target_metric === 'return' ? '最大化總收益' : 
                optimizationResults.target_metric === 'sharpe' ? '最大化夏普比率' : 
                optimizationResults.target_metric === 'drawdown' ? '最小化最大回撤' : '自定義目標函數'}，
                找到最佳參數組合。`}
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Card title="最佳參數" size="small" style={{ marginBottom: 16 }}>
              {Object.entries(optimizationResults.best_params).map(([key, value]) => (
                <p key={key}><strong>{key}:</strong> {value}</p>
              ))}
              <Button 
                type="primary" 
                onClick={() => handleUseParams(optimizationResults.best_params)}
              >
                使用最佳參數
              </Button>
            </Card>
            
            <Table 
              dataSource={optimizationResults.results} 
              columns={columns} 
              rowKey={(record, index) => index}
              pagination={false}
            />
          </Card>
        </div>
      )}
    </div>
  );
};

export default ParameterOptimizationPage;
