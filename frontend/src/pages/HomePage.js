import React from 'react';
import { Typography, Card, Row, Col, Button } from 'antd';
import { LineChartOutlined, SettingOutlined, BarChartOutlined, RocketOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Title, Paragraph } = Typography;

const HomePage = () => {
  return (
    <div>
      <Typography>
        <Title level={2}>台灣股票回測系統</Title>
        <Paragraph>
          歡迎使用台灣股票回測系統！本系統提供台灣股票的技術指標分析、多空策略回測、策略參數優化和績效報告功能，
          幫助您測試和優化您的交易策略。
        </Paragraph>
      </Typography>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card 
            hoverable 
            title={<><LineChartOutlined /> 技術指標分析</>} 
            className="card-container"
          >
            <p>支持多種技術指標，包括移動平均線、RSI、KD、MACD、布林帶等。</p>
            <Button type="primary" block>
              <Link to="/stock">開始分析</Link>
            </Button>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card 
            hoverable 
            title={<><SettingOutlined /> 多空策略回測</>} 
            className="card-container"
          >
            <p>支持多種交易策略，包括移動平均線交叉、RSI超買超賣、KD交叉等。</p>
            <Button type="primary" block>
              <Link to="/strategy">設定策略</Link>
            </Button>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card 
            hoverable 
            title={<><RocketOutlined /> 策略參數優化</>} 
            className="card-container"
          >
            <p>通過網格搜索、遺傳算法等方法優化策略參數，提高策略表現。</p>
            <Button type="primary" block>
              <Link to="/optimize">參數優化</Link>
            </Button>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card 
            hoverable 
            title={<><BarChartOutlined /> 績效報告</>} 
            className="card-container"
          >
            <p>提供詳細的績效報告，包括總收益率、夏普比率、最大回撤等指標。</p>
            <Button type="primary" block>
              <Link to="/result">查看報告</Link>
            </Button>
          </Card>
        </Col>
      </Row>

      <div style={{ marginTop: 48 }}>
        <Title level={3}>使用流程</Title>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card>
              <ol>
                <li>在「選擇股票」頁面搜索並選擇您想要分析的台灣股票</li>
                <li>在「策略設定」頁面選擇技術指標和交易策略，並設定相關參數</li>
                <li>在「參數優化」頁面設定參數優化範圍和方法（可選）</li>
                <li>系統將執行回測並生成績效報告</li>
                <li>在「回測結果」頁面查看詳細的回測結果和績效指標</li>
              </ol>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default HomePage;
