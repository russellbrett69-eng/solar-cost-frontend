'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Offer = {
  id: string;
  supplier: string | null;
  source_sku: string | null;
  price: number | null;
  currency: string | null;
  observed_at: string | null; // ISO
  product_id: string | null;
};

const PAGE_SIZES = [25, 50, 100] as const;
type SortKey = 'observed_at' | 'supplier' | 'source_sku' | 'price' | 'currency' | 'product_id';

export default function Home() {
  const [rows, setRows] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // filters
  const [supplierFilter, setSupplierFilter] = useState('');
  const [skuFilter, setSkuFilter] = useState('');

  // paging
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<typeof PAGE_SIZES[number]>(25);
  const from = page * pageSize;
  const to = from + pageSize - 1;

  // sorting
  const [sortKey, setSortKey] = useState<SortKey>('observed_at');
  const [sortAsc, setSortAsc] = useState(false); // newest first by default

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortAsc((v) => !v);
    } else {
      setSortKey(key);
      setSortAsc(true); // start asc on a new column
    }
    setPage(0);
  }

  async function load() {
    setLoading(true);
    setError(null);

    // Build the base query
    let q = supabase
      .from('supplier_offers')
      .select('id,supplier,source_sku,price,currency,observed_at,product_id', { count: 'exact' })
      .order(sortKey, { ascending: sortAsc })
      .range(from, to);

    // Apply filters (both optional)
    const ors: string[] = [];
    if (supplierFilter.trim()) {
      ors.push(`supplier.ilike.%${supplierFilter}%`);
    }
    if (skuFilter.trim()) {
      ors.push(`source_sku.ilike.%${skuFilter}%`);
    }
    if (ors.length) q = q.or(ors.join(','));

    const { data, error } = await q;

    if (error) {
      setError(error.message);
      setRows([]);
    } else {
      setRows(data ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, sortKey, sortAsc]); // reload on paging/sorting changes

  // disable Prev when on first page; disable Next if fewer rows than pageSize
  const canPrev = page > 0;
  const canNext = rows.length === pageSize; // optimistic: if page is full, assume there may be more

  // simple header cell with sort indicator
  function Th({
    k,
    label,
    align = 'left',
  }: { k: SortKey; label: string; align?: 'left' | 'right' }) {
    const active = sortKey === k;
    const arrow = active ? (sortAsc ? '▲' : '▼') : '';
    return (
      <th
        className={`p-2 border-b cursor-pointer select-none ${align === 'right' ? 'text-right' : 'text-left'}`}
        onClick={() => toggleSort(k)}
        title={`Sort by ${label}`}
      >
        <span className="inline-flex items-center gap-1">{label} {arrow && <span>{arrow}</span>}</span>
      </th>
    );
  }

  return (
    <div className="min-h-screen p-6 sm:p-10 font-sans">
      <h1 className="text-2xl font-bold mb-5">Supplier Offers</h1>

      {/* Filters + actions */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <input
          value={supplierFilter}
          onChange={(e) => { setSupplierFilter(e.target.value); setPage(0); }}
          placeholder="Filter supplier…"
          className="border rounded px-3 py-2 w-64"
        />
        <input
          value={skuFilter}
          onChange={(e) => { setSkuFilter(e.target.value); setPage(0); }}
          placeholder="Filter SKU…"
          className="border rounded px-3 py-2 w-64"
        />
        <button
          onClick={() => { setPage(0); load(); }}
          className="rounded bg-black text-white px-4 py-2 hover:opacity-90"
        >
          Apply
        </button>

        <div className="ml-auto flex items-center gap-2">
          <label className="text-sm">Page size</label>
          <select
            className="border rounded px-2 py-2"
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value) as typeof pageSize); setPage(0); }}
          >
            {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Table / states */}
      {loading && <p>Loading…</p>}
      {error && <p className="text-red-600">Error: {error}</p>}
      {!loading && !error && rows.length === 0 && <p>No rows found.</p>}

      {!loading && !error && rows.length > 0 && (
        <div className="overflow-auto rounded border">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <Th k="observed_at" label="Observed" />
                <Th k="supplier" label="Supplier" />
                <Th k="source_sku" label="SKU" />
                <Th k="price" label="Price" align="right" />
                <Th k="currency" label="Currency" />
                <Th k="product_id" label="Product" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="odd:bg-white even:bg-gray-50">
                  <td className="p-2 border-b">
                    {r.observed_at ? new Date(r.observed_at).toISOString().slice(0, 10) : ''}
                  </td>
                  <td className="p-2 border-b">{r.supplier ?? ''}</td>
                  <td className="p-2 border-b font-mono">{r.source_sku ?? ''}</td>
                  <td className="p-2 border-b text-right">
                    {r.price !== null ? r.price.toLocaleString() : ''}
                  </td>
                  <td className="p-2 border-b">{r.currency ?? ''}</td>
                  <td className="p-2 border-b font-mono text-xs">
                    {r.product_id ? (
                      <a
                        className="underline text-blue-700 hover:opacity-80"
                        href={`/product/${r.product_id}`}
                      >
                        {r.product_id}
                      </a>
                    ) : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center gap-3 mt-3">
        <button
          disabled={!canPrev}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          className={`px-3 py-1 rounded border ${canPrev ? 'bg-white hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'}`}
        >
          ← Prev
        </button>
        <span className="text-sm">Page {page + 1}</span>
        <button
          disabled={!canNext}
          onClick={() => setPage((p) => p + 1)}
          className={`px-3 py-1 rounded border ${canNext ? 'bg-white hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'}`}
        >
          Next →
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-3">
        Showing up to {pageSize} rows from <code>public.supplier_offers</code>.
      </p>
    </div>
  );
}
