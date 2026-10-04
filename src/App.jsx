import React, { useState, useEffect, useRef } from 'react';
import { createChart, ColorType, LineStyle, CrosshairMode } from 'lightweight-charts';
import {
  TrendingUp, TrendingDown, BarChart2, Search, Sliders, Layers, RefreshCw,
  Plus, Minus, Eye, EyeOff, Lock, Globe, Bell, Share2, Settings, Download,
  Maximize2, Play, Pause, ChevronDown, Check, Activity, DollarSign, Zap,
  Circle, HelpCircle, ArrowUpRight, ArrowDownRight, Compass, Shield, Filter,
  Volume2, Clock, Trash2, Edit3, Grid, FileText, Star, PieChart, Info, Crosshair,
  SlidersHorizontal, Bookmark, Cpu
} from 'lucide-react';

const SYMBOLS = [
  { symbol: 'BTC/USDT', name: 'Bitcoin / TetherUS', price: 92450.80, change: +3.42, volume: '$4.2B', high: 93800.00, low: 89120.50, category: 'Crypto' },
  { symbol: 'ETH/USDT', name: 'Ethereum / TetherUS', price: 3480.20, change: +4.15, volume: '$2.8B', high: 3550.00, low: 3310.00, category: 'Crypto' },
  { symbol: 'SOL/USDT', name: 'Solana / TetherUS', price: 215.40, change: -1.25, volume: '$1.4B', high: 224.00, low: 208.50, category: 'Crypto' },
  { symbol: 'XRP/USDT', name: 'XRP / TetherUS', price: 1.845, change: +12.30, volume: '$3.1B', high: 1.95, low: 1.62, category: 'Crypto' },
  { symbol: 'NVDA', name: 'NVIDIA Corp', price: 142.80, change: +5.60, volume: '$12.4B', high: 145.00, low: 138.20, category: 'Stocks' },
  { symbol: 'AAPL', name: 'Apple Inc', price: 232.50, change: +0.75, volume: '$8.1B', high: 235.00, low: 230.10, category: 'Stocks' },
  { symbol: 'TSLA', name: 'Tesla Inc', price: 268.40, change: -2.40, volume: '$9.5B', high: 275.00, low: 261.00, category: 'Stocks' },
  { symbol: 'EUR/USD', name: 'Euro / US Dollar', price: 1.0854, change: +0.12, volume: '$45B', high: 1.0890, low: 1.0820, category: 'Forex' },
];

const TIMEFRAMES = ['1m', '5m', '15m', '1H', '4H', '1D', '1W'];

const generateChartData = (basePrice = 90000, count = 280) => {
  const data = [];
  let currentPrice = basePrice;
  const now = new Date();
  const startTime = new Date(now.getTime() - count * 3600 * 1000);

  for (let i = 0; i < count; i++) {
    const time = Math.floor((startTime.getTime() + i * 3600 * 1000) / 1000);
    const volatility = currentPrice * 0.007;
    const change = (Math.random() - 0.47) * volatility;
    
    const open = currentPrice;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * volatility * 0.4;
    const low = Math.min(open, close) - Math.random() * volatility * 0.4;
    const volume = Math.floor(Math.random() * 600 + 150);

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
  const drawingCanvasRef = useRef(null);
  const chartRef = useRef(null);
  const candlestickSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);

  const [selectedSymbol, setSelectedSymbol] = useState(SYMBOLS[0]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1H');
  const [activeTab, setActiveTab] = useState('watchlist'); // watchlist, orderbook, trade, indicators
  const [drawingTool, setDrawingTool] = useState('cursor');
  const [drawings, setDrawings] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [currentPath, setCurrentPath] = useState([]);

  const [indicators, setIndicators] = useState({ rsi: true, ma20: true, ma50: false, bb: true });
  const [orderType, setOrderType] = useState('limit');
  const [orderSide, setOrderSide] = useState('buy');
  const [orderPrice, setOrderPrice] = useState('92450.80');
  const [orderAmount, setOrderAmount] = useState('0.05');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [favorites, setFavorites] = useState(['BTC/USDT', 'ETH/USDT', 'NVDA']);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState({ name: 'Trader (Demo)', role: 'user', balance: '48,250.00' });
  const [loginEmail, setLoginEmail] = useState('user@example.com');
  const [loginPassword, setLoginPassword] = useState('user123');

  // Sync canvas size on mount & resize
  useEffect(() => {
    const resizeCanvas = () => {
      if (drawingCanvasRef.current && chartContainerRef.current) {
        drawingCanvasRef.current.width = chartContainerRef.current.clientWidth;
        drawingCanvasRef.current.height = chartContainerRef.current.clientHeight;
        redrawCanvas();
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [drawings]);

  const redrawCanvas = () => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawings.forEach(d => {
      if (d.tool === 'trendline') {
        ctx.beginPath();
        ctx.strokeStyle = '#2962ff';
        ctx.lineWidth = 2;
        ctx.moveTo(d.x1, d.y1);
        ctx.lineTo(d.x2, d.y2);
        ctx.stroke();
      } else if (d.tool === 'fibonacci') {
        const minY = Math.min(d.y1, d.y2);
        const maxY = Math.max(d.y1, d.y2);
        const h = maxY - minY;
        const fibLevels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
        const colors = ['#f23645', '#ff9800', '#ffeb3b', '#4caf50', '#00bcd4', '#2962ff', '#9c27b0'];

        fibLevels.forEach((lvl, idx) => {
          const y = minY + h * lvl;
          ctx.beginPath();
          ctx.strokeStyle = colors[idx];
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = colors[idx];
          ctx.font = '11px JetBrains Mono';
          ctx.fillText(`Fib ${(lvl * 100).toFixed(1)}%`, 10, y - 4);
        });
      } else if (d.tool === 'brush' && d.points.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = '#00e676';
        ctx.lineWidth = 2.5;
        ctx.moveTo(d.points[0].x, d.points[0].y);
        d.points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.stroke();
      } else if (d.tool === 'text') {
        ctx.fillStyle = '#ffeb3b';
        ctx.font = '13px Inter, sans-serif';
        ctx.fillText(`📌 ${d.text}`, d.x, d.y);
      }
    });
  };

  const handleMouseDown = (e) => {
    if (drawingTool === 'cursor') return;
    const rect = drawingCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setStartPoint({ x, y });

    if (drawingTool === 'brush') {
      setCurrentPath([{ x, y }]);
    } else if (drawingTool === 'text') {
      const text = prompt('Введите заметку для графика:', 'Ключевой уровень поддержки');
      if (text) {
        const newDrawings = [...drawings, { tool: 'text', x, y, text }];
        setDrawings(newDrawings);
      }
      setIsDrawing(false);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || drawingTool === 'cursor') return;
    const rect = drawingCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (drawingTool === 'brush') {
      setCurrentPath(prev => [...prev, { x, y }]);
    } else if (drawingTool === 'trendline' || drawingTool === 'fibonacci') {
      redrawCanvas();
      const ctx = drawingCanvasRef.current.getContext('2d');
      if (drawingTool === 'trendline') {
        ctx.beginPath();
        ctx.strokeStyle = '#2962ff';
        ctx.lineWidth = 2;
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else if (drawingTool === 'fibonacci') {
        const minY = Math.min(startPoint.y, y);
        const maxY = Math.max(startPoint.y, y);
        const h = maxY - minY;
        [0, 0.382, 0.5, 0.618, 1].forEach(lvl => {
          const ly = minY + h * lvl;
          ctx.beginPath();
          ctx.strokeStyle = '#2962ff';
          ctx.setLineDash([3, 3]);
          ctx.moveTo(0, ly);
          ctx.lineTo(drawingCanvasRef.current.width, ly);
          ctx.stroke();
          ctx.setLineDash([]);
        });
      }
    }
  };

  const handleMouseUp = (e) => {
    if (!isDrawing || drawingTool === 'cursor') return;
    const rect = drawingCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let newDrawing = null;
    if (drawingTool === 'trendline') {
      newDrawing = { tool: 'trendline', x1: startPoint.x, y1: startPoint.y, x2: x, y2: y };
    } else if (drawingTool === 'fibonacci') {
      newDrawing = { tool: 'fibonacci', x1: startPoint.x, y1: startPoint.y, x2: x, y2: y };
    } else if (drawingTool === 'brush') {
      newDrawing = { tool: 'brush', points: currentPath };
    }

    if (newDrawing) {
      setDrawings([...drawings, newDrawing]);
    }
    setIsDrawing(false);
    setCurrentPath([]);
  };

  const handleLogin = (e, role) => {
    e?.preventDefault();
    if (role === 'admin') {
      setCurrentUser({ name: 'Admin Pro', role: 'admin', balance: '250,000.00' });
    } else {
      setCurrentUser({ name: 'Trader (User)', role: 'user', balance: '48,250.00' });
    }
    setIsAuthModalOpen(false);
  };

  const [bottomTab, setBottomTab] = useState('orders'); // orders, history, portfolio

  const tradeHistory = [
    { id: 101, symbol: 'BTC/USDT', side: 'BUY', price: '89,450.00', amount: '0.25 BTC', fee: '$2.23 USDT', status: 'Filled', time: '10:45:12' },
    { id: 102, symbol: 'ETH/USDT', side: 'SELL', price: '3,520.00', amount: '2.00 ETH', fee: '$1.40 USDT', status: 'Filled', time: '09:18:40' },
    { id: 103, symbol: 'SOL/USDT', side: 'BUY', price: '210.50', amount: '10.00 SOL', fee: '$0.42 USDT', status: 'Filled', time: '08:05:19' },
    { id: 104, symbol: 'NVDA', side: 'BUY', price: '138.50', amount: '15 NVDA', fee: '$1.04 USD', status: 'Filled', time: 'Вчера' },
  ];

  const portfolioAssets = [
    { asset: 'BTC', name: 'Bitcoin', total: '0.4500 BTC', available: '0.3500 BTC', value: '$41,602.86', pnl: '+14.2%' },
    { asset: 'ETH', name: 'Ethereum', total: '4.5000 ETH', available: '4.5000 ETH', value: '$15,660.90', pnl: '+8.6%' },
    { asset: 'SOL', name: 'Solana', total: '25.000 SOL', available: '20.000 SOL', value: '$5,385.00', pnl: '-2.1%' },
    { asset: 'USDT', name: 'Tether USD', total: '48,250.00 USDT', available: '48,250.00 USDT', value: '$48,250.00', pnl: '0.0%' },
  ];

  const [orderBook, setOrderBook] = useState({ asks: [], bids: [] });

  useEffect(() => {
    const p = selectedSymbol.price;
    const asks = Array.from({ length: 11 }).map((_, i) => ({
      price: (p * (1 + (i + 1) * 0.0005)).toFixed(selectedSymbol.price < 10 ? 4 : 2),
      size: (Math.random() * 2.5 + 0.1).toFixed(3),
      total: 0
    })).reverse();

    const bids = Array.from({ length: 11 }).map((_, i) => ({
      price: (p * (1 - (i + 1) * 0.0005)).toFixed(selectedSymbol.price < 10 ? 4 : 2),
      size: (Math.random() * 2.5 + 0.1).toFixed(3),
      total: 0
    }));

    setOrderBook({ asks, bids });
    setOrderPrice(p.toString());
  }, [selectedSymbol]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    let chart = null;

    try {
      const container = chartContainerRef.current;
      const width = container.clientWidth || 800;
      const height = container.clientHeight || 500;

      chart = createChart(container, {
        width: Math.max(300, width),
        height: Math.max(250, height),
        layout: {
          background: { type: ColorType.Solid, color: '#131722' },
          textColor: '#787b86',
          fontSize: 12,
          fontFamily: "'Inter', sans-serif",
        },
        grid: {
          vertLines: { color: '#1e222d' },
          horzLines: { color: '#1e222d' },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: { color: '#2962ff', width: 1, style: LineStyle.Solid, labelBackgroundColor: '#2962ff' },
          horzLine: { color: '#2962ff', width: 1, style: LineStyle.Solid, labelBackgroundColor: '#2962ff' },
        },
        rightPriceScale: {
          borderColor: '#2a2e39',
          textColor: '#787b86',
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
        color: close >= open ? 'rgba(8, 153, 129, 0.35)' : 'rgba(242, 54, 69, 0.35)'
      })));

      // Moving Average (SMA 20) Line Series
      let sma20Series = null;
      if (indicators.ma20) {
        sma20Series = chart.addLineSeries({
          color: '#2962ff',
          lineWidth: 2,
          title: 'SMA 20',
        });
        const smaData = [];
        for (let i = 20; i < data.length; i++) {
          const slice = data.slice(i - 20, i);
          const sum = slice.reduce((acc, curr) => acc + curr.close, 0);
          smaData.push({ time: data[i].time, value: parseFloat((sum / 20).toFixed(2)) });
        }
        sma20Series.setData(smaData);
      }

      // Realtime live tick simulation
      let lastCandle = { ...data[data.length - 1] };
      const interval = setInterval(() => {
        const delta = (Math.random() - 0.49) * (lastCandle.close * 0.001);
        lastCandle.close = parseFloat((lastCandle.close + delta).toFixed(2));
        if (lastCandle.close > lastCandle.high) lastCandle.high = lastCandle.close;
        if (lastCandle.close < lastCandle.low) lastCandle.low = lastCandle.close;

        candlestickSeries.update({
          time: lastCandle.time,
          open: lastCandle.open,
          high: lastCandle.high,
          low: lastCandle.low,
          close: lastCandle.close
        });
      }, 1000);

      chartRef.current = chart;

      return () => {
        clearInterval(interval);
      };
    } catch (err) {
      console.error('Chart initialization error:', err);
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
    const timeoutId = setTimeout(handleResize, 150);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
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
      status: 'Working',
      time: new Date().toLocaleTimeString()
    };
    setOrders([newOrd, ...orders]);
  };

  const toggleFavorite = (sym) => {
    setFavorites(prev => prev.includes(sym) ? prev.filter(f => f !== sym) : [...prev, sym]);
  };

  const filteredSymbols = SYMBOLS.filter(s => {
    const matchesSearch = s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || s.category === categoryFilter || (categoryFilter === 'Fav' && favorites.includes(s.symbol));
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col h-screen w-screen bg-[#131722] text-[#d1d4dc] overflow-hidden selection:bg-[#2962ff] selection:text-white">
      
      {/* PROFESSIONAL TRADINGVIEW TOP NAVBAR */}
      <header className="flex items-center justify-between h-12 px-3 border-b border-[#2a2e39] bg-[#1e222d] shrink-0 z-20">
        <div className="flex items-center gap-3">
          
          {/* Brand Logo & Switcher */}
          <div className="flex items-center gap-2 cursor-pointer font-bold text-white tracking-tight hover:opacity-90 transition-opacity">
            <div className="w-7 h-7 rounded bg-[#2962ff] flex items-center justify-center font-extrabold text-sm shadow-md text-white">
              TV
            </div>
            <span className="font-extrabold tracking-wider hidden sm:inline text-white">TRADINGVIEW</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2962ff]/20 text-[#2962ff] font-mono font-bold">PRO+</span>
          </div>

          <div className="h-5 w-px bg-[#2a2e39]" />

          {/* Symbol Selector Card Pill */}
          <div 
            onClick={() => setActiveTab('watchlist')}
            className="flex items-center gap-2 px-3 py-1 rounded bg-[#131722] border border-[#2a2e39] hover:border-[#2962ff] cursor-pointer transition-all shadow-inner"
          >
            <Search className="w-3.5 h-3.5 text-[#2962ff]" />
            <span className="font-extrabold text-white text-sm tracking-wide">{selectedSymbol.symbol}</span>
            <span className="text-xs text-gray-400 hidden md:inline">{selectedSymbol.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </div>

          <div className="h-5 w-px bg-[#2a2e39] hidden sm:block" />

          {/* Timeframe Selector Pill Bar */}
          <div className="hidden sm:flex items-center gap-0.5 bg-[#131722] p-0.5 rounded border border-[#2a2e39]">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                onClick={() => setSelectedTimeframe(tf)}
                className={`px-2 py-0.5 text-xs font-bold rounded transition-all ${
                  selectedTimeframe === tf ? 'text-white bg-[#2962ff] shadow' : 'text-gray-400 hover:text-white hover:bg-[#2a2e39]'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-[#2a2e39] hidden md:block" />

          {/* Indicators Modal Toggle */}
          <button 
            onClick={() => setActiveTab(activeTab === 'indicators' ? 'watchlist' : 'indicators')}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded border transition-all ${
              activeTab === 'indicators' ? 'border-[#2962ff] bg-[#2962ff]/20 text-[#2962ff]' : 'border-[#2a2e39] bg-[#131722] text-gray-300 hover:border-gray-500'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-[#2962ff]" />
            <span>Индикаторы & FX</span>
            <span className="bg-[#2962ff] text-white text-[10px] px-1.5 rounded-full font-bold">4</span>
          </button>
        </div>

        {/* Live Ticker Metrics & Action Controls */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-3 mr-2 font-mono text-xs">
            <div className="flex flex-col text-right">
              <span className="text-[10px] text-gray-500 uppercase font-semibold">Текущая цена</span>
              <span className={`font-bold text-sm ${selectedSymbol.change >= 0 ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                ${selectedSymbol.price.toLocaleString()}
              </span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[10px] text-gray-500 uppercase font-semibold">24ч Изм</span>
              <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                selectedSymbol.change >= 0 ? 'bg-[#089981]/20 text-[#089981]' : 'bg-[#f23645]/20 text-[#f23645]'
              }`}>
                {selectedSymbol.change >= 0 ? '+' : ''}{selectedSymbol.change}%
              </span>
            </div>
          </div>

          <button 
            onClick={() => setIsAuthModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2a2e39] hover:bg-[#363c4e] text-white text-xs font-bold rounded border border-gray-600 transition-all"
          >
            <Lock className="w-3.5 h-3.5 text-yellow-400" />
            <span>{currentUser ? currentUser.name : 'Вход / Аккаунт'}</span>
          </button>

          <button className="px-3.5 py-1.5 bg-[#2962ff] hover:bg-blue-600 text-white text-xs font-bold rounded shadow-md transition-all uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Опубликовать
          </button>
        </div>
      </header>

      {/* MAIN WORKSPACE BODY */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* LEFT DRAWING TOOLBAR */}
        <aside className="w-12 border-r border-[#2a2e39] bg-[#1e222d] flex flex-col items-center py-3 gap-2.5 shrink-0 z-20 shadow-lg">
          <button
            onClick={() => setDrawingTool('cursor')}
            className={`p-2 rounded transition-all ${drawingTool === 'cursor' ? 'bg-[#2962ff] text-white shadow' : 'text-gray-400 hover:bg-[#2a2e39] hover:text-white'}`}
            title="Перекрестие / Курсор"
          >
            <Crosshair className="w-4 h-4" />
          </button>

          <button
            onClick={() => setDrawingTool('trendline')}
            className={`p-2 rounded transition-all ${drawingTool === 'trendline' ? 'bg-[#2962ff] text-white shadow' : 'text-gray-400 hover:bg-[#2a2e39] hover:text-white'}`}
            title="Трендовая линия (Зажмите мышью)"
          >
            <TrendingUp className="w-4 h-4" />
          </button>

          <button
            onClick={() => setDrawingTool('fibonacci')}
            className={`p-2 rounded transition-all ${drawingTool === 'fibonacci' ? 'bg-[#2962ff] text-white shadow' : 'text-gray-400 hover:bg-[#2a2e39] hover:text-white'}`}
            title="Уровни Фибоначчи"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          <button
            onClick={() => setDrawingTool('brush')}
            className={`p-2 rounded transition-all ${drawingTool === 'brush' ? 'bg-[#2962ff] text-white shadow' : 'text-gray-400 hover:bg-[#2a2e39] hover:text-white'}`}
            title="Кисть / Граффити (Рисование)"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          <button
            onClick={() => setDrawingTool('text')}
            className={`p-2 rounded transition-all ${drawingTool === 'text' ? 'bg-[#2962ff] text-white shadow' : 'text-gray-400 hover:bg-[#2a2e39] hover:text-white'}`}
            title="Добавить заметку на график"
          >
            <FileText className="w-4 h-4" />
          </button>

          <div className="w-6 h-px bg-[#2a2e39] my-1" />

          <button
            onClick={() => {
              setDrawings([]);
              if (drawingCanvasRef.current) {
                const ctx = drawingCanvasRef.current.getContext('2d');
                ctx.clearRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);
              }
            }}
            className="p-2 rounded hover:bg-[#2a2e39] text-gray-400 hover:text-red-400 transition-colors"
            title="Очистить все рисунки"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </aside>

        {/* CENTER AREA: CHART + BOTTOM ORDERS PANEL */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#131722] relative">
          
          {/* CHART HUD OVERLAY BADGE */}
          <div className="absolute top-3 left-4 z-10 flex items-center gap-3 bg-[#1e222d]/90 backdrop-blur-md px-3.5 py-1.5 rounded-md border border-[#2a2e39] shadow-xl">
            <span className="font-extrabold text-white text-sm tracking-wide">{selectedSymbol.symbol}</span>
            <span className="text-[11px] font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">BINANCE</span>
            <div className="hidden lg:flex items-center gap-2.5 text-xs font-mono border-l border-[#2a2e39] pl-3">
              <span className="text-gray-400">Окр: <strong className="text-white">91,850.00</strong></span>
              <span className="text-gray-400">Макс: <strong className="text-white">93,200.00</strong></span>
              <span className="text-gray-400">Мин: <strong className="text-white">90,450.00</strong></span>
              <span className="text-gray-400">Закр: <strong className="text-[#089981]">92,450.80</strong></span>
            </div>
          </div>

          {/* LIGHTWEIGHT CHART CONTAINER WITH INTERACTIVE DRAWING CANVAS OVERLAY */}
          <div className="flex-1 w-full h-full min-h-[300px] relative overflow-hidden bg-[#131722]">
            <div ref={chartContainerRef} className="absolute inset-0 w-full h-full" />
            
            <canvas
              ref={drawingCanvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className={`absolute inset-0 w-full h-full z-10 ${
                drawingTool !== 'cursor' ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'
              }`}
            />
          </div>

          {/* BOTTOM TERMINAL PANEL */}
          <div className="h-44 border-t border-[#2a2e39] bg-[#1e222d] flex flex-col shrink-0">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#2a2e39] bg-[#181c27]">
              <div className="flex items-center gap-4 text-xs font-bold">
                <button 
                  onClick={() => setBottomTab('orders')}
                  className={`pb-1 uppercase tracking-wider transition-all ${
                    bottomTab === 'orders' ? 'text-[#2962ff] border-b-2 border-[#2962ff]' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Открытые Позиции ({orders.length})
                </button>
                <button 
                  onClick={() => setBottomTab('history')}
                  className={`pb-1 uppercase tracking-wider transition-all ${
                    bottomTab === 'history' ? 'text-[#2962ff] border-b-2 border-[#2962ff]' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  История Сделок ({tradeHistory.length})
                </button>
                <button 
                  onClick={() => setBottomTab('portfolio')}
                  className={`pb-1 uppercase tracking-wider transition-all ${
                    bottomTab === 'portfolio' ? 'text-[#2962ff] border-b-2 border-[#2962ff]' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Активы & Портфель ({portfolioAssets.length})
                </button>
              </div>
              <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                <Circle className="w-2 h-2 fill-emerald-400 animate-pulse" /> WebSocket: Подключено
              </span>
            </div>

            {/* TAB CONTENT: OPEN ORDERS */}
            {bottomTab === 'orders' && (
              <div className="flex-1 overflow-y-auto p-2">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="text-gray-500 border-b border-[#2a2e39] pb-1 uppercase text-[10px]">
                      <th className="pb-2 font-bold">Время</th>
                      <th className="pb-2 font-bold">Инструмент</th>
                      <th className="pb-2 font-bold">Тип Сделки</th>
                      <th className="pb-2 font-bold">Цена Исполнения</th>
                      <th className="pb-2 font-bold">Объем</th>
                      <th className="pb-2 font-bold">Статус</th>
                      <th className="pb-2 font-bold text-right">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2e39]/60">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-6 text-center text-gray-500 text-xs">Нет активных позиций</td>
                      </tr>
                    ) : orders.map(ord => (
                      <tr key={ord.id} className="hover:bg-[#2a2e39]/50 transition-colors">
                        <td className="py-2 text-gray-400">{ord.time}</td>
                        <td className="py-2 font-bold text-white">{ord.symbol}</td>
                        <td className={`py-2 font-extrabold ${ord.type.includes('BUY') ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                          {ord.type}
                        </td>
                        <td className="py-2 text-gray-200">${ord.price}</td>
                        <td className="py-2 text-gray-200">{ord.amount}</td>
                        <td className="py-2">
                          <span className="px-2 py-0.5 rounded bg-blue-500/20 text-[#2962ff] text-[10px] font-bold">
                            {ord.status}
                          </span>
                        </td>
                        <td className="py-2 text-right">
                          <button
                            onClick={() => setOrders(orders.filter(o => o.id !== ord.id))}
                            className="px-2 py-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded text-[11px] transition-colors border border-red-500/20"
                          >
                            Отмена
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB CONTENT: TRADE HISTORY */}
            {bottomTab === 'history' && (
              <div className="flex-1 overflow-y-auto p-2">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="text-gray-500 border-b border-[#2a2e39] pb-1 uppercase text-[10px]">
                      <th className="pb-2 font-bold">Время</th>
                      <th className="pb-2 font-bold">Инструмент</th>
                      <th className="pb-2 font-bold">Направление</th>
                      <th className="pb-2 font-bold">Цена Сделки</th>
                      <th className="pb-2 font-bold">Объем</th>
                      <th className="pb-2 font-bold">Комиссия</th>
                      <th className="pb-2 font-bold text-right">Статус</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2e39]/60">
                    {tradeHistory.map(item => (
                      <tr key={item.id} className="hover:bg-[#2a2e39]/50 transition-colors">
                        <td className="py-2 text-gray-400">{item.time}</td>
                        <td className="py-2 font-bold text-white">{item.symbol}</td>
                        <td className={`py-2 font-extrabold ${item.side === 'BUY' ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                          {item.side}
                        </td>
                        <td className="py-2 text-gray-200">{item.price}</td>
                        <td className="py-2 text-gray-200">{item.amount}</td>
                        <td className="py-2 text-gray-400">{item.fee}</td>
                        <td className="py-2 text-right">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB CONTENT: PORTFOLIO ASSETS */}
            {bottomTab === 'portfolio' && (
              <div className="flex-1 overflow-y-auto p-2">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="text-gray-500 border-b border-[#2a2e39] pb-1 uppercase text-[10px]">
                      <th className="pb-2 font-bold">Актив</th>
                      <th className="pb-2 font-bold">Название</th>
                      <th className="pb-2 font-bold">Всего Баланс</th>
                      <th className="pb-2 font-bold">Доступно</th>
                      <th className="pb-2 font-bold">Стоимость ($)</th>
                      <th className="pb-2 font-bold text-right">PnL (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2e39]/60">
                    {portfolioAssets.map(asset => (
                      <tr key={asset.asset} className="hover:bg-[#2a2e39]/50 transition-colors">
                        <td className="py-2 font-extrabold text-[#2962ff]">{asset.asset}</td>
                        <td className="py-2 text-white font-bold">{asset.name}</td>
                        <td className="py-2 text-gray-200">{asset.total}</td>
                        <td className="py-2 text-gray-200">{asset.available}</td>
                        <td className="py-2 font-bold text-white">{asset.value}</td>
                        <td className={`py-2 text-right font-extrabold ${asset.pnl.startsWith('+') ? 'text-[#089981]' : asset.pnl.startsWith('-') ? 'text-[#f23645]' : 'text-gray-400'}`}>
                          {asset.pnl}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDEBAR PANEL */}
        <div className="w-80 border-l border-[#2a2e39] bg-[#1e222d] flex flex-col shrink-0 shadow-2xl">
          
          {/* TAB HEADERS */}
          <div className="flex items-center border-b border-[#2a2e39] bg-[#181c27]">
            <button
              onClick={() => setActiveTab('watchlist')}
              className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition-all uppercase tracking-wider ${
                activeTab === 'watchlist' ? 'border-[#2962ff] text-[#2962ff] bg-[#1e222d]' : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              Котировки
            </button>
            <button
              onClick={() => setActiveTab('orderbook')}
              className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition-all uppercase tracking-wider ${
                activeTab === 'orderbook' ? 'border-[#2962ff] text-[#2962ff] bg-[#1e222d]' : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              Стакан
            </button>
            <button
              onClick={() => setActiveTab('trade')}
              className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition-all uppercase tracking-wider ${
                activeTab === 'trade' ? 'border-[#2962ff] text-[#2962ff] bg-[#1e222d]' : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              Торговля
            </button>
          </div>

          {/* TAB 1: WATCHLIST & INSTRUMENTS */}
          {activeTab === 'watchlist' && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-2.5 border-b border-[#2a2e39] space-y-2">
                <div className="flex items-center px-2.5 py-1.5 bg-[#131722] border border-[#2a2e39] focus-within:border-[#2962ff] rounded text-xs transition-colors">
                  <Search className="w-3.5 h-3.5 text-gray-400 mr-2" />
                  <input
                    type="text"
                    placeholder="Поиск инструмента (BTC, NVDA...)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent text-white focus:outline-none w-full font-mono text-xs"
                  />
                </div>

                {/* Category Pills */}
                <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
                  {['All', 'Fav', 'Crypto', 'Stocks', 'Forex'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full border transition-all ${
                        categoryFilter === cat ? 'bg-[#2962ff] border-[#2962ff] text-white shadow' : 'bg-[#131722] border-[#2a2e39] text-gray-400 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Symbol List */}
              <div className="flex-1 overflow-y-auto divide-y divide-[#2a2e39]/50">
                {filteredSymbols.map((item) => (
                  <div
                    key={item.symbol}
                    onClick={() => setSelectedSymbol(item)}
                    className={`flex items-center justify-between p-3 hover:bg-[#2a2e39]/60 cursor-pointer transition-all ${
                      selectedSymbol.symbol === item.symbol ? 'bg-[#2a2e39] border-l-4 border-[#2962ff]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(item.symbol); }}
                        className="text-gray-500 hover:text-yellow-400 transition-colors"
                      >
                        <Star className={`w-3.5 h-3.5 ${favorites.includes(item.symbol) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                      </button>
                      <div>
                        <div className="font-extrabold text-white text-xs">{item.symbol}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{item.name}</div>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-xs font-bold text-white">${item.price.toLocaleString()}</div>
                      <div className={`text-[11px] font-bold ${item.change >= 0 ? 'text-[#089981]' : 'text-[#f23645]'}`}>
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
              <div className="text-gray-400 mb-2 font-bold uppercase text-[10px] flex justify-between px-1">
                <span>Цена ({selectedSymbol.symbol.split('/')[1] || 'USD'})</span>
                <span>Размер</span>
              </div>

              {/* ASKS (Sell Orders) */}
              <div className="flex-1 flex flex-col justify-end space-y-1 overflow-hidden">
                {orderBook.asks.map((ask, i) => (
                  <div key={i} className="flex justify-between items-center relative py-0.5 px-1 hover:bg-red-500/10 rounded">
                    <div className="absolute right-0 top-0 bottom-0 bg-red-500/10 pointer-events-none rounded" style={{ width: `${Math.min(100, ask.size * 35)}%` }} />
                    <span className="text-[#f23645] font-semibold">{ask.price}</span>
                    <span className="text-gray-300 z-10">{ask.size}</span>
                  </div>
                ))}
              </div>

              {/* MID PRICE DISPLAY */}
              <div className="py-2.5 my-2 border-y border-[#2a2e39] text-center bg-[#131722] rounded shadow-inner">
                <span className="text-base font-extrabold text-[#089981] mr-2">${selectedSymbol.price.toLocaleString()}</span>
                <span className="text-xs text-gray-400">↑ {selectedSymbol.high.toLocaleString()}</span>
              </div>

              {/* BIDS (Buy Orders) */}
              <div className="flex-1 flex flex-col space-y-1 overflow-hidden">
                {orderBook.bids.map((bid, i) => (
                  <div key={i} className="flex justify-between items-center relative py-0.5 px-1 hover:bg-emerald-500/10 rounded">
                    <div className="absolute right-0 top-0 bottom-0 bg-[#089981]/10 pointer-events-none rounded" style={{ width: `${Math.min(100, bid.size * 35)}%` }} />
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
                <div className="flex rounded-md bg-[#131722] p-1 border border-[#2a2e39] mb-4 shadow-inner">
                  <button
                    onClick={() => setOrderSide('buy')}
                    className={`flex-1 py-2 font-extrabold text-xs rounded transition-all uppercase tracking-wider ${
                      orderSide === 'buy' ? 'bg-[#089981] text-white shadow-lg' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Купить
                  </button>
                  <button
                    onClick={() => setOrderSide('sell')}
                    className={`flex-1 py-2 font-extrabold text-xs rounded transition-all uppercase tracking-wider ${
                      orderSide === 'sell' ? 'bg-[#f23645] text-white shadow-lg' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Продать
                  </button>
                </div>

                {/* Limit / Market Order switcher */}
                <div className="flex gap-2 mb-4">
                  {['limit', 'market'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setOrderType(t)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded border uppercase tracking-wider transition-all ${
                        orderType === t ? 'border-[#2962ff] text-[#2962ff] bg-[#2962ff]/10' : 'border-[#2a2e39] text-gray-400 hover:border-gray-500'
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
                      <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Цена ордера</label>
                      <input
                        type="number"
                        step="0.01"
                        value={orderPrice}
                        onChange={(e) => setOrderPrice(e.target.value)}
                        className="w-full bg-[#131722] border border-[#2a2e39] focus:border-[#2962ff] rounded p-2.5 text-white font-mono text-sm focus:outline-none transition-colors"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Количество ({selectedSymbol.symbol.split('/')[0]})</label>
                    <input
                      type="number"
                      step="0.001"
                      value={orderAmount}
                      onChange={(e) => setOrderAmount(e.target.value)}
                      className="w-full bg-[#131722] border border-[#2a2e39] focus:border-[#2962ff] rounded p-2.5 text-white font-mono text-sm focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {['25%', '50%', '75%', '100%'].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        className="py-1 bg-[#131722] border border-[#2a2e39] hover:border-gray-500 rounded text-[11px] text-gray-400 hover:text-white transition-colors font-mono font-semibold"
                      >
                        {pct}
                      </button>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-[#2a2e39] text-xs font-mono space-y-1">
                    <div className="flex justify-between text-gray-400">
                      <span>Итого Объем:</span>
                      <span className="text-white font-bold">
                        ${(parseFloat(orderPrice || 0) * parseFloat(orderAmount || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className={`w-full py-3.5 rounded-md font-extrabold text-white text-sm tracking-widest uppercase shadow-lg transition-all mt-4 ${
                      orderSide === 'buy' ? 'bg-[#089981] hover:bg-[#07826d] shadow-emerald-900/40' : 'bg-[#f23645] hover:bg-[#d62d3b] shadow-red-900/40'
                    }`}
                  >
                    {orderSide === 'buy' ? 'Купить' : 'Продать'} {selectedSymbol.symbol.split('/')[0]}
                  </button>
                </form>
              </div>

              <div className="bg-[#131722] p-3 rounded-md border border-[#2a2e39] text-xs font-mono shadow-inner">
                <div className="text-gray-400 mb-1 uppercase font-semibold text-[10px]">Доступный Баланс</div>
                <div className="font-extrabold text-white text-sm">$48,250.00 USDT</div>
              </div>
            </div>
          )}

          {/* TAB 4: INDICATORS SELECTION */}
          {activeTab === 'indicators' && (
            <div className="flex-1 p-4 flex flex-col min-h-0 space-y-3">
              <h3 className="font-extrabold text-white text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#2962ff]" /> Индикаторы Графика
              </h3>
              
              {[
                { id: 'rsi', name: 'RSI (Relative Strength Index)', desc: 'Индикатор относительной силы' },
                { id: 'ma20', name: 'MA 20 (Moving Average)', desc: 'Скользящая средняя за 20 свечей' },
                { id: 'ma50', name: 'MA 50 (Moving Average)', desc: 'Скользящая средняя за 50 свечей' },
                { id: 'bb', name: 'Bollinger Bands (20, 2)', desc: 'Полосы Боллинджера' }
              ].map(ind => (
                <div 
                  key={ind.id}
                  onClick={() => setIndicators(prev => ({ ...prev, [ind.id]: !prev[ind.id] }))}
                  className={`p-3 rounded border cursor-pointer transition-all ${
                    indicators[ind.id] ? 'bg-[#2962ff]/10 border-[#2962ff] text-white' : 'bg-[#131722] border-[#2a2e39] text-gray-400 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs">{ind.name}</span>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${indicators[ind.id] ? 'bg-[#2962ff] border-[#2962ff]' : 'border-gray-500'}`}>
                      {indicators[ind.id] && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500">{ind.desc}</p>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* LOGIN & DEMO CREDENTIALS MODAL */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1e222d] border border-[#2a2e39] max-w-md w-full p-6 rounded-lg shadow-2xl relative text-white">
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-lg font-bold"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded bg-[#2962ff] flex items-center justify-center font-bold">
                <Lock className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-extrabold uppercase tracking-wide">Авторизация TradingView</h2>
            </div>

            <p className="text-xs text-gray-400 mb-6">
              Выберите необходимую роль для входа в торговую панель или используйте быстрый вход:
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={(e) => handleLogin(e, 'admin')}
                className="p-3 bg-[#2962ff] hover:bg-blue-600 rounded text-left font-mono transition-all border border-blue-400/30"
              >
                <div className="font-extrabold text-xs text-white uppercase flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" /> Войти как Admin
                </div>
                <div className="text-[10px] text-blue-200 mt-1">Полный доступ + $250k</div>
              </button>

              <button
                type="button"
                onClick={(e) => handleLogin(e, 'user')}
                className="p-3 bg-[#131722] hover:bg-[#2a2e39] rounded text-left font-mono transition-all border border-[#2a2e39]"
              >
                <div className="font-extrabold text-xs text-white uppercase flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-emerald-400" /> Войти как User
                </div>
                <div className="text-[10px] text-gray-400 mt-1">Трейдер + $48.2k</div>
              </button>
            </div>

            <div className="bg-[#131722] p-4 rounded border border-[#2a2e39] font-mono text-xs space-y-2">
              <div className="font-bold text-yellow-400 uppercase text-[11px] mb-1">Демо аккаунты для входа:</div>
              <div className="flex justify-between items-center bg-[#1e222d] p-2 rounded border border-[#2a2e39]">
                <div>
                  <span className="text-gray-400">Admin Email:</span> <strong className="text-white">admin@tradingview.com</strong>
                </div>
                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">admin123</span>
              </div>
              <div className="flex justify-between items-center bg-[#1e222d] p-2 rounded border border-[#2a2e39]">
                <div>
                  <span className="text-gray-400">User Email:</span> <strong className="text-white">user@tradingview.com</strong>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">user123</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
