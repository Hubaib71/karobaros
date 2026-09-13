"use client";

import { useEffect, useState } from "react";

type Customer = {
  id: number;
  name: string;
  phone: string | null;
  city: string | null;
};

type Product = {
  product_id: number;
  product: string;
  sku: string;
  units: number;
  spent: number;
};

type Intelligence = {
  customer: Customer;
  summary: {
    total_orders: number;
    approved_orders: number;
    total_spent: number;
    favorite_product: string | null;
    last_purchase: string | null;
  };
  products: Product[];
  ai_insight: string;
  next_action: string;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] =
    useState<Intelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [intelligenceLoading, setIntelligenceLoading] = useState(false);

  async function loadCustomers() {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/customers/"
      );

      const data = await response.json();

      if (data.success) {
        setCustomers(data.customers);

        if (data.customers.length > 0) {
          loadIntelligence(data.customers[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to load customers:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadIntelligence(customerId: number) {
    setIntelligenceLoading(true);

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/customers/${customerId}/intelligence`
      );

      const data = await response.json();

      if (data.success) {
        setSelectedCustomer(data);
      }
    } catch (error) {
      console.error("Failed to load customer intelligence:", error);
    } finally {
      setIntelligenceLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <p className="text-sm text-slate-500">
          Loading customers...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
            Customer Intelligence
          </p>

          <h1 className="mt-2 text-3xl font-black text-slate-900">
            AI-powered CRM
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Understand customer behavior and let AI recommend the next action.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Customer List */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-sm font-bold text-slate-900">
              Customers
            </h2>

            <div className="space-y-2">
              {customers.map((customer) => {
                const active =
                  selectedCustomer?.customer.id === customer.id;

                return (
                  <button
                    key={customer.id}
                    onClick={() => loadIntelligence(customer.id)}
                    className={`w-full rounded-xl p-3 text-left transition ${
                      active
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <p className="text-sm font-bold">
                      {customer.name}
                    </p>

                    <p
                      className={`mt-1 text-xs ${
                        active
                          ? "text-emerald-50"
                          : "text-slate-400"
                      }`}
                    >
                      {customer.city || "Unknown city"}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Intelligence */}
          <section>
            {intelligenceLoading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <p className="text-sm text-slate-500">
                  AI is analyzing customer behavior...
                </p>
              </div>
            ) : selectedCustomer ? (
              <>
                {/* Profile */}
                <div className="mb-6 rounded-2xl bg-slate-900 p-6 text-white shadow-lg">
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                        Customer Profile
                      </p>

                      <h2 className="mt-2 text-2xl font-black">
                        {selectedCustomer.customer.name}
                      </h2>

                      <p className="mt-1 text-sm text-slate-400">
                        {selectedCustomer.customer.city || "No city"}
                        {selectedCustomer.customer.phone
                          ? ` • ${selectedCustomer.customer.phone}`
                          : ""}
                      </p>
                    </div>

                    <div className="rounded-xl bg-emerald-500/10 px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                        AI Status
                      </p>

                      <p className="mt-1 text-sm font-bold text-emerald-300">
                        Customer analyzed
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard
                    label="Total Orders"
                    value={selectedCustomer.summary.total_orders}
                  />

                  <StatCard
                    label="Approved Orders"
                    value={selectedCustomer.summary.approved_orders}
                  />

                  <StatCard
                    label="Total Spent"
                    value={`Rs. ${selectedCustomer.summary.total_spent.toLocaleString()}`}
                  />

                  <StatCard
                    label="Favorite Product"
                    value={
                      selectedCustomer.summary.favorite_product || "—"
                    }
                  />
                </div>

                {/* AI Insight + Next Action */}
                <div className="mb-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white">
                        AI
                      </span>

                      <h3 className="font-bold text-emerald-950">
                        AI Customer Insight
                      </h3>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-emerald-900">
                      {selectedCustomer.ai_insight}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 text-white">
                        →
                      </span>

                      <h3 className="font-bold text-blue-950">
                        Recommended Next Action
                      </h3>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-blue-900">
                      {selectedCustomer.next_action}
                    </p>
                  </div>
                </div>

                {/* Purchase Intelligence */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 p-5">
                    <h3 className="font-bold text-slate-900">
                      Purchase Intelligence
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Products purchased by this customer
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400">
                          <th className="px-5 py-3">Product</th>
                          <th className="px-5 py-3">SKU</th>
                          <th className="px-5 py-3">Units</th>
                          <th className="px-5 py-3">Spent</th>
                        </tr>
                      </thead>

                      <tbody>
                        {selectedCustomer.products.map((product) => (
                          <tr
                            key={product.product_id}
                            className="border-b border-slate-100 last:border-0"
                          >
                            <td className="px-5 py-4 text-sm font-semibold text-slate-800">
                              {product.product}
                            </td>

                            <td className="px-5 py-4 text-xs text-slate-500">
                              {product.sku}
                            </td>

                            <td className="px-5 py-4 text-sm text-slate-700">
                              {product.units}
                            </td>

                            <td className="px-5 py-4 text-sm font-semibold text-slate-800">
                              Rs. {product.spent.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Last Purchase */}
                <div className="mt-4 text-xs text-slate-400">
                  Last approved purchase:{" "}
                  {selectedCustomer.summary.last_purchase
                    ? new Date(
                        selectedCustomer.summary.last_purchase
                      ).toLocaleString()
                    : "No purchase yet"}
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-8">
                <p className="text-sm text-slate-500">
                  Select a customer to view AI intelligence.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-3 text-xl font-black text-slate-900">
        {value}
      </p>
    </div>
  );
}
