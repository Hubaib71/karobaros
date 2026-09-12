"use client";

import { useEffect, useState } from "react";

type DashboardSummary = {
  total_products: number;
  total_customers: number;
  total_orders: number;
  approved_orders: number;
  pending_orders: number;
  total_sales: number;
  low_stock_items: number;
};

type Order = {
  id: number;
  order_number: string;
  customer_id: number;
  status: string;
  total_amount: number;
  delivery_city: string;
  created_at: string;
};

type InventoryItem = {
  product_id: number;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  low_stock_threshold: number;
  low_stock: boolean;
};

export default function Home() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [summaryResponse, ordersResponse, inventoryResponse] =
          await Promise.all([
            fetch("http://127.0.0.1:8000/api/dashboard/summary"),
            fetch("http://127.0.0.1:8000/api/dashboard/recent-orders"),
            fetch("http://127.0.0.1:8000/api/inventory/"),
          ]);

        const summaryData = await summaryResponse.json();
        const ordersData = await ordersResponse.json();
        const inventoryData = await inventoryResponse.json();

        setSummary(summaryData.summary);
        setOrders(ordersData.orders || []);
        setInventory(inventoryData.inventory || []);
      } catch (error) {
        console.error("Failed to load dashboard:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const lowStockItems = inventory.filter((item) => item.low_stock);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-64 flex-col bg-slate-950 text-white md:flex">
          <div className="border-b border-slate-800 px-6 py-6">
            <h1 className="text-2xl font-bold tracking-tight">KarobarOS</h1>
            <p className="mt-1 text-sm text-slate-400">
              AI Business Operating System
            </p>
          </div>

          <nav className="flex-1 px-4 py-6">
            <div className="rounded-xl bg-slate-800 px-4 py-3 font-medium">
              Dashboard
            </div>

            <div className="mt-2 rounded-xl px-4 py-3 text-slate-400">
              Products
            </div>

            <div className="mt-2 rounded-xl px-4 py-3 text-slate-400">
              Inventory
            </div>

            <div className="mt-2 rounded-xl px-4 py-3 text-slate-400">
              Orders
            </div>

            <div className="mt-2 rounded-xl px-4 py-3 text-slate-400">
              Customers
            </div>

            <div className="mt-2 rounded-xl px-4 py-3 text-slate-400">
              AI Assistant
            </div>
          </nav>

          <div className="border-t border-slate-800 px-6 py-5">
            <p className="text-sm font-medium">StyleHub PK</p>
            <p className="mt-1 text-xs text-slate-500">
              Clothing business
            </p>
          </div>
        </aside>

        {/* Main content */}
        <section className="flex-1">
          {/* Header */}
          <header className="border-b border-slate-200 bg-white px-6 py-5 md:px-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Business overview
                </p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight">
                  Good morning, StyleHub PK
                </h2>
              </div>

              <div className="hidden rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 sm:block">
                AI System Online
              </div>
            </div>
          </header>

          <div className="p-6 md:p-8">
            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Sales"
                value={
                  loading
                    ? "..."
                    : `Rs. ${summary?.total_sales.toLocaleString() || "0"}`
                }
                description="Approved orders"
              />

              <StatCard
                title="Orders"
                value={loading ? "..." : `${summary?.total_orders || 0}`}
                description={`${summary?.pending_orders || 0} pending approval`}
              />

              <StatCard
                title="Products"
                value={loading ? "..." : `${summary?.total_products || 0}`}
                description="Active products"
              />

              <StatCard
                title="Low Stock"
                value={loading ? "..." : `${summary?.low_stock_items || 0}`}
                description="Items need attention"
                alert={Boolean(summary?.low_stock_items)}
              />
            </div>

            {/* Main grid */}
            <div className="mt-6 grid gap-6 xl:grid-cols-3">
              {/* Recent orders */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                  <div>
                    <h3 className="font-semibold">Recent Orders</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Latest customer activity
                    </p>
                  </div>

                  <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    Live
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-6 py-3">Order</th>
                        <th className="px-6 py-3">Customer</th>
                        <th className="px-6 py-3">City</th>
                        <th className="px-6 py-3">Amount</th>
                        <th className="px-6 py-3">Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {orders.map((order) => (
                        <tr
                          key={order.id}
                          className="border-t border-slate-100"
                        >
                          <td className="px-6 py-4 font-medium">
                            {order.order_number}
                          </td>

                          <td className="px-6 py-4 text-slate-600">
                            Customer #{order.customer_id}
                          </td>

                          <td className="px-6 py-4 text-slate-600">
                            {order.delivery_city}
                          </td>

                          <td className="px-6 py-4 font-medium">
                            Rs. {order.total_amount.toLocaleString()}
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ${
                                order.status === "approved"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {order.status.replace("_", " ")}
                            </span>
                          </td>
                        </tr>
                      ))}

                      {!loading && orders.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-6 py-8 text-center text-slate-500"
                          >
                            No orders yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Low stock */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-6 py-5">
                  <h3 className="font-semibold">Low Stock Alerts</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Inventory requiring attention
                  </p>
                </div>

                <div className="divide-y divide-slate-100">
                  {lowStockItems.map((item) => (
                    <div key={item.product_id} className="px-6 py-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {item.sku}
                          </p>
                        </div>

                        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                          {item.quantity} left
                        </span>
                      </div>

                      <div className="mt-3">
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-red-500"
                            style={{
                              width: `${Math.min(
                                (item.quantity /
                                  item.low_stock_threshold) *
                                  100,
                                100
                              )}%`,
                            }}
                          />
                        </div>

                        <p className="mt-2 text-xs text-slate-500">
                          Threshold: {item.low_stock_threshold}
                        </p>
                      </div>
                    </div>
                  ))}

                  {!loading && lowStockItems.length === 0 && (
                    <div className="px-6 py-8 text-center text-sm text-slate-500">
                      All inventory levels are healthy.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* AI Assistant preview */}
            <div className="mt-6 overflow-hidden rounded-2xl bg-slate-950 text-white shadow-sm">
              <div className="border-b border-slate-800 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">KarobarOS AI Assistant</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Your business operations copilot
                    </p>
                  </div>

                  <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                    Online
                  </div>
                </div>
              </div>

              <div className="grid gap-6 p-6 md:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Example request
                  </p>

                  <div className="mt-3 rounded-xl bg-slate-900 p-4 text-sm text-slate-300">
                    “Bhai 3 black T-shirts size L chahiye, Lahore delivery.”
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    AI response
                  </p>

                  <div className="mt-3 rounded-xl bg-slate-900 p-4 text-sm text-slate-300">
                    I found the product and checked inventory. The order is
                    ready for human approval.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}


function StatCard({
  title,
  value,
  description,
  alert = false,
}: {
  title: string;
  value: string;
  description: string;
  alert?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>

      <p
        className={`mt-3 text-3xl font-bold tracking-tight ${
          alert ? "text-red-600" : "text-slate-900"
        }`}
      >
        {value}
      </p>

      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  );
}