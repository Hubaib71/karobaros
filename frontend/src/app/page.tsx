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
customer_name: string;
status: string;
total_amount: number;
delivery_city: string;
invoice_number: string | null;
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

type RestockRecommendation = {
product_id: number;
product: string;
sku: string;
current_quantity: number;
requested_quantity: number;
shortage: number;
recommended_quantity: number;
reason: string;
};

export default function Home() {
const [summary, setSummary] =
useState<DashboardSummary | null>(null);

const [orders, setOrders] =
useState<Order[]>([]);

const [inventory, setInventory] =
useState<InventoryItem[]>([]);

const [loading, setLoading] =
useState(true);

const [approvingOrderId, setApprovingOrderId] =
useState<number | null>(null);

const [rejectingOrderId, setRejectingOrderId] =
useState<number | null>(null);

const [approvalMessage, setApprovalMessage] =
useState("");

const [chatMessage, setChatMessage] =
useState("");

const [aiResponse, setAiResponse] =
useState(
"Ask me about products, inventory, orders, or sales."
);

const [chatLoading, setChatLoading] =
useState(false);

const [restockRecommendation, setRestockRecommendation] =
useState<RestockRecommendation | null>(null);

const [restockLoading, setRestockLoading] =
useState(false);

async function loadDashboard() {
try {
const [
summaryResponse,
ordersResponse,
inventoryResponse,
] = await Promise.all([
fetch(
"http://127.0.0.1:8000/api/dashboard/summary"
),


    fetch(
      "http://127.0.0.1:8000/api/dashboard/recent-orders"
    ),

    fetch(
      "http://127.0.0.1:8000/api/inventory/"
    ),
  ]);

  const summaryData =
    await summaryResponse.json();

  const ordersData =
    await ordersResponse.json();

  const inventoryData =
    await inventoryResponse.json();

  setSummary(summaryData.summary);

  setOrders(
    ordersData.orders || []
  );

  setInventory(
    inventoryData.inventory || []
  );
} catch (error) {
  console.error(
    "Failed to load dashboard:",
    error
  );
} finally {
  setLoading(false);
}


}

useEffect(() => {
loadDashboard();
}, []);

async function rejectOrder(orderId: number) {
  if (rejectingOrderId !== null) {
    return;
  }

  setRejectingOrderId(orderId);
  setApprovalMessage("");

  try {
    const response = await fetch(
      `http://127.0.0.1:8000/api/orders/${orderId}/reject`,
      {
        method: "POST",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail || "Failed to reject order"
      );
    }

    setApprovalMessage(
      `Order ${data.order.order_number} rejected successfully.`
    );

    await loadDashboard();
  } catch (error) {
    console.error(
      "Failed to reject order:",
      error
    );

    setApprovalMessage(
      error instanceof Error
        ? error.message
        : "Failed to reject order."
    );
  } finally {
    setRejectingOrderId(null);
  }
}

async function approveOrder(orderId: number) {
if (approvingOrderId !== null) {
return;
}


setApprovingOrderId(orderId);
setApprovalMessage("");

try {
  const response = await fetch(
    `http://127.0.0.1:8000/api/orders/${orderId}/approve`,
    {
      method: "POST",
    }
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail ||
        "Failed to approve order"
    );
  }

  setApprovalMessage(
    `Order ${data.order.order_number} approved. Invoice ${data.invoice.invoice_number} generated.`
  );

  await loadDashboard();
} catch (error) {
  console.error(
    "Order approval failed:",
    error
  );

  setApprovalMessage(
    error instanceof Error
      ? error.message
      : "Failed to approve order."
  );
} finally {
  setApprovingOrderId(null);
}


}

async function approveRestock() {
const recommendation =
restockRecommendation;


if (!recommendation || restockLoading) {
  return;
}

setRestockLoading(true);

try {
  const response = await fetch(
    `http://127.0.0.1:8000/api/inventory/${recommendation.product_id}/restock?quantity=${recommendation.recommended_quantity}`,
    {
      method: "POST",
    }
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail ||
        "Restock failed"
    );
  }

  setAiResponse(
    `${recommendation.product} restocked successfully. Stock is now ${data.new_quantity} units.`
  );

  setRestockRecommendation(null);

  await loadDashboard();
} catch (error) {
  console.error(
    "Restock approval failed:",
    error
  );

  setAiResponse(
    error instanceof Error
      ? error.message
      : "Unable to approve restock."
  );
} finally {
  setRestockLoading(false);
}


}

async function sendMessage() {
const message =
chatMessage.trim();


if (!message || chatLoading) {
  return;
}

setChatLoading(true);

setAiResponse(
  "KarobarOS is thinking..."
);

try {
  const response = await fetch(
    "http://127.0.0.1:8000/api/ai/chat",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        message: message,
        customer_id: 1,
      }),
    }
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail ||
        "AI request failed"
    );
  }

  setAiResponse(
    data.message
  );

  if (
    data.restock_recommendation
  ) {
    setRestockRecommendation(
      data.restock_recommendation
    );
  } else {
    setRestockRecommendation(
      null
    );
  }

  setChatMessage("");

  await loadDashboard();
} catch (error) {
  console.error(
    "AI chat failed:",
    error
  );

  setAiResponse(
    error instanceof Error
      ? error.message
      : "Sorry, I could not connect to the KarobarOS AI system."
  );
} finally {
  setChatLoading(false);
}


}

const lowStockItems =
inventory.filter(
(item) => item.low_stock
);

return ( <main className="min-h-screen bg-slate-100 text-slate-900"> <div className="flex min-h-screen">


    {/* Sidebar */}

    <aside className="hidden w-64 flex-col bg-slate-950 text-white md:flex">

      <div className="border-b border-slate-800 px-6 py-6">

        <h1 className="text-2xl font-bold tracking-tight">
          KarobarOS
        </h1>

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

        <p className="text-sm font-medium">
          StyleHub PK
        </p>

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
                : "Rs. " +
                  (
                    summary?.total_sales?.toLocaleString() ||
                    "0"
                  )
            }
            description="Approved orders"
          />

          <StatCard
            title="Orders"
            value={
              loading
                ? "..."
                : String(
                    summary?.total_orders ||
                      0
                  )
            }
            description={
              String(
                summary?.pending_orders ||
                  0
              ) +
              " pending approval"
            }
          />

          <StatCard
            title="Products"
            value={
              loading
                ? "..."
                : String(
                    summary?.total_products ||
                      0
                  )
            }
            description="Active products"
          />

          <StatCard
            title="Low Stock"
            value={
              loading
                ? "..."
                : String(
                    summary?.low_stock_items ||
                      0
                  )
            }
            description="Items need attention"
            alert={Boolean(
              summary?.low_stock_items
            )}
          />

        </div>

        {/* Approval message */}

        {approvalMessage && (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-800">
            {approvalMessage}
          </div>
        )}

        {/* Main grid */}

        <div className="mt-6 grid gap-6 xl:grid-cols-3">

          {/* Recent Orders */}

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-2">

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>

                <h3 className="font-semibold">
                  Recent Orders
                </h3>

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

                    <th className="px-6 py-3">
                      Order
                    </th>

                    <th className="px-6 py-3">
                      Customer
                    </th>

                    <th className="px-6 py-3">
                      City
                    </th>

                    <th className="px-6 py-3">
                      Amount
                    </th>

                    <th className="px-6 py-3">
                      Invoice
                    </th>

                    <th className="px-6 py-3">
                      Status
                    </th>

                    <th className="px-6 py-3">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {orders.map(
                    (order) => (
                      <tr
                        key={order.id}
                        className="border-t border-slate-100"
                      >

                        <td className="px-6 py-4 font-medium">
                          {order.order_number}
                        </td>

                        <td className="px-6 py-4">

                          <div className="font-medium">
                            {order.customer_name}
                          </div>

                          <div className="mt-1 text-xs text-slate-400">
                            Customer #
                            {order.customer_id}
                          </div>

                        </td>

                        <td className="px-6 py-4 text-slate-600">
                          {order.delivery_city}
                        </td>

                        <td className="px-6 py-4 font-medium">
                          Rs.{" "}
                          {order.total_amount.toLocaleString()}
                        </td>

                        <td className="px-6 py-4">

                          {order.invoice_number ? (

                            <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                              {order.invoice_number}
                            </span>

                          ) : (

                            <span className="text-xs text-slate-400">
                              Not generated
                            </span>

                          )}

                        </td>

                        <td className="px-6 py-4">

                          <span
                            className={
                              "rounded-full px-3 py-1 text-xs font-medium " +
                              (
                                order.status ===
                                "approved"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : order.status ===
                                  "rejected"
                                    ? "bg-red-50 text-red-700"
                                    : "bg-amber-50 text-amber-700"
                              )
                            }
                          >
                            {order.status.replace(
                              "_",
                              " "
                            )}
                          </span>

                        </td>

                        <td className="px-6 py-4">

                          {order.status ===
                          "pending_approval" ? (

                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  approveOrder(
                                    order.id
                                  )
                                }
                                disabled={
                                  approvingOrderId !== null ||
                                  rejectingOrderId !== null
                                }
                                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {approvingOrderId ===
                                order.id
                                  ? "Approving..."
                                  : "Approve"}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  rejectOrder(
                                    order.id
                                  )
                                }
                                disabled={
                                  approvingOrderId !== null ||
                                  rejectingOrderId !== null
                                }
                                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {rejectingOrderId ===
                                order.id
                                  ? "Rejecting..."
                                  : "Reject"}
                              </button>
                            </div>

                          ) : (

                            <span className="text-xs text-slate-400">
                              Completed
                            </span>

                          )}

                        </td>

                      </tr>
                    )
                  )}

                  {!loading &&
                    orders.length ===
                      0 && (

                      <tr>

                        <td
                          colSpan={7}
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

          {/* Low Stock */}

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 px-6 py-5">

              <h3 className="font-semibold">
                Low Stock Alerts
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Inventory requiring attention
              </p>

            </div>

            <div className="divide-y divide-slate-100">

              {lowStockItems.map(
                (item) => (
                  <div
                    key={item.product_id}
                    className="px-6 py-5"
                  >

                    <div className="flex items-start justify-between gap-4">

                      <div>

                        <p className="font-medium">
                          {item.name}
                        </p>

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
                            width:
                              Math.min(
                                (item.quantity /
                                  item.low_stock_threshold) *
                                  100,
                                100
                              ) +
                              "%",
                          }}
                        />

                      </div>

                      <p className="mt-2 text-xs text-slate-500">
                        Threshold:{" "}
                        {
                          item.low_stock_threshold
                        }
                      </p>

                    </div>

                  </div>
                )
              )}

              {!loading &&
                lowStockItems.length ===
                  0 && (

                  <div className="px-6 py-8 text-center text-sm text-slate-500">
                    All inventory levels are healthy.
                  </div>
                )}

            </div>

          </div>

        </div>

        {/* AI Assistant */}

        <div className="mt-6 overflow-hidden rounded-2xl bg-slate-950 text-white shadow-sm">

          {/* AI Header */}

          <div className="border-b border-slate-800 px-6 py-5">

            <div className="flex items-center justify-between">

              <div>

                <h3 className="font-semibold">
                  KarobarOS AI Assistant
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  Your business operations copilot
                </p>

              </div>

              <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                Online
              </div>

            </div>

          </div>

          {/* Chat */}

          <div className="p-6">

            {/* Example */}

            <div className="rounded-xl bg-slate-900 p-4">

              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Example request
              </p>

              <button
                type="button"
                onClick={() =>
                  setChatMessage(
                    "Bhai 2 black T-shirts size L chahiye, Lahore delivery."
                  )
                }
                className="mt-3 w-full rounded-xl bg-slate-800 p-4 text-left text-sm text-slate-300 transition hover:bg-slate-700"
              >
                “Bhai 2 black T-shirts size L chahiye, Lahore delivery.”
              </button>

            </div>

            {/* AI response */}

            <div className="mt-4 rounded-xl bg-slate-900 p-4">

              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                AI response
              </p>

              <div className="mt-3 rounded-xl bg-slate-800 p-4 text-sm leading-6 text-slate-200">
                {aiResponse}
              </div>

            </div>

            {/* Restock Recommendation */}

            {restockRecommendation && (

              <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">

                <div className="flex items-start justify-between gap-4">

                  <div>

                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                      Restock recommendation
                    </p>

                    <h4 className="mt-2 text-lg font-semibold text-white">
                      {
                        restockRecommendation.product
                      }
                    </h4>

                    <p className="mt-1 text-xs text-slate-400">
                      {
                        restockRecommendation.sku
                      }
                    </p>

                  </div>

                  <div className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400">
                    Short by{" "}
                    {
                      restockRecommendation.shortage
                    }
                  </div>

                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">

                  <div className="rounded-lg bg-slate-900 p-3">

                    <p className="text-xs text-slate-500">
                      Current stock
                    </p>

                    <p className="mt-1 text-lg font-bold text-white">
                      {
                        restockRecommendation.current_quantity
                      }
                    </p>

                  </div>

                  <div className="rounded-lg bg-slate-900 p-3">

                    <p className="text-xs text-slate-500">
                      Requested
                    </p>

                    <p className="mt-1 text-lg font-bold text-white">
                      {
                        restockRecommendation.requested_quantity
                      }
                    </p>

                  </div>

                  <div className="rounded-lg bg-slate-900 p-3">

                    <p className="text-xs text-slate-500">
                      Recommended
                    </p>

                    <p className="mt-1 text-lg font-bold text-amber-400">
                      {
                        restockRecommendation.recommended_quantity
                      }
                    </p>

                  </div>

                </div>

                <p className="mt-4 text-sm text-slate-300">
                  {
                    restockRecommendation.reason
                  }
                </p>

                <button
                  type="button"
                  onClick={approveRestock}
                  disabled={restockLoading}
                  className="mt-4 w-full rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {restockLoading
                    ? "Restocking..."
                    : "Approve Restock"}
                </button>

                <p className="mt-2 text-center text-xs text-slate-500">
                  Human approval required before inventory changes.
                </p>

              </div>

            )}

            {/* Input */}

            <div className="mt-4 flex gap-3">

              <input
                type="text"
                value={chatMessage}
                onChange={(event) =>
                  setChatMessage(
                    event.target.value
                  )
                }
                onKeyDown={(event) => {

                  if (
                    event.key ===
                    "Enter"
                  ) {
                    sendMessage();
                  }

                }}
                placeholder="Ask KarobarOS..."
                className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-slate-500"
              />

              <button
                type="button"
                onClick={sendMessage}
                disabled={
                  chatLoading ||
                  !chatMessage.trim()
                }
                className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {chatLoading
                  ? "Sending..."
                  : "Send"}
              </button>

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
return ( <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">


  <p className="text-sm font-medium text-slate-500">
    {title}
  </p>

  <p
    className={
      "mt-3 text-3xl font-bold tracking-tight " +
      (alert
        ? "text-red-600"
        : "text-slate-900")
    }
  >
    {value}
  </p>

  <p className="mt-2 text-sm text-slate-500">
    {description}
  </p>

</div>

);
}