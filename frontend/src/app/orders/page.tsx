"use client";

import { useEffect, useState } from "react";

type Order = {
  id: number;
  order_number?: string;
  status?: string;
  total_amount?: number;
  customer_name?: string;
  created_at?: string;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/dashboard/recent-orders")
      .then((res) => res.json())
      .then((data) => {
        setOrders(Array.isArray(data) ? data : data.orders || []);
      })
      .catch((error) => {
        console.error("Orders loading failed:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 p-6 sm:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage customer orders and approvals.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-bold text-slate-900">Recent Orders</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">
            No orders found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Date</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-t border-slate-100">
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {order.order_number || `Order #${order.id}`}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {order.customer_name || "Customer"}
                    </td>

                    <td className="px-5 py-4 font-semibold text-slate-700">
                      Rs. {(order.total_amount || 0).toLocaleString()}
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                        {order.status || "Unknown"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-slate-500">
                      {order.created_at
                        ? new Date(order.created_at).toLocaleDateString()
                        : "—"}
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