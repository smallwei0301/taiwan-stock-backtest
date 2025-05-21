import React, { useState, useEffect } from 'react';
import { Typography, Card, Form, Select, InputNumber, Switch, Button, Divider, Tabs, Space, Alert, message, Spin } from 'antd';
import { LineChartOutlined, SettingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getStockData, calculateIndicators, runBacktest } from '../services/api';

const { Title, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const StrategySettingPage = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [selectedIndicators, setSelectedIndicators] = useState([]);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
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

  const handleIndicatorChange = (value) => {
    setSelectedIndicators(value);
  };

  const handleStrategyChange = (value) => {
    setSelectedStrategy(value);
    
    // 根據選擇的策略預設相關指標
    switch(value) {
      case 'ma_cross':
        form.setFieldsValue({ indicators: ['ma'] });
        setSelectedIndicators(['ma']);
        break;
      case 'rsi':
        form.setFieldsValue({ indicators: ['rsi'] });
        setSelectedIndicators(['rsi']);
        break;
      case 'kd_cross':
        form.setFieldsValue({ indicators: ['kd'] });
        setSelectedIndicators(['kd']);
        break;
      case 'macd':
        form.setFieldsValue({ indicators: ['macd'] });
        setSelectedIndicators(['macd']);
        break;
      case 'bollinger':
        form.setFieldsValue({ indicators: ['bollinger'] });
        setSelectedIndicators(['bollinger']);
        break;
      case 'multi':
        // 多指標組合策略不預設指標
        break;
      default:
        break;
    }
  };

  const onFinish = async (values) => {
    if (!stockData || !stockData.price_data) {
      message.error('無股票數據，無法執行回測');
      return;
    }

    setLoading(true);
    
    try {
      // 準備策略參數
      const strategyType = values.strategy_type;
      let strategyParams = {};
      
      switch(strategyType) {
        case 'ma_cross':
          strategyParams = {
            short: values.params?.ma?.short || 5,
            long: values.params?.ma?.long || 20
          };
          break;
        case 'rsi':
          strategyParams = {
            period: values.params?.rsi?.period || 14,
            overbought: values.params?.rsi?.overbought || 70,
            oversold: values.params?.rsi?.oversold || 30
          };
          break;
        case 'bollinger':
          strategyParams = {
            period: values.params?.bollinger?.period || 20,
            std: values.params?.bollinger?.std_dev || 2
          };
          break;
        // 其他策略類型...
      }
      
      // 執行回測
      const backtestResult = await runBacktest(
        stockData.price_data,
        {
          type: strategyType,
          params: strategyParams
        },
        values.initial_capital
      );
      
      // 將回測結果保存到本地存儲
      localStorage.setItem('backtestResult', JSON.stringify(backtestResult));
      localStorage.setItem('backtestStrategy', JSON.stringify({
        type: strategyType,
        params: strategyParams
      }));
      
      message.success('回測完成，正在跳轉到結果頁面');
      navigate('/result');
    } catch (err) {
      message.error('執行回測時發生錯誤');
      console.error('回測錯誤:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderIndicatorParams = () => {
    return (
      <>
        {selectedIndicators.includes('ma') && (
          <Card title="移動平均線 (MA) 參數" size="small" style={{ marginBottom: 16 }}>
            <Form.Item name={['params', 'ma', 'short']} label="短期MA" initialValue={5}>
              <InputNumber min={1} max={100} />
            </Form.Item>
            <Form.Item name={['params', 'ma', 'medium']} label="中期MA" initialValue={10}>
              <InputNumber min={1} max={200} />
            </Form.Item>
            <Form.Item name={['params', 'ma', 'long']} label="長期MA" initialValue={20}>
              <InputNumber min={1} max={300} />
            </Form.Item>
          </Card>
        )}
        
        {selectedIndicators.includes('rsi') && (
          <Card title="相對強弱指標 (RSI) 參數" size="small" style={{ marginBottom: 16 }}>
            <Form.Item name={['params', 'rsi', 'period']} label="週期" initialValue={14}>
              <InputNumber min={1} max={100} />
            </Form.Item>
            <Form.Item name={['params', 'rsi', 'overbought']} label="超買閾值" initialValue={70}>
              <InputNumber min={50} max={100} />
            </Form.Item>
            <Form.Item name={['params', 'rsi', 'oversold']} label="超賣閾值" initialValue={30}>
              <InputNumber min={0} max={50} />
            </Form.Item>
          </Card>
        )}
        
        {selectedIndicators.includes('kd') && (
          <Card title="隨機指標 (KD) 參數" size="small" style={{ marginBottom: 16 }}>
            <Form.Item name={['params', 'kd', 'k_period']} label="K週期" initialValue={9}>
              <InputNumber min={1} max={100} />
            </Form.Item>
            <Form.Item name={['params', 'kd', 'd_period']} label="D週期" initialValue={3}>
              <InputNumber min={1} max={100} />
            </Form.Item>
            <Form.Item name={['params', 'kd', 'slowing']} label="緩和週期" initialValue={3}>
              <InputNumber min={1} max={100} />
            </Form.Item>
          </Card>
        )}
        
        {selectedIndicators.includes('macd') && (
          <Card title="移動平均收斂散度 (MACD) 參數" size="small" style={{ marginBottom: 16 }}>
            <Form.Item name={['params', 'macd', 'fast_period']} label="快線週期" initialValue={12}>
              <InputNumber min={1} max={100} />
            </Form.Item>
            <Form.Item name={['params', 'macd', 'slow_period']} label="慢線週期" initialValue={26}>
              <InputNumber min={1} max={100} />
            </Form.Item>
            <Form.Item name={['params', 'macd', 'signal_period']} label="信號週期" initialValue={9}>
              <InputNumber min={1} max={100} />
            </Form.Item>
          </Card>
        )}
        
        {selectedIndicators.includes('bollinger') && (
          <Card title="布林帶 (Bollinger Bands) 參數" size="small" style={{ marginBottom: 16 }}>
            <Form.Item name={['params', 'bollinger', 'period']} label="週期" initialValue={20}>
              <InputNumber min={1} max={100} />
            </Form.Item>
            <Form.Item name={['params', 'bollinger', 'std_dev']} label="標準差倍數" initialValue={2}>
              <InputNumber min={0.1} max={5} step={0.1} />
            </Form.Item>
          </Card>
        )}
      </>
    );
  };

  const renderStrategyParams = () => {
    return (
      <>
        {selectedStrategy === 'ma_cross' && (
          <Card title="移動平均線交叉策略參數" size="small" style={{ marginBottom: 16 }}>
            <Form.Item name={['strategy', 'ma_cross', 'fast_ma']} label="快線" initialValue="short">
              <Select>
                <Option value="short">短期MA</Option>
                <Option value="medium">中期MA</Option>
              </Select>
            </Form.Item>
            <Form.Item name={['strategy', 'ma_cross', 'slow_ma']} label="慢線" initialValue="long">
              <Select>
                <Option value="medium">中期MA</Option>
                <Option value="long">長期MA</Option>
              </Select>
            </Form.Item>
          </Card>
        )}
        
        {selectedStrategy === 'rsi' && (
          <Card title="RSI超買超賣策略參數" size="small" style={{ marginBottom: 16 }}>
            <Alert 
              message="此策略使用RSI指標的超買超賣信號進行交易" 
              type="info" 
              showIcon 
              style={{ marginBottom: 16 }} 
            />
            <Form.Item name={['strategy', 'rsi', 'use_divergence']} label="使用背離信號" valuePropName="checked" initialValue={false}>
              <Switch />
            </Form.Item>
          </Card>
        )}
        
        {selectedStrategy === 'kd_cross' && (
          <Card title="KD交叉策略參數" size="small" style={{ marginBottom: 16 }}>
            <Form.Item name={['strategy', 'kd_cross', 'overbought']} label="超買閾值" initialValue={80}>
              <InputNumber min={50} max={100} />
            </Form.Item>
            <Form.Item name={['strategy', 'kd_cross', 'oversold']} label="超賣閾值" initialValue={20}>
              <InputNumber min={0} max={50} />
            </Form.Item>
          </Card>
        )}
        
        {selectedStrategy === 'macd' && (
          <Card title="MACD交叉策略參數" size="small" style={{ marginBottom: 16 }}>
            <Alert 
              message="此策略使用MACD線與信號線的交叉進行交易" 
              type="info" 
              showIcon 
              style={{ marginBottom: 16 }} 
            />
            <Form.Item name={['strategy', 'macd', 'use_histogram']} label="使用柱狀圖信號" valuePropName="checked" initialValue={false}>
              <Switch />
            </Form.Item>
          </Card>
        )}
        
        {selectedStrategy === 'bollinger' && (
          <Card title="布林帶突破策略參數" size="small" style={{ marginBottom: 16 }}>
            <Form.Item name={['strategy', 'bollinger', 'use_middle']} label="使用中軌反轉信號" valuePropName="checked" initialValue={false}>
              <Switch />
            </Form.Item>
            <Form.Item name={['strategy', 'bollinger', 'use_squeeze']} label="使用帶寬縮窄信號" valuePropName="checked" initialValue={false}>
              <Switch />
            </Form.Item>
          </Card>
        )}
        
        {selectedStrategy === 'multi' && (
          <Card title="多指標組合策略參數" size="small" style={{ marginBottom: 16 }}>
            <Alert 
              message="此策略需要選擇多個技術指標，並設定它們的組合規則" 
              type="info" 
              showIcon 
              style={{ marginBottom: 16 }} 
            />
            <Form.Item name={['strategy', 'multi', 'logic']} label="指標組合邏輯" initialValue="and">
              <Select>
                <Option value="and">全部滿足 (AND)</Option>
                <Option value="or">任一滿足 (OR)</Option>
                <Option value="majority">多數滿足 (MAJORITY)</Option>
              </Select>
            </Form.Item>
          </Card>
        )}
      </>
    );
  };

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
        <Title level={2}>策略設定</Title>
        <Paragraph>
          請選擇技術指標和交易策略，並設定相關參數。系統將根據您的設定執行回測。
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
        name="strategy_form"
        onFinish={onFinish}
        layout="vertical"
        className="strategy-form"
        initialValues={{
          backtest_period: 365,
          initial_capital: 1000000,
          position_size: 0.1,
        }}
      >
        <Tabs defaultActiveKey="1">
          <TabPane 
            tab={<span><LineChartOutlined />技術指標設定</span>} 
            key="1"
          >
            <Form.Item
              name="indicators"
              label="選擇技術指標"
              rules={[{ required: true, message: '請選擇至少一個技術指標' }]}
            >
              <Select
                mode="multiple"
                placeholder="選擇技術指標"
                onChange={handleIndicatorChange}
                className="indicator-select"
              >
                <Option value="ma">移動平均線 (MA)</Option>
                <Option value="rsi">相對強弱指標 (RSI)</Option>
                <Option value="kd">隨機指標 (KD)</Option>
                <Option value="macd">移動平均收斂散度 (MACD)</Option>
                <Option value="bollinger">布林帶 (Bollinger Bands)</Option>
                <Option value="volume">成交量指標 (Volume)</Option>
              </Select>
            </Form.Item>

            {renderIndicatorParams()}
          </TabPane>
          
          <TabPane 
            tab={<span><SettingOutlined />交易策略設定</span>} 
            key="2"
          >
            <Form.Item
              name="strategy_type"
              label="選擇交易策略"
              rules={[{ required: true, message: '請選擇交易策略' }]}
            >
              <Select
                placeholder="選擇交易策略"
                onChange={handleStrategyChange}
                className="indicator-select"
              >
                <Option value="ma_cross">移動平均線交叉策略</Option>
                <Option value="rsi">RSI超買超賣策略</Option>
                <Option value="kd_cross">KD交叉策略</Option>
                <Option value="macd">MACD交叉策略</Option>
                <Option value="bollinger">布林帶突破策略</Option>
                <Option value="multi">多指標組合策略</Option>
              </Select>
            </Form.Item>

            {renderStrategyParams()}
          </TabPane>
          
          <TabPane 
            tab={<span>回測設定</span>} 
            key="3"
          >
            <Card title="回測參數" size="small" style={{ marginBottom: 16 }}>
              <Form.Item name="backtest_period" label="回測期間(天)" initialValue={365}>
                <Select>
                  <Option value={90}>3個月</Option>
                  <Option value={180}>6個月</Option>
                  <Option value={365}>1年</Option>
                  <Option value={730}>2年</Option>
                  <Option value={1095}>3年</Option>
                  <Option value={1825}>5年</Option>
                </Select>
              </Form.Item>
              
              <Form.Item name="initial_capital" label="初始資金" initialValue={1000000}>
                <InputNumber
                  min={10000}
                  max={100000000}
                  step={10000}
                  formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
              
              <Form.Item name="position_size" label="倉位大小(佔總資金比例)" initialValue={0.1}>
                <InputNumber
                  min={0.01}
                  max={1}
                  step={0.01}
                  formatter={value => `${value * 100}%`}
                  parser={value => value.replace('%', '') / 100}
                />
              </Form.Item>
              
              <Form.Item name="use_stop_loss" label="使用止損" valuePropName="checked" initialValue={false}>
                <Switch />
              </Form.Item>
              
              {form.getFieldValue('use_stop_loss') && (
                <Form.Item name="stop_loss_pct" label="止損百分比" initialValue={0.05}>
                  <InputNumber
                    min={0.01}
                    max={0.5}
                    step={0.01}
                    formatter={value => `${value * 100}%`}
                    parser={value => value.replace('%', '') / 100}
                  />
                </Form.Item>
              )}
              
              <Form.Item name="use_take_profit" label="使用止盈" valuePropName="checked" initialValue={false}>
                <Switch />
              </Form.Item>
              
              {form.getFieldValue('use_take_profit') && (
                <Form.Item name="take_profit_pct" label="止盈百分比" initialValue={0.1}>
                  <InputNumber
                    min={0.01}
                    max={1}
                    step={0.01}
                    formatter={value => `${value * 100}%`}
                    parser={value => value.replace('%', '') / 100}
                  />
                </Form.Item>
              )}
            </Card>
          </TabPane>
        </Tabs>

        <Divider />
        
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading} className="backtest-button">
              執行回測
            </Button>
            <Button type="default" href="/optimize">
              進行參數優化
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
};

export default StrategySettingPage;
