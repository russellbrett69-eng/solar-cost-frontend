'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

type SeriesPoint = {
  day: string;            // ISO date
  samples: number;
  min_price: number;
  avg_price: number;
  max_price: number;
};

type Meta = {
  sku: string | null;
  supplier: string | null;
  currency: string | null;
  latest_price: number | null;
  latest_observed_at: string | null; // ISO string
  supplier_count: number;
};

type RangeKey = '30d' | '90d' | '6m' | '1y' | 'all';

function ymd(d: Date) {
  // YYYY-MM-DD
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
    .toISOString()
    .slice(0, 10);
}

function addDays(base: Date, n: number) {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}

export default function ProductDetail() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [series, setSeries] = useState<SeriesPoint[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);

  // ---- Date range state ----
  const [preset, setPreset] = useState<RangeKey>('90d');
  const [from, setFrom] = useState<string | ''>('');
  const [to, setTo] = useState<string | ''>('');

  // compute default from/to for preset (when custom inputs are empty)
  const computedRange = useMemo(() => {
    if (preset === 'all') return { from: undefined as string | undefined, to: undefined as string | undefined };

    const today = new Date();
    let start: Date;

    switch (preset) {
      case '30d':
        start = addDays(today, -30);
        break;
      case '90d':
        start = addDays(today, -90);
        break;
      case '6m':
        start = addDays(today, -182); // ~6 months
        break;
      case '1y':
        start = addDays(today, -365);
        break;
      default:
        start = addDays(today, -90);
    }
    return { from: ymd(start), to: ymd(today) };
  }, [preset]);

  // derived stats for the visible series
  const stats = useMemo(() => {
    if (!series.length) return null;
    const allMins = series.map(d => d.min_price);
    const allMaxs = series.map(d => d.max_price);
    const min = Math.min(...allMins);
    const max = Math.max(...allMaxs);
    const avg =
      series.reduce((acc, d) => acc + d.avg_price, 0) / series.length;
    return { min, max, avg };
  }, [series]);

  async function load() {
    if (!id) return;
    setLoading(true);
    setError(null);

    // Range to use in queries:
    const useFrom = from || computedRange.from; // allow custom
    const useTo = to || computedRange.to;

    try {
      // 1) Price history for this product with optional date filters
      let q = supabase
        .from('v_price_history')
        .select('day,samples,min_price,avg_price,max_price')
        .eq('product_id', id)
        .order('day', { ascending: true });

      if (useFrom) q = q.gte('day', useFrom); // day is date/timestamptz; date string OK
      if (useTo)   q = q.lte('day', useTo);

      const { data: hist, error: histErr } = await q;
      if (histErr) throw histErr;
      setSeries(hist ?? []);

      // 2) Basic metadata (latest offer overall, independent of range)
      const { data: latest, error: latestErr } = await supabase
        .from('supplier_offers')
        .select('source_sku,supplier,currency,price,observed_at')
        .eq('product_id', id)
        .order('observed_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (latestErr) throw latestErr;

      // 3) Distinct supplier count overall (can be range-filtered if preferred)
      const { data: suppliers, error: supErr } = await supabase
        .from('supplier_offers')
        .select('supplier')
        .eq('product_id', id)
        .neq('supplier', null)
        .limit(1000);
      if (supErr) throw supErr;

      const uniqueSuppliers = new Set(
        (suppliers ?? []).map((r) => r.supplier as string)
      );

      setMeta({
        sku: latest?.source_sku ?? null,
        supplier: latest?.supplier ?? null,
        currency: latest?.currency ?? null,
        latest_price: latest?.price ?? null,
        latest_observed_at: latest?.observed_at ?? null,
        supplier_count: uniqueSuppliers.size,
      });
    } catch (e: any) {
      setError(e.message || 'Failed to load product detail');
    } finally {
      setLoading(false);
    }
  }

  // reload when id or date range changes
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, preset, from, to]);

  function clearCustomDates() {
    setFrom('');
    setTo('');
  }

  return (
    <div className="min-h-screen p-6 sm:p-10 font-sans space-y-6">
      <Link href="/" className="text-blue-500 hover:underline">
        ← Back
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Product Price History</h1>
        <p className="text-sm text-gray-500">
          Product ID: <code className="font-mono">{id}</code>
        </p>
      </div>

      {/* Date range controls */}
      <div className="rounded border p-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex gap-2 flex-wrap">
          {(['30d', '90d', '6m', '1y', 'all'] as RangeKey[]).map((key) => (
            <button
              key={key}
              className={`px-3 py-1 rounded border ${
                preset === key ? 'bg-black text-white border-black' : 'hover:bg-gray-100'
              }`}
              onClick={() => {
                setPreset(key);
                // when switching presets, ignore custom dates
                clearCustomDates();
              }}
            >
              {key === '30d' && 'Last 30 days'}
              {key === '90d' && 'Last 90 days'}
              {key === '6m'  && 'Last 6 months'}
              {key === '1y'  && 'Last 1 year'}
              {key === 'all' && 'All time'}
            </button>
          ))}
        </div>

        <div className="flex gap-2 items-center">
          <div className="flex flex-col">
            <label className="text-xs text-gray-500" htmlFor="from">From</label>
            <input
              id="from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="border rounded px-2 py-1"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-500" htmlFor="to">To</label>
            <input
              id="to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="border rounded px-2 py-1"
            />
          </div>
          <button
            className="px-3 py-2 rounded border hover:bg-gray-100"
            onClick={clearCustomDates}
            title="Clear custom dates (use preset)"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Metadata card (latest info; overall) */}
      <div className="rounded border p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetaItem label="SKU" value={meta?.sku ?? '—'} mono />
        <MetaItem label="Latest Supplier" value={meta?.supplier ?? '—'} />
        <MetaItem label="Currency" value={meta?.currency ?? '—'} />
        <MetaItem
          label="Latest Price"
          value={
            meta?.latest_price != null
              ? meta.latest_price.toLocaleString()
              : '—'
          }
        />
        <MetaItem
          label="Last Seen"
          value={
            meta?.latest_observed_at
              ? new Date(meta.latest_observed_at).toISOString().slice(0, 10)
              : '—'
          }
        />
        <MetaItem
          label="# Suppliers"
          value={meta?.supplier_count != null ? String(meta.supplier_count) : '—'}
        />
        {stats && (
          <>
            <MetaItem
              label="Min (range)"
              value={stats.min.toLocaleString()}
            />
            <MetaItem
              label="Avg (range)"
              value={Math.round(stats.avg).toLocaleString()}
            />
            <MetaItem
              label="Max (range)"
              value={stats.max.toLocaleString()}
            />
          </>
        )}
      </div>

      {/* Chart / states */}
      {loading && <p>Loading…</p>}
      {error && <p className="text-red-600">Error: {error}</p>}
      {!loading && !error && series.length === 0 && (
        <p>No price history in this range.</p>
      )}

      {!loading && !error && series.length > 0 && (
        <div className="rounded border p-3">
          <div className="h-[380px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 12, right: 24, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => Number(v).toLocaleString()}
                />
                <Tooltip
                  formatter={(value: number) => Number(value).toLocaleString()}
                  labelFormatter={(label) =>
                    new Date(label).toISOString().slice(0, 10)
                  }
                />
                <Legend />
                <Line type="monotone" dataKey="min_price" dot={false} />
                <Line type="monotone" dataKey="avg_price" dot={false} />
                <Line type="monotone" dataKey="max_price" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Daily min/avg/max derived from <code>public.supplier_offers</code>.
          </p>
        </div>
      )}
    </div>
  );
}

function MetaItem({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-xs uppercase tracking-wide text-gray-500">
        {label}
      </span>
      <span className={mono ? 'font-mono' : ''}>{value}</span>
    </div>
  );
}
