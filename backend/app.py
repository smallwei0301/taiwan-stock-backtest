from flask import Flask, request, jsonify
import sys
import pandas as pd
import numpy as np
import json
from datetime import datetime, timedelta
import time

app = Flask(__name__)

# 設定CORS允許跨域請求
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# 搜索股票
@app.route('/api/stocks/search', methods=['GET'])
def search_stocks():
    query = request.args.get('query', '')
    if not query:
        return jsonify({'error': '請提供搜索關鍵字'}), 400
    
    # 這裡模擬搜索結果，實際應用中可以連接到更完整的股票數據庫
    # 台灣股票代碼通常是數字加上.TW
    taiwan_stocks = [
        {'symbol': '2330.TW', 'name': '台積電', 'exchange': 'TAI', 'industry': '半導體'},
        {'symbol': '2317.TW', 'name': '鴻海', 'exchange': 'TAI', 'industry': '電子零組件'},
        {'symbol': '2412.TW', 'name': '中華電信', 'exchange': 'TAI', 'industry': '電信服務'},
        {'symbol': '2454.TW', 'name': '聯發科', 'exchange': 'TAI', 'industry': '半導體'},
        {'symbol': '2882.TW', 'name': '國泰金', 'exchange': 'TAI', 'industry': '金融業'},
        {'symbol': '2881.TW', 'name': '富邦金', 'exchange': 'TAI', 'industry': '金融業'},
        {'symbol': '1301.TW', 'name': '台塑', 'exchange': 'TAI', 'industry': '塑膠工業'},
        {'symbol': '2303.TW', 'name': '聯電', 'exchange': 'TAI', 'industry': '半導體'},
        {'symbol': '2308.TW', 'name': '台達電', 'exchange': 'TAI', 'industry': '電子零組件'},
        {'symbol': '2002.TW', 'name': '中鋼', 'exchange': 'TAI', 'industry': '鋼鐵業'},
        {'symbol': '0050.TW', 'name': '元大台灣50', 'exchange': 'TAI', 'industry': 'ETF'},
        {'symbol': '0056.TW', 'name': '元大高股息', 'exchange': 'TAI', 'industry': 'ETF'},
    ]
    
    # 根據查詢過濾股票
    results = [stock for stock in taiwan_stocks if 
               query.lower() in stock['symbol'].lower() or 
               query.lower() in stock['name'].lower()]
    
    return jsonify(results)

# 獲取股票數據
@app.route('/api/stocks/data', methods=['GET'])
def get_stock_data():
    symbol = request.args.get('symbol', '')
    interval = request.args.get('interval', '1d')
    range_period = request.args.get('range', '1y')
    
    if not symbol:
        return jsonify({'error': '請提供股票代碼'}), 400
    
    try:
        # 模擬股票數據
        # 在實際應用中，這裡會使用Yahoo Finance API獲取真實數據
        dates = pd.date_range(end=datetime.now(), periods=365).tolist()
        
        # 生成模擬價格數據
        base_price = 500  # 假設基礎價格
        if '2330' in symbol:  # 台積電
            base_price = 500
        elif '2317' in symbol:  # 鴻海
            base_price = 120
        elif '2412' in symbol:  # 中華電信
            base_price = 110
        
        # 生成隨機價格波動
        np.random.seed(42)  # 固定隨機種子以獲得可重複的結果
        price_changes = np.random.normal(0, 1, len(dates)) * base_price * 0.01
        
        # 計算價格序列
        closes = [base_price]
        for change in price_changes:
            closes.append(closes[-1] * (1 + change))
        closes = closes[1:]  # 移除初始價格
        
        # 生成其他價格數據
        price_data = []
        for i, date in enumerate(dates):
            close = closes[i]
            price_data.append({
                'date': date.strftime('%Y-%m-%d'),
                'open': close * (1 - np.random.random() * 0.01),
                'high': close * (1 + np.random.random() * 0.015),
                'low': close * (1 - np.random.random() * 0.015),
                'close': close,
                'volume': int(np.random.random() * 10000000 + 5000000),
            })
        
        # 股票信息
        stock_info = {
            'symbol': symbol,
            'name': next((stock['name'] for stock in [
                {'symbol': '2330.TW', 'name': '台積電'},
                {'symbol': '2317.TW', 'name': '鴻海'},
                {'symbol': '2412.TW', 'name': '中華電信'},
                {'symbol': '2454.TW', 'name': '聯發科'},
                {'symbol': '0050.TW', 'name': '元大台灣50'}
            ] if stock['symbol'] == symbol), '未知'),
            'exchange': 'TAI',
            'currency': 'TWD',
            'regularMarketPrice': closes[-1],
            'previousClose': closes[-2],
        }
        
        return jsonify({
            'stock_info': stock_info,
            'price_data': price_data
        })
            
    except Exception as e:
        return jsonify({'error': f'獲取股票數據時發生錯誤: {str(e)}'}), 500

# 計算技術指標
@app.route('/api/indicators/calculate', methods=['POST'])
def calculate_indicators():
    data = request.json
    
    if not data or 'price_data' not in data or 'indicators' not in data:
        return jsonify({'error': '請提供價格數據和指標參數'}), 400
    
    try:
        # 將價格數據轉換為DataFrame
        df = pd.DataFrame(data['price_data'])
        df['date'] = pd.to_datetime(df['date'])
        df.set_index('date', inplace=True)
        
        # 計算請求的技術指標
        results = {}
        
        for indicator in data['indicators']:
            indicator_type = indicator.get('type', '')
            params = indicator.get('params', {})
            
            if indicator_type == 'ma':
                # 移動平均線
                length = params.get('length', 20)
                results[f'ma_{length}'] = df['close'].rolling(window=length).mean().to_dict()
                
            elif indicator_type == 'ema':
                # 指數移動平均線
                length = params.get('length', 20)
                results[f'ema_{length}'] = df['close'].ewm(span=length, adjust=False).mean().to_dict()
                
            elif indicator_type == 'rsi':
                # 相對強弱指標
                length = params.get('length', 14)
                delta = df['close'].diff()
                gain = (delta.where(delta > 0, 0)).rolling(window=length).mean()
                loss = (-delta.where(delta < 0, 0)).rolling(window=length).mean()
                rs = gain / loss
                rsi = 100 - (100 / (1 + rs))
                results['rsi'] = rsi.to_dict()
                
            elif indicator_type == 'macd':
                # MACD
                fast = params.get('fast', 12)
                slow = params.get('slow', 26)
                signal = params.get('signal', 9)
                
                ema_fast = df['close'].ewm(span=fast, adjust=False).mean()
                ema_slow = df['close'].ewm(span=slow, adjust=False).mean()
                macd_line = ema_fast - ema_slow
                signal_line = macd_line.ewm(span=signal, adjust=False).mean()
                histogram = macd_line - signal_line
                
                results['macd'] = macd_line.to_dict()
                results['macd_signal'] = signal_line.to_dict()
                results['macd_histogram'] = histogram.to_dict()
                
            elif indicator_type == 'bollinger':
                # 布林帶
                length = params.get('length', 20)
                std = params.get('std', 2)
                
                middle = df['close'].rolling(window=length).mean()
                std_dev = df['close'].rolling(window=length).std()
                upper = middle + std_dev * std
                lower = middle - std_dev * std
                
                results['bollinger_upper'] = upper.to_dict()
                results['bollinger_middle'] = middle.to_dict()
                results['bollinger_lower'] = lower.to_dict()
                
            elif indicator_type == 'kd':
                # 隨機指標KD
                k_period = params.get('k', 9)
                d_period = params.get('d', 3)
                
                low_min = df['low'].rolling(window=k_period).min()
                high_max = df['high'].rolling(window=k_period).max()
                
                # 計算%K
                k = 100 * ((df['close'] - low_min) / (high_max - low_min))
                # 計算%D
                d = k.rolling(window=d_period).mean()
                
                results['stoch_k'] = k.to_dict()
                results['stoch_d'] = d.to_dict()
                
        return jsonify(results)
        
    except Exception as e:
        return jsonify({'error': f'計算技術指標時發生錯誤: {str(e)}'}), 500

# 執行回測
@app.route('/api/backtest/run', methods=['POST'])
def run_backtest():
    data = request.json
    
    if not data or 'price_data' not in data or 'strategy' not in data:
        return jsonify({'error': '請提供價格數據和策略參數'}), 400
    
    try:
        # 將價格數據轉換為DataFrame
        df = pd.DataFrame(data['price_data'])
        df['date'] = pd.to_datetime(df['date'])
        df.set_index('date', inplace=True)
        
        # 獲取策略參數
        strategy = data['strategy']
        strategy_type = strategy.get('type', '')
        params = strategy.get('params', {})
        
        # 初始資金
        initial_capital = data.get('initial_capital', 1000000)
        
        # 執行回測
        backtest_result = backtest_strategy(df, strategy_type, params, initial_capital)
        
        return jsonify(backtest_result)
        
    except Exception as e:
        return jsonify({'error': f'執行回測時發生錯誤: {str(e)}'}), 500

# 執行參數優化
@app.route('/api/optimize/run', methods=['POST'])
def run_optimization():
    data = request.json
    
    if not data or 'price_data' not in data or 'strategy' not in data or 'optimization' not in data:
        return jsonify({'error': '請提供價格數據、策略參數和優化參數'}), 400
    
    try:
        # 將價格數據轉換為DataFrame
        df = pd.DataFrame(data['price_data'])
        df['date'] = pd.to_datetime(df['date'])
        df.set_index('date', inplace=True)
        
        # 獲取策略和優化參數
        strategy = data['strategy']
        strategy_type = strategy.get('type', '')
        optimization = data['optimization']
        optimization_method = optimization.get('method', 'grid')
        target_metric = optimization.get('target_metric', 'sharpe')
        param_ranges = optimization.get('param_ranges', {})
        
        # 初始資金
        initial_capital = data.get('initial_capital', 1000000)
        
        # 執行參數優化
        optimization_result = optimize_strategy_parameters(
            df, strategy_type, param_ranges, optimization_method, 
            target_metric, initial_capital
        )
        
        return jsonify(optimization_result)
        
    except Exception as e:
        return jsonify({'error': f'執行參數優化時發生錯誤: {str(e)}'}), 500

# 回測策略函數
def backtest_strategy(df, strategy_type, params, initial_capital):
    # 創建回測結果DataFrame
    df_backtest = df.copy()
    
    # 根據策略類型計算交易信號
    if strategy_type == 'ma_cross':
        # 移動平均線交叉策略
        short_period = params.get('short', 5)
        long_period = params.get('long', 20)
        
        # 計算短期和長期移動平均線
        df_backtest[f'ma_short'] = df_backtest['close'].rolling(window=short_period).mean()
        df_backtest[f'ma_long'] = df_backtest['close'].rolling(window=long_period).mean()
        
        # 計算交易信號：短期均線上穿長期均線為買入信號(1)，下穿為賣出信號(-1)
        df_backtest['signal'] = 0
        df_backtest['position'] = 0
        
        # 計算交叉信號
        df_backtest['cross_above'] = (df_backtest['ma_short'] > df_backtest['ma_long']) & (df_backtest['ma_short'].shift(1) <= df_backtest['ma_long'].shift(1))
        df_backtest['cross_below'] = (df_backtest['ma_short'] < df_backtest['ma_long']) & (df_backtest['ma_short'].shift(1) >= df_backtest['ma_long'].shift(1))
        
        # 設置買入和賣出信號
        df_backtest.loc[df_backtest['cross_above'], 'signal'] = 1
        df_backtest.loc[df_backtest['cross_below'], 'signal'] = -1
        
    elif strategy_type == 'rsi':
        # RSI超買超賣策略
        period = params.get('period', 14)
        overbought = params.get('overbought', 70)
        oversold = params.get('oversold', 30)
        
        # 計算RSI
        delta = df_backtest['close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        df_backtest['rsi'] = 100 - (100 / (1 + rs))
        
        # 計算交易信號：RSI低於超賣線為買入信號(1)，高於超買線為賣出信號(-1)
        df_backtest['signal'] = 0
        df_backtest['position'] = 0
        
        # 設置買入和賣出信號
        df_backtest.loc[df_backtest['rsi'] < oversold, 'signal'] = 1
        df_backtest.loc[df_backtest['rsi'] > overbought, 'signal'] = -1
        
    elif strategy_type == 'bollinger':
        # 布林帶突破策略
        period = params.get('period', 20)
        std = params.get('std', 2)
        
        # 計算布林帶
        df_backtest['bollinger_middle'] = df_backtest['close'].rolling(window=period).mean()
        df_backtest['bollinger_std'] = df_backtest['close'].rolling(window=period).std()
        df_backtest['bollinger_upper'] = df_backtest['bollinger_middle'] + df_backtest['bollinger_std'] * std
        df_backtest['bollinger_lower'] = df_backtest['bollinger_middle'] - df_backtest['bollinger_std'] * std
        
        # 計算交易信號：價格突破上軌為買入信號(1)，突破下軌為賣出信號(-1)
        df_backtest['signal'] = 0
        df_backtest['position'] = 0
        
        # 設置買入和賣出信號
        df_backtest.loc[df_backtest['close'] > df_backtest['bollinger_upper'], 'signal'] = 1
        df_backtest.loc[df_backtest['close'] < df_backtest['bollinger_lower'], 'signal'] = -1
    
    # 計算持倉
    df_backtest['position'] = df_backtest['signal'].replace(to_replace=0, method='ffill')
    
    # 計算每日收益
    df_backtest['returns'] = df_backtest['close'].pct_change()
    df_backtest['strategy_returns'] = df_backtest['position'].shift(1) * df_backtest['returns']
    
    # 計算累積收益
    df_backtest['cumulative_returns'] = (1 + df_backtest['returns']).cumprod()
    df_backtest['cumulative_strategy_returns'] = (1 + df_backtest['strategy_returns']).cumprod()
    
    # 計算權益曲線
    df_backtest['equity'] = initial_capital * df_backtest['cumulative_strategy_returns']
    
    # 生成交易記錄
    trades = []
    current_position = 0
    entry_price = 0
    entry_date = None
    
    for index, row in df_backtest.iterrows():
        if row['signal'] != 0:
            if row['signal'] == 1 and current_position <= 0:
                # 買入
                current_position = 1
                entry_price = row['close']
                entry_date = index
                trades.append({
                    'date': index.strftime('%Y-%m-%d'),
                    'type': '買入',
                    'price': entry_price,
                    'shares': int(initial_capital * 0.1 / entry_price),  # 假設每次使用10%資金
                    'amount': int(initial_capital * 0.1),
                    'pnl': 0
                })
            elif row['signal'] == -1 and current_position >= 0:
                # 賣出
                if current_position > 0:
                    exit_price = row['close']
                    shares = int(initial_capital * 0.1 / entry_price)
                    pnl = shares * (exit_price - entry_price)
                    trades.append({
                        'date': index.strftime('%Y-%m-%d'),
                        'type': '賣出',
                        'price': exit_price,
                        'shares': shares,
                        'amount': int(shares * exit_price),
                        'pnl': int(pnl)
                    })
                current_position = -1
                entry_price = row['close']
                entry_date = index
    
    # 計算績效指標
    total_return = df_backtest['cumulative_strategy_returns'].iloc[-1] - 1 if not df_backtest.empty else 0
    
    # 計算年化收益率
    days = (df_backtest.index[-1] - df_backtest.index[0]).days
    annualized_return = (1 + total_return) ** (365 / days) - 1 if days > 0 else 0
    
    # 計算最大回撤
    df_backtest['peak'] = df_backtest['equity'].cummax()
    df_backtest['drawdown'] = (df_backtest['equity'] - df_backtest['peak']) / df_backtest['peak']
    max_drawdown = df_backtest['drawdown'].min()
    
    # 計算夏普比率
    risk_free_rate = 0.02  # 假設無風險利率為2%
    sharpe_ratio = (annualized_return - risk_free_rate) / (df_backtest['strategy_returns'].std() * (252 ** 0.5)) if df_backtest['strategy_returns'].std() > 0 else 0
    
    # 計算勝率
    winning_trades = sum(1 for trade in trades if trade['type'] == '賣出' and trade['pnl'] > 0)
    total_trades = sum(1 for trade in trades if trade['type'] == '賣出')
    win_rate = winning_trades / total_trades if total_trades > 0 else 0
    
    # 計算月度收益
    df_backtest['year_month'] = df_backtest.index.strftime('%Y-%m')
    monthly_returns = df_backtest.groupby('year_month')['strategy_returns'].sum().reset_index()
    monthly_returns_list = [{'month': row['year_month'], 'return': row['strategy_returns']} for _, row in monthly_returns.iterrows()]
    
    # 返回回測結果
    return {
        'performance_metrics': {
            'total_return': total_return,
            'annualized_return': annualized_return,
            'sharpe_ratio': sharpe_ratio,
            'max_drawdown': max_drawdown,
            'win_rate': win_rate,
            'total_trades': total_trades
        },
        'trades': trades,
        'monthly_returns': monthly_returns_list,
        'equity_curve': [{'date': index.strftime('%Y-%m-%d'), 'equity': row['equity']} for index, row in df_backtest.iterrows()]
    }

# 參數優化函數
def optimize_strategy_parameters(df, strategy_type, param_ranges, optimization_method, target_metric, initial_capital):
    best_params = {}
    best_metric_value = -float('inf') if target_metric != 'max_drawdown' else float('inf')
    results = []
    
    if strategy_type == 'ma_cross':
        # 移動平均線交叉策略參數優化
        short_range = param_ranges.get('short', [5, 10, 15])
        long_range = param_ranges.get('long', [20, 30, 40, 50])
        
        for short_period in short_range:
            for long_period in long_range:
                if short_period >= long_period:
                    continue
                    
                params = {'short': short_period, 'long': long_period}
                backtest_result = backtest_strategy(df, strategy_type, params, initial_capital)
                
                # 獲取目標指標值
                metric_value = get_metric_value(backtest_result, target_metric)
                
                # 記錄結果
                result = {
                    'params': params,
                    'metrics': backtest_result['performance_metrics']
                }
                results.append(result)
                
                # 更新最佳參數
                if (target_metric != 'max_drawdown' and metric_value > best_metric_value) or \
                   (target_metric == 'max_drawdown' and metric_value < best_metric_value):
                    best_metric_value = metric_value
                    best_params = params
    
    elif strategy_type == 'rsi':
        # RSI策略參數優化
        period_range = param_ranges.get('period', [7, 14, 21])
        overbought_range = param_ranges.get('overbought', [65, 70, 75, 80])
        oversold_range = param_ranges.get('oversold', [20, 25, 30, 35])
        
        for period in period_range:
            for overbought in overbought_range:
                for oversold in oversold_range:
                    if oversold >= overbought:
                        continue
                        
                    params = {'period': period, 'overbought': overbought, 'oversold': oversold}
                    backtest_result = backtest_strategy(df, strategy_type, params, initial_capital)
                    
                    # 獲取目標指標值
                    metric_value = get_metric_value(backtest_result, target_metric)
                    
                    # 記錄結果
                    result = {
                        'params': params,
                        'metrics': backtest_result['performance_metrics']
                    }
                    results.append(result)
                    
                    # 更新最佳參數
                    if (target_metric != 'max_drawdown' and metric_value > best_metric_value) or \
                       (target_metric == 'max_drawdown' and metric_value < best_metric_value):
                        best_metric_value = metric_value
                        best_params = params
    
    # 按目標指標排序結果
    if target_metric != 'max_drawdown':
        results.sort(key=lambda x: get_metric_value(x, target_metric), reverse=True)
    else:
        results.sort(key=lambda x: get_metric_value(x, target_metric))
    
    # 返回優化結果
    return {
        'best_params': best_params,
        'best_metric_value': best_metric_value,
        'results': results[:10]  # 只返回前10個結果
    }

# 獲取指標值的輔助函數
def get_metric_value(result, metric_name):
    if isinstance(result, dict) and 'performance_metrics' in result:
        metrics = result['performance_metrics']
    else:
        metrics = result['metrics']
        
    if metric_name == 'total_return':
        return metrics['total_return']
    elif metric_name == 'annualized_return':
        return metrics['annualized_return']
    elif metric_name == 'sharpe_ratio':
        return metrics['sharpe_ratio']
    elif metric_name == 'max_drawdown':
        return metrics['max_drawdown']
    elif metric_name == 'win_rate':
        return metrics['win_rate']
    else:
        return 0

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
