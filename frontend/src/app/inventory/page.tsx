"use client";

import { useEffect, useState } from "react";

type InventoryItem = {
  id: number;
  product_name?: string;
  product?: string;
  sku: string;
  quantity: number;
  unit_price?: number;
  price?: number;
  low_stock?: boolean;
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/inventory/")
      .then((res) => res.json())
      .then((data) => {
        setItems(Array.isArray(data) ? data : data.items || []);
      })
      .catch((error) => {
        console.error("Inventory loading failed:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 p-6 sm:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage products, stock levels, and restocking.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-bold text-slate-900">
            Current Inventory
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">
            Loading inventory...
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">
            No inventory items found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">SKU</th>
                  <th className="px-5 py-3">Stock</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {item.product_name || item.product || "Product"}
                    </td>

                    <td className="px-5 py-4 text-slate-500">
                      {item.sku}
                    </td>

                    <td className="px-5 py-4 font-semibold text-slate-700">
                      {item.quantity}
                    </td>

                    <td className="px-5 py-4 text-slate-700">
                      Rs.{" "}
                      {(
                        item.unit_price ??
                        item.price ??
                        0
                      ).toLocaleString()}
                    </td>

                    <td className="px-5 py-4">
                      {item.low_stock ? (
                        <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                          Low Stock
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                          In Stock
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}