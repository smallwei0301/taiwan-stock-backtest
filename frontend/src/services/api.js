import axios from 'axios';

const API_BASE_URL = '/api';

// 搜索股票
export const searchStocks = async (query) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/stocks/search`, {
      params: { query }
    });
    return response.data;
  } catch (error) {
    console.error('搜索股票時發生錯誤:', error);
    throw error;
  }
};

// 獲取股票數據
export const getStockData = async (symbol, interval = '1d', range = '1y') => {
  try {
    const response = await axios.get(`${API_BASE_URL}/stocks/data`, {
      params: { symbol, interval, range }
    });
    return response.data;
  } catch (error) {
    console.error('獲取股票數據時發生錯誤:', error);
    throw error;
  }
};

// 計算技術指標
export const calculateIndicators = async (priceData, indicators) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/indicators/calculate`, {
      price_data: priceData,
      indicators: indicators
    });
    return response.data;
  } catch (error) {
    console.error('計算技術指標時發生錯誤:', error);
    throw error;
  }
};

// 執行回測
export const runBacktest = async (priceData, strategy, initialCapital) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/backtest/run`, {
      price_data: priceData,
      strategy: strategy,
      initial_capital: initialCapital
    });
    return response.data;
  } catch (error) {
    console.error('執行回測時發生錯誤:', error);
    throw error;
  }
};

// 執行參數優化
export const runOptimization = async (priceData, strategy, optimization, initialCapital) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/optimize/run`, {
      price_data: priceData,
      strategy: strategy,
      optimization: optimization,
      initial_capital: initialCapital
    });
    return response.data;
  } catch (error) {
    console.error('執行參數優化時發生錯誤:', error);
    throw error;
  }
};
