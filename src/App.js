import React from 'react';
import { Layout, Menu, Typography } from 'antd';
import { Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import StockSelectPage from './pages/StockSelectPage';
import StrategySettingPage from './pages/StrategySettingPage';
import ParameterOptimizationPage from './pages/ParameterOptimizationPage';
import BacktestResultPage from './pages/BacktestResultPage';

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

const App = () => {
  return (
    <Layout className="layout">
      <Header>
        <div className="logo">股票回測</div>
        <Menu
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={['1']}
          items={[
            {
              key: '1',
              label: <Link to="/">首頁</Link>,
            },
            {
              key: '2',
              label: <Link to="/stock">選擇股票</Link>,
            },
            {
              key: '3',
              label: <Link to="/strategy">策略設定</Link>,
            },
            {
              key: '4',
              label: <Link to="/optimize">參數優化</Link>,
            },
            {
              key: '5',
              label: <Link to="/result">回測結果</Link>,
            },
          ]}
        />
      </Header>
      <Content style={{ padding: '0 50px' }}>
        <div className="site-layout-content" style={{ margin: '16px 0' }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/stock" element={<StockSelectPage />} />
            <Route path="/strategy" element={<StrategySettingPage />} />
            <Route path="/optimize" element={<ParameterOptimizationPage />} />
            <Route path="/result" element={<BacktestResultPage />} />
          </Routes>
        </div>
      </Content>
      <Footer style={{ textAlign: 'center' }}>台灣股票回測系統 ©2025</Footer>
    </Layout>
  );
};

export default App;
