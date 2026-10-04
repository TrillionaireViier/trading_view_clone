import React, { useState, useEffect, useRef } from 'react';
import { createChart, ColorType, LineStyle, CrosshairMode } from 'lightweight-charts';
import {
  TrendingUp, TrendingDown, BarChart2, Search, Sliders, Layers, RefreshCw,
  Plus, Minus, Eye, EyeOff, Lock, Globe, Bell, Share2, Settings, Download,
  Maximize2, Play, Pause, ChevronDown, Check, Activity, DollarSign, Zap,
  Circle, HelpCircle, ArrowUpRight, ArrowDownRight, Compass, Shield, Filter,
  Volume2, Clock, Trash2, Edit3, Grid, FileText
} from 'lucide-react';

// Sample crypto symbols list
const SYMBOLS = [
  { symbol: 'BTCUSDT', name: 'Bitcoin / TetherUS', price: 92450.80, change: +3.42, volume: '4.2B', high: 93800.00, low: 89120.50 },
  { symbol: 'ETHUSDT', name: 'Ethereum / TetherUS', price: 3480.20, change: +4.15, volume: '2.8B', high: 3550.00, low: 3310.00 },
  { symbol: 'SOLUSDT', name: 'Solana / TetherUS', price: 215.40, change: -1.25, volume: '1.4B', high: 224.00, low: 208.50 },
  { symbol: 'BNBUSDT', name: 'BNB / TetherUS', price: 642.10, change: +0.85, volume: '620M', high: 650.00, low: 635.00 },
  { symbol: 'XRPUSDT', name: 'XRP / TetherUS', price: 1.845, change: +12.30, volume: '3.1B', high: 1.95, low: 1.62 },
  { symbol: 'ADAUSDT', name: 'Cardano / TetherUS', price: 0.985, change: -2.10, volume: '410M', high: 1.04, low: 0.95 },
  { symbol: 'DOGEUSDT', name: 'Dogecoin / TetherUS', price: 0.385, change: +8.45, volume: '1.9B', high: 0.42, low: 0.34 },
  { symbol: 'AVAXUSDT', name: 'Avalanche / TetherUS', price: 42.60, change: +1.90, volume: '320M', high: 44.10, low: 40.80 },
];

const TIMEFRAMES = ['1m', '5m', '15m', '1H', '4H', '1D', '1W'];

// Generate dummy candlestick data
const generateChartData = (basePrice = 90000, count = 250) => {
  const data = [];
  let currentPrice = basePrice;
  const now = new Date();
  const startTime = new Date(now.getTime() - count * 3600 * 1000);

  for (let i = 0; i < count; i++) {
    const time = Math.floor((startTime.getTime() + i * 3600 * 1000) / 1000);
    const volatility = currentPrice * 0.008;
    const change = (Math.random() - 0.48) * volatility;
    
    const open = currentPrice;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    const volume = Math.floor(Math.random() * 500 + 100);

    data.push({
      time,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume
    });

    currentPrice = close;
  }
  return data;
};

export default function App() {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candlestickSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);

  const [selectedSymbol, setSelectedSymbol] = useState(SYMBOLS[0]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1H');
  const [chartType, setChartType] = useState('candles'); // candles, line, area
  const [activeTab, setActiveTab] = useState('watchlist'); // watchlist, orderbook, trades
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [drawingTool, setDrawingTool] = useState('trendline');
  const [drawingsCount, setDrawingsCount] = useState(2);
  const [indicators, setIndicators] = useState({ rsi: true, ma20: true, ma50: false, bb: false });
  const [orderType, setOrderType] = useState('limit');
  const [orderSide, setOrderSide] = useState('buy');
  const [orderPrice, setOrderPrice] = useState('92450.80');
  const [orderAmount, setOrderAmount] = useState('0.05');
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState([
    { id: 1, symbol: 'BTCUSDT', type: 'Limit Buy', price: '91200.00', amount: '0.10', status: 'Open', time: '14:22:05' },
    { id: 2, symbol: 'ETHUSDT', type: 'Market Sell', price: '3480.20', amount: '1.50', status: 'Filled', time: '12:05:40' },
  ]);

  // Orderbook state generator
  const [orderBook, setOrderBook] = useState({ asks: [], bids: [] });

  useEffect(() => {
    // Generate orderbook rows
    const p = selectedSymbol.price;
    const asks = Array.from({ length: 9 }).map((_, i) => ({
      price: (p * (1 + (i + 1) * 0.0006)).toFixed(2),
      size: (Math.random() * 2 + 0.1).toFixed(3),
      total: 0
    })).reverse();

    const bids = Array.from({ length: 9 }).map((_, i) => ({
      price: (p * (1 - (i + 1) * 0.0006)).toFixed(2),
      size: (Math.random() * 2 + 0.1).toFixed(3),
      total: 0
    }));

    setOrderBook({ asks, bids });
    setOrderPrice(p.toString());
  }, [selectedSymbol]);

  // Initialize Lightweight Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    let chart = null;

    try {
      const container = chartContainerRef.current;
      const width = container.clientWidth || (window.innerWidth - 360);
      const height = container.clientHeight || (window.innerHeight - 220);

      chart = createChart(container, {
        width: Math.max(300, width),
        height: Math.max(200, height),
        layout: {
          background: { type: ColorType.Solid, color: '#131722' },
          textColor: '#d1d4dc',
          fontSize: 12,
          fontFamily: "'Inter', sans-serif",
        },
        grid: {
          vertLines: { color: 'rgba(42, 46, 57, 0.6)' },
          horzLines: { color: 'rgba(42, 46, 57, 0.6)' },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: { color: '#758696', width: 1, style: LineStyle.Dashed },
          horzLine: { color: '#758696', width: 1, style: LineStyle.Dashed },
        },
        rightPriceScale: {
          borderColor: '#2a2e39',
          textColor: '#d1d4dc',
        },
        timeScale: {
          borderColor: '#2a2e39',
          timeVisible: true,
          secondsVisible: false,
        },
        handleScroll: true,
        handleScale: true,
      });

      chartRef.current = chart;

      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#089981',
        downColor: '#f23645',
        borderVisible: false,
        wickUpColor: '#089981',
        wickDownColor: '#f23645',
      });
      candlestickSeriesRef.current = candlestickSeries;

      const volumeSeries = chart.addHistogramSeries({
        color: '#26a69a',
        priceFormat: { type: 'volume' },
        priceScaleId: '',
        scaleMargins: { top: 0.8, bottom: 0 },
      });
      volumeSeriesRef.current = volumeSeries;

      const data = generateChartData(selectedSymbol.price);
      candlestickSeries.setData(data.map(({ time, open, high, low, close }) => ({ time, open, high, low, close })));
      volumeSeries.setData(data.map(({ time, volume, open, close }) => ({
        time,
        value: volume,
        color: close >= open ? 'rgba(8, 153, 129, 0.4)' : 'rgba(242, 54, 69, 0.4)'
      })));
    } catch (err) {
      console.error('Lightweight Charts initialization error:', err);
    }

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth || 800,
          height: chartContainerRef.current.clientHeight || 500,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    setTimeout(handleResize, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [selectedSymbol]);

  const handleCreateOrder = (e) => {
    e.preventDefault();
    const newOrd = {
      id: Date.now(),
      symbol: selectedSymbol.symbol,
      type: `${orderType.toUpperCase()} ${orderSide.toUpperCase()}`,
      price: orderPrice,
      amount: orderAmount,
      status: 'Open',
      time: new Date().toLocaleTimeString()
    };
    setOrders([newOrd, ...orders]);
  };

  const filteredSymbols = SYMBOLS.filter(s =>
    s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen w-screen bg-[#131722] text-[#d1d4dc] overflow-hidden">
      
      {/* TOP NAVBAR */}
      <header className="flex items-center justify-between h-12 px-3 border-b border-[#2a2e39] bg-[#1e222d] shrink-0">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="flex items-center gap-1.5 cursor-pointer font-extrabold text-white tracking-tight text-base">
            <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center font-black text-sm shadow-md">
              TV
            </div>
            <span className="hidden sm:inline">TradingView</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-[#2a2e39] text-blue-400 font-mono font-medium">PRO+</span>
          </div>

          <div className="h-5 w-px bg-[#2a2e39]" />

          {/* Symbol Selector Pill */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#131722] border border-[#2a2e39] hover:border-blue-500 cursor-pointer transition-all">
            <span className="font-bold text-white text-sm">{selectedSymbol.symbol}</span>
            <span className="text-xs text-gray-400 hidden md:inline">{selectedSymbol.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </div>

          <div className="h-5 w-px bg-[#2a2e39] hidden sm:block" />

          {/* Timeframe Selector Bar */}
          <div className="hidden sm:flex items-center gap-0.5">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                onClick={() => setSelectedTimeframe(tf)}
                className={`px-2 py-1 text-xs font-semibold rounded hover:bg-[#2a2e39] transition-colors ${
                  selectedTimeframe === tf ? 'text-blue-400 bg-[#2a2e39]' : 'text-gray-400'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-[#2a2e39] hidden md:block" />

          {/* Indicators dropdown toggle */}
          <button className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded bg-[#2a2e39] hover:bg-[#363c4e] text-gray-200 transition-colors">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span>Индикаторы</span>
            <span className="bg-blue-600 text-white text-[10px] px-1 rounded-full font-bold">4</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-2 text-xs font-mono">
            <span className="text-gray-400">Цена:</span>
            <span className={`font-bold ${selectedSymbol.change >= 0 ? 'text-[#089981]' : 'text-[#f23645]'}`}>
              ${selectedSymbol.price.toLocaleString()}
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
              selectedSymbol.change >= 0 ? 'bg-[#089981]/20 text-[#089981]' : 'bg-[#f23645]/20 text-[#f23645]'
            }`}>
              {selectedSymbol.change >= 0 ? '+' : ''}{selectedSymbol.change}%
            </span>
          </div>

          <button className="p-1.5 rounded hover:bg-[#2a2e39] text-gray-400 hover:text-white transition-colors">
            <Bell className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded hover:bg-[#2a2e39] text-gray-400 hover:text-white transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
          <button className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded shadow transition-all">
            Опубликовать
          </button>
        </div>
      </header>

      {/* MAIN WORKSPACE LAYOUT */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* LEFT TOOLBAR (Drawing tools) */}
        <aside className="w-12 border-r border-[#2a2e39] bg-[#1e222d] flex flex-col items-center py-2 gap-3 shrink-0">
          <button
            onClick={() => { setIsDrawMode(!isDrawMode); setDrawingTool('cursor'); }}
            className={`p-2 rounded hover:bg-[#2a2e39] transition-colors ${drawingTool === 'cursor' ? 'bg-blue-600/30 text-blue-400' : 'text-gray-400'}`}
            title="Курсор / Выделение"
          >
            <Compass className="w-4 h-4" />
          </button>

          <button
            onClick={() => setDrawingTool('trendline')}
            className={`p-2 rounded hover:bg-[#2a2e39] transition-colors ${drawingTool === 'trendline' ? 'bg-blue-600/30 text-blue-400' : 'text-gray-400'}`}
            title="Трендовая линия"
          >
            <TrendingUp className="w-4 h-4" />
          </button>

          <button
            onClick={() => setDrawingTool('fibonacci')}
            className={`p-2 rounded hover:bg-[#2a2e39] transition-colors ${drawingTool === 'fibonacci' ? 'bg-blue-600/30 text-blue-400' : 'text-gray-400'}`}
            title="Сетка Фибоначчи"
          >
            <Sliders className="w-4 h-4" />
          </button>

          <button
            onClick={() => setDrawingTool('brush')}
            className={`p-2 rounded hover:bg-[#2a2e39] transition-colors ${drawingTool === 'brush' ? 'bg-blue-600/30 text-blue-400' : 'text-gray-400'}`}
            title="Кисть / Рисование"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          <button
            onClick={() => setDrawingTool('text')}
            className={`p-2 rounded hover:bg-[#2a2e39] transition-colors ${drawingTool === 'text' ? 'bg-blue-600/30 text-blue-400' : 'text-gray-400'}`}
            title="Текст / Заметка"
          >
            <FileText className="w-4 h-4" />
          </button>

          <div className="w-6 h-px bg-[#2a2e39] my-1" />

          <button
            onClick={() => setDrawingsCount(0)}
            className="p-2 rounded hover:bg-[#2a2e39] text-gray-400 hover:text-red-400 transition-colors"
            title="Удалить все объекты"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </aside>

        {/* CENTER AREA: CHART + BOTTOM ORDERS PANEL */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#131722] relative">
          
          {/* CHART HEADER INFO overlay */}
          <div className="absolute top-2 left-4 z-10 flex items-center gap-3 bg-[#1e222d]/80 backdrop-blur px-3 py-1.5 rounded border border-[#2a2e39]">
            <span className="font-bold text-white text-sm">{selectedSymbol.symbol}</span>
            <span className="text-xs text-gray-400">● 1H ● BINANCE</span>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-gray-400">O: <strong className="text-white">91,850.0</strong></span>
              <span className="text-gray-400">H: <strong className="text-white">93,200.0</strong></span>
              <span className="text-gray-400">L: <strong className="text-white">90,450.0</strong></span>
              <span className="text-gray-400">C: <strong className="text-[#089981]">92,450.8</strong></span>
            </div>
          </div>

          {/* CANVAS CONTAINER */}
          <div ref={chartContainerRef} className="flex-1 w-full h-full relative" />

          {/* BOTTOM TERMINAL PANEL (Positions / Orders / History) */}
          <div className="h-44 border-t border-[#2a2e39] bg-[#1e222d] flex flex-col shrink-0">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#2a2e39] bg-[#181c27]">
              <div className="flex items-center gap-4 text-xs font-semibold">
                <button className="text-blue-400 border-b-2 border-blue-400 pb-1">Открытые Ордера ({orders.length})</button>
                <button className="text-gray-400 hover:text-white pb-1">История Сделок</button>
                <button className="text-gray-400 hover:text-white pb-1">Баланс и Активы</button>
              </div>
              <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                <Circle className="w-2 h-2 fill-emerald-400" /> Подключено к WebSocket
              </span>
            </div>

            {/* Orders Table */}
            <div className="flex-1 overflow-y-auto p-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-gray-400 border-b border-[#2a2e39] pb-1">
                    <th className="pb-2 font-medium">Время</th>
                    <th className="pb-2 font-medium">Пара</th>
                    <th className="pb-2 font-medium">Тип</th>
                    <th className="pb-2 font-medium">Цена</th>
                    <th className="pb-2 font-medium">Количество</th>
                    <th className="pb-2 font-medium">Статус</th>
                    <th className="pb-2 font-medium text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2e39]">
                  {orders.map(ord => (
                    <tr key={ord.id} className="hover:bg-[#2a2e39]/50 transition-colors">
                      <td className="py-2 text-gray-400 font-mono">{ord.time}</td>
                      <td className="py-2 font-bold text-white">{ord.symbol}</td>
                      <td className={`py-2 font-semibold ${ord.type.includes('BUY') ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                        {ord.type}
                      </td>
                      <td className="py-2 font-mono text-gray-200">${ord.price}</td>
                      <td className="py-2 font-mono text-gray-200">{ord.amount}</td>
                      <td className="py-2">
                        <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-bold">
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-2 text-right">
                        <button
                          onClick={() => setOrders(orders.filter(o => o.id !== ord.id))}
                          className="px-2 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded text-[11px] transition-colors"
                        >
                          Отмена
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR: WATCHLIST / ORDERBOOK / TRADE EXECUTION PANEL */}
        <div className="w-80 border-l border-[#2a2e39] bg-[#1e222d] flex flex-col shrink-0">
          
          {/* TAB HEADERS */}
          <div className="flex items-center border-b border-[#2a2e39] bg-[#181c27]">
            <button
              onClick={() => setActiveTab('watchlist')}
              className={`flex-1 py-2 text-xs font-bold text-center border-b-2 transition-colors ${
                activeTab === 'watchlist' ? 'border-blue-500 text-blue-400 bg-[#1e222d]' : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              Котировки
            </button>
            <button
              onClick={() => setActiveTab('orderbook')}
              className={`flex-1 py-2 text-xs font-bold text-center border-b-2 transition-colors ${
                activeTab === 'orderbook' ? 'border-blue-500 text-blue-400 bg-[#1e222d]' : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              Стакан
            </button>
            <button
              onClick={() => setActiveTab('trade')}
              className={`flex-1 py-2 text-xs font-bold text-center border-b-2 transition-colors ${
                activeTab === 'trade' ? 'border-blue-500 text-blue-400 bg-[#1e222d]' : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              Торговля
            </button>
          </div>

          {/* TAB 1: WATCHLIST */}
          {activeTab === 'watchlist' && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Search bar */}
              <div className="p-2 border-b border-[#2a2e39]">
                <div className="flex items-center px-2.5 py-1.5 bg-[#131722] border border-[#2a2e39] rounded text-xs">
                  <Search className="w-3.5 h-3.5 text-gray-400 mr-2" />
                  <input
                    type="text"
                    placeholder="Поиск символа (BTC, ETH...)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent text-white focus:outline-none w-full"
                  />
                </div>
              </div>

              {/* Symbol List */}
              <div className="flex-1 overflow-y-auto divide-y divide-[#2a2e39]/50">
                {filteredSymbols.map((item) => (
                  <div
                    key={item.symbol}
                    onClick={() => setSelectedSymbol(item)}
                    className={`flex items-center justify-between p-2.5 hover:bg-[#2a2e39]/60 cursor-pointer transition-colors ${
                      selectedSymbol.symbol === item.symbol ? 'bg-[#2a2e39] border-l-2 border-blue-500' : ''
                    }`}
                  >
                    <div>
                      <div className="font-bold text-white text-xs">{item.symbol}</div>
                      <div className="text-[10px] text-gray-400 font-mono">Vol {item.volume}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-xs text-white">${item.price.toLocaleString()}</div>
                      <div className={`text-[11px] font-mono font-semibold ${item.change >= 0 ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                        {item.change >= 0 ? '+' : ''}{item.change}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: ORDERBOOK */}
          {activeTab === 'orderbook' && (
            <div className="flex-1 flex flex-col p-3 min-h-0 font-mono text-xs">
              <div className="text-gray-400 mb-2 font-bold uppercase text-[11px] flex justify-between">
                <span>Цена (USDT)</span>
                <span>Размер</span>
              </div>

              {/* ASKS (Sell Orders - Red) */}
              <div className="flex-1 flex flex-col justify-end space-y-1 overflow-hidden">
                {orderBook.asks.map((ask, i) => (
                  <div key={i} className="flex justify-between items-center relative py-0.5 px-1 hover:bg-red-500/10">
                    <div className="absolute right-0 top-0 bottom-0 bg-red-500/10 pointer-events-none" style={{ width: `${Math.min(100, ask.size * 35)}%` }} />
                    <span className="text-[#f23645] font-semibold">{ask.price}</span>
                    <span className="text-gray-300 z-10">{ask.size}</span>
                  </div>
                ))}
              </div>

              {/* CURRENT MID PRICE DISPLAY */}
              <div className="py-2.5 my-2 border-y border-[#2a2e39] text-center bg-[#131722] rounded">
                <span className="text-base font-bold text-[#089981] mr-2">${selectedSymbol.price.toLocaleString()}</span>
                <span className="text-xs text-gray-400">↑ 92,480.0</span>
              </div>

              {/* BIDS (Buy Orders - Green) */}
              <div className="flex-1 flex flex-col space-y-1 overflow-hidden">
                {orderBook.bids.map((bid, i) => (
                  <div key={i} className="flex justify-between items-center relative py-0.5 px-1 hover:bg-emerald-500/10">
                    <div className="absolute right-0 top-0 bottom-0 bg-[#089981]/10 pointer-events-none" style={{ width: `${Math.min(100, bid.size * 35)}%` }} />
                    <span className="text-[#089981] font-semibold">{bid.price}</span>
                    <span className="text-gray-300 z-10">{bid.size}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: TRADE EXECUTION PANEL */}
          {activeTab === 'trade' && (
            <div className="flex-1 p-4 flex flex-col justify-between overflow-y-auto">
              <div>
                {/* Buy / Sell toggle */}
                <div className="flex rounded bg-[#131722] p-1 border border-[#2a2e39] mb-4">
                  <button
                    onClick={() => setOrderSide('buy')}
                    className={`flex-1 py-1.5 font-bold text-xs rounded transition-all ${
                      orderSide === 'buy' ? 'bg-[#089981] text-white shadow' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Купить
                  </button>
                  <button
                    onClick={() => setOrderSide('sell')}
                    className={`flex-1 py-1.5 font-bold text-xs rounded transition-all ${
                      orderSide === 'sell' ? 'bg-[#f23645] text-white shadow' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Продать
                  </button>
                </div>

                {/* Limit / Market Order type switcher */}
                <div className="flex gap-2 mb-4">
                  {['limit', 'market'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setOrderType(t)}
                      className={`flex-1 py-1 text-xs font-semibold rounded border uppercase tracking-wider transition-colors ${
                        orderType === t ? 'border-blue-500 text-blue-400 bg-blue-500/10' : 'border-[#2a2e39] text-gray-400'
                      }`}
                    >
                      {t === 'limit' ? 'Лимит' : 'Маркет'}
                    </button>
                  ))}
                </div>

                {/* Form fields */}
                <form onSubmit={handleCreateOrder} className="space-y-3">
                  {orderType === 'limit' && (
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Цена ордера (USDT)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={orderPrice}
                        onChange={(e) => setOrderPrice(e.target.value)}
                        className="w-full bg-[#131722] border border-[#2a2e39] focus:border-blue-500 rounded p-2 text-white font-mono text-sm focus:outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Количество ({selectedSymbol.symbol.replace('USDT', '')})</label>
                    <input
                      type="number"
                      step="0.001"
                      value={orderAmount}
                      onChange={(e) => setOrderAmount(e.target.value)}
                      className="w-full bg-[#131722] border border-[#2a2e39] focus:border-blue-500 rounded p-2 text-white font-mono text-sm focus:outline-none"
                    />
                  </div>

                  {/* Percentage pills */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {['25%', '50%', '75%', '100%'].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        className="py-1 bg-[#131722] border border-[#2a2e39] hover:border-gray-500 rounded text-[11px] text-gray-400 hover:text-white transition-colors"
                      >
                        {pct}
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-[#2a2e39] text-xs font-mono space-y-1">
                    <div className="flex justify-between text-gray-400">
                      <span>Всего (USDT):</span>
                      <span className="text-white font-bold">
                        ${(parseFloat(orderPrice || 0) * parseFloat(orderAmount || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className={`w-full py-3 rounded font-bold text-white text-sm tracking-wide shadow-lg transition-all mt-4 ${
                      orderSide === 'buy' ? 'bg-[#089981] hover:bg-[#07826d]' : 'bg-[#f23645] hover:bg-[#d62d3b]'
                    }`}
                  >
                    {orderSide === 'buy' ? 'Купить' : 'Продать'} {selectedSymbol.symbol}
                  </button>
                </form>
              </div>

              {/* Account summary */}
              <div className="bg-[#131722] p-3 rounded border border-[#2a2e39] text-xs font-mono">
                <div className="text-gray-400 mb-1">Доступный баланс</div>
                <div className="font-bold text-white text-sm">$24,580.40 USDT</div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
