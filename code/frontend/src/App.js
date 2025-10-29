import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Select from 'react-select';
import { usePDF } from 'react-to-pdf';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Label
} from 'recharts';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './App.css';  // Add styles here

const API_BASE = 'http://localhost:8000/api';

// Slightly more vibrant soft palette
const COLORS = ['#F9A8D4', '#FDBA74', '#93C5FD', '#86EFAC', '#FDE68A', '#A5B4FC', '#FCA5A5', '#67E8F9'];

// Ensure pie/donut data is numeric and clean, aggregate tiny slices into "Others"
function sanitizePieData(data, maxSlices = 8) {
  const cleaned = (data || [])
    .map(d => ({ name: String(d.name ?? ''), value: Number(d.value ?? 0) }))
    .filter(d => d.name && Number.isFinite(d.value) && d.value > 0);
  if (cleaned.length <= maxSlices) return cleaned;
  const sorted = [...cleaned].sort((a, b) => b.value - a.value);
  const head = sorted.slice(0, maxSlices - 1);
  const tailSum = sorted.slice(maxSlices - 1).reduce((acc, d) => acc + d.value, 0);
  return [...head, { name: 'Others', value: tailSum }];
}

function formatPercent(value, total) {
  if (!total) return '0%';
  const pct = (value / total) * 100;
  return `${pct.toFixed(1)}%`;
}

function formatToMillions(value) {
  if (typeof value !== 'number') return value;
  return `${(value / 1000000).toFixed(1)}M`;
}

function SortableChart({ id, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="chart"
    >
      {children}
    </div>
  );
}

function App() {
  const { toPDF, targetRef } = usePDF({ filename: 'eda_dashboard.pdf' });
  
  const [filters, setFilters] = useState({
    brands: [], pack_types: [], ppgs: [], channels: [], years: [], months: []
  });
  const [selected, setSelected] = useState({
    brands: [], pack_types: [], ppgs: [], channels: [], years: [], months: []
  });
  const [chartData, setChartData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartOrder, setChartOrder] = useState([
    'sales_horizontal',
    'volume_horizontal',
    'sales_vertical',
    'monthly_line',
    'brand_volume_pie'
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setLoading(true);
    setError(null);
    axios.get(`${API_BASE}/filters/`)
      .then(res => {
        setFilters({
          brands: res.data.brands.map(b => ({ value: b, label: b })),
          pack_types: res.data.pack_types.map(p => ({ value: p, label: p })),
          ppgs: res.data.ppgs.map(p => ({ value: p, label: p })),
          channels: res.data.channels.map(c => ({ value: c, label: c })),
          years: res.data.years.map(y => ({ value: y, label: y })),
          months: res.data.months.map(m => ({ 
            value: m, 
            label: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m - 1] 
          })),
        });
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
        console.error('Error loading filters:', err);
      });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    const paramMap = {
      'brands': 'brand',
      'pack_types': 'pack_type',
      'ppgs': 'ppg',
      'channels': 'channel',
      'years': 'year',
      'months': 'month'
    };
    Object.keys(selected).forEach(key => {
      const paramName = paramMap[key] || key;
      selected[key].forEach(item => params.append(paramName, item.value));
    });
    axios.get(`${API_BASE}/chart-data/?${params.toString()}`)
      .then(res => {
        setChartData(res.data);
      })
      .catch(err => {
        console.error('Error loading chart data:', err);
      });
  }, [selected]);

  const handleSelectChange = (key, value) => {
    setSelected({ ...selected, [key]: value || [] });
  };

  const handleResetFilters = () => {
    setSelected({ brands: [], pack_types: [], ppgs: [], channels: [], years: [], months: [] });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setChartOrder((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const renderChart = (key) => {
    switch (key) {
      case 'sales_horizontal':
        return (
          <>
            <h3>Sales Value by Year (Horizontal Bar)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.sales_by_year_stacked || chartData.sales_by_year || []} layout="vertical" barSize={14}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={formatToMillions} />
                <YAxis dataKey="Year" type="category" />
                <Tooltip formatter={(v) => formatToMillions(v)} />
                <Legend />
                {Array.isArray(chartData.brands_order) && chartData.sales_by_year_stacked
                  ? chartData.brands_order.slice(0, 8).map((brand, idx) => (
                      <Bar key={brand} dataKey={brand} stackId="sales" fill={COLORS[idx % COLORS.length]} />
                    ))
                  : <Bar dataKey="Sales Value" fill="#F9A8D4" />}
              </BarChart>
            </ResponsiveContainer>
          </>
        );
      case 'volume_horizontal':
        return (
          <>
            <h3>Volume (kg) by Year (Horizontal Bar)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.volume_by_year_stacked || chartData.volume_by_year || []} layout="vertical" barSize={14}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={formatToMillions} />
                <YAxis dataKey="Year" type="category" />
                <Tooltip formatter={(v) => formatToMillions(v)} />
                <Legend />
                {Array.isArray(chartData.brands_order) && chartData.volume_by_year_stacked
                  ? chartData.brands_order.slice(0, 8).map((brand, idx) => (
                      <Bar key={brand} dataKey={brand} stackId="volume" fill={COLORS[idx % COLORS.length]} />
                    ))
                  : <Bar dataKey="Volume (kg)" fill="#93C5FD" />}
              </BarChart>
            </ResponsiveContainer>
          </>
        );
      case 'sales_vertical':
        return (
          <>
            <h3>Year-wise Sales Value (Vertical Bar)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.year_wise_sales || []} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="Year" />
                <YAxis tickFormatter={formatToMillions} />
                <Tooltip formatter={(v) => formatToMillions(v)} />
                <Legend />
                <Bar dataKey="Sales Value" fill="#FDBA74" />
              </BarChart>
            </ResponsiveContainer>
          </>
        );
      case 'monthly_line':
        return (
          <>
            <h3>Monthly Sales Trend (Line)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.monthly_sales || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="YearMonth" />
                <YAxis tickFormatter={formatToMillions} />
                <Tooltip formatter={(v) => formatToMillions(v)} />
                <Legend />
                <Line type="monotone" dataKey="Sales Value" stroke="#22C55E" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </>
        );
      // removed market_sales_pie
      case 'brand_volume_pie': {
        const raw = (chartData.brand_volume_totals || []).map(r => ({ name: r['Brand'], value: r['Volume (kg)'] }));
        const pieData = sanitizePieData(raw);
        const total = pieData.reduce((acc, d) => acc + d.value, 0);
        return (
          <>
            <h3>Brand Share by Volume (Pie)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                {pieData.length === 0 ? (
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="#888">
                    No data
                  </text>
                ) : (
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={(entry) => `${entry.name}: ${formatPercent(entry.value, total)}`}
                  >
                    {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                    <Label position="center">{formatToMillions(total)}</Label>
                </Pie>
                )}
                <Tooltip formatter={(v) => [v, 'Volume (kg)']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </>
        );
      }
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="app">
        <h1>EDA Dashboard</h1>
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <h1>EDA Dashboard</h1>
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <p style={{ color: 'red' }}>Error loading data: {error}</p>
          <p>Make sure the backend server is running on http://localhost:8000</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <h1 className="page-title">EDA Dashboard</h1>

      <div className="dashboard-layout">
        <aside className="sidebar">
          <h2>Filters</h2>
          <section className="filters">
        <div className="filter">
          <label>Channel</label>
          <Select isMulti options={filters.channels} value={selected.channels} onChange={v => handleSelectChange('channels', v)} placeholder="All" />
        </div>
        <div className="filter">
          <label>Brand</label>
          <Select isMulti options={filters.brands} value={selected.brands} onChange={v => handleSelectChange('brands', v)} placeholder="All" />
        </div>
        <div className="filter">
          <label>Pack Type</label>
          <Select isMulti options={filters.pack_types} value={selected.pack_types} onChange={v => handleSelectChange('pack_types', v)} placeholder="All" />
        </div>
        <div className="filter">
          <label>PPG</label>
          <Select isMulti options={filters.ppgs} value={selected.ppgs} onChange={v => handleSelectChange('ppgs', v)} placeholder="All" />
        </div>
        <div className="filter">
          <label>Year</label>
          <Select isMulti options={filters.years} value={selected.years} onChange={v => handleSelectChange('years', v)} placeholder="All" />
        </div>
        <div className="filter">
          <label>Month</label>
          <Select isMulti options={filters.months} value={selected.months} onChange={v => handleSelectChange('months', v)} placeholder="All" />
        </div>
        <div className="filter actions">
          <button className="reset" onClick={handleResetFilters}>
            Reset
          </button>
        </div>
        <div className="filter actions">
          <button className="export-btn" onClick={() => toPDF()} style={{background: '#22C55E', color: '#fff'}}>
            Export PDF
          </button>
        </div>
          </section>
        </aside>

        <main className="main-content" ref={targetRef}>
          <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={chartOrder} strategy={verticalListSortingStrategy}>
          <div className="charts">
            {chartOrder.map((key) => (
              <SortableChart key={key} id={key}>
                {renderChart(key)}
              </SortableChart>
            ))}
          </div>
        </SortableContext>
      </DndContext>
        </main>
      </div>
    </div>
  );
}

export default App;