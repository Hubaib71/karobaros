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
  average_order_value: number;
  approval_rate: number;
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

type AgentActivity = {
id: number;
agent_name: string;
action: string;
status: string;
details: string | null;
created_at: string;
};

type SalesOverviewItem = {
date: string;
sales: number;
};
type TopProduct = {
  name: string;
  sku: string;
  units_sold: number;
  sales: number;
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

const [activeAgent, setActiveAgent] = useState<string | null>(null);

const [agentActivities, setAgentActivities] =
useState<AgentActivity[]>([]);

const [salesOverview, setSalesOverview] =
useState<SalesOverviewItem[]>([]);

const [topProducts, setTopProducts] =
  useState<TopProduct[]>([]);

const [restockRecommendation, setRestockRecommendation] =
useState<RestockRecommendation | null>(null);

const [restockLoading, setRestockLoading] =
useState(false);

const [customerHistory, setCustomerHistory] =
useState<any>(null);

const [customers, setCustomers] =
useState<any[]>([]);

const [selectedCustomerId, setSelectedCustomerId] =
useState<number>(1);

async function loadDashboard() {
  try {
    const [
      summaryResponse,
      ordersResponse,
      inventoryResponse,
      customerHistoryResponse,
      customersResponse,
      agentActivityResponse,
      salesOverviewResponse,
      topProductsResponse,
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

      fetch(
        `http://127.0.0.1:8000/api/customers/${selectedCustomerId}/history`
      ),

      fetch(
        "http://127.0.0.1:8000/api/customers/"
      ),

      fetch(
        "http://127.0.0.1:8000/api/agent-activity/?limit=12"
      ),

      fetch(
        "http://127.0.0.1:8000/api/dashboard/sales-overview"
      ),

      fetch(
        "http://127.0.0.1:8000/api/dashboard/top-products"
      ),
    ]);

    const summaryData =
      await summaryResponse.json();

    const ordersData =
      await ordersResponse.json();

    const inventoryData =
      await inventoryResponse.json();

    const customerHistoryData =
      await customerHistoryResponse.json();

    const customersData =
      await customersResponse.json();

    const agentActivityData =
      await agentActivityResponse.json();

    const salesOverviewData =
      await salesOverviewResponse.json();

    const topProductsData =
      await topProductsResponse.json();

    setSummary(summaryData.summary);

    setOrders(
      ordersData.orders || []
    );

    setInventory(
      inventoryData.inventory || []
    );

    setCustomerHistory(
      customerHistoryData
    );

    setCustomers(
      customersData.customers || []
    );

    setAgentActivities(
      agentActivityData.activities || []
    );

    setSalesOverview(
      salesOverviewData.sales || []
    );

    setTopProducts(
      topProductsData.products || []
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
}, [selectedCustomerId]);

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

async function downloadInvoice(orderId: number) {
  try {
    const response = await fetch(
      `http://127.0.0.1:8000/api/invoices/order/${orderId}/pdf`
    );

    if (!response.ok) {
      const data = await response.json();

      throw new Error(
        data.detail || "Failed to download invoice"
      );
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `invoice-${orderId}.pdf`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Invoice download failed:", error);

    setApprovalMessage(
      error instanceof Error
        ? error.message
        : "Failed to download invoice."
    );
  }
}
async function approveOrder(orderId: number) {
if (approvingOrderId !== null) {
return;
}


setApprovingOrderId(orderId);
setApprovalMessage("");
setActiveAgent("Human Approval");
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
  `Order ${data.order.order_number} approved successfully.\n\nInvoice ${data.invoice.invoice_number} generated.\n\nInventory updated and order is ready for fulfillment.`
);

setActiveAgent(null);

await loadDashboard();
} catch (error) {
  console.error(
    "Order approval failed:",
    error
  );
  
  setActiveAgent(null);

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
setActiveAgent("Orchestrator");
setAiResponse("KarobarOS is thinking...");

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

  const agentMap: Record<string, string> = {
    customer_agent: "Customer",
    inventory_agent: "Inventory Agent",
    business_intelligence: "Orchestrator",
    sales_agent: "Sales Agent",
    order_agent: "Order Agent",
    completed: "Order Agent",
  };

  const resolvedAgent =
    agentMap[data.next_agent] || "Orchestrator";

  setActiveAgent(resolvedAgent);
  await new Promise((resolve) => setTimeout(resolve, 400));

  setAiResponse(data.message);

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

    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-950 text-white md:flex">

      <div className="border-b border-slate-800 px-6 py-6">

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-lg font-bold text-slate-950">
            K
          </div>

          <div>
            <h1 className="text-lg font-bold tracking-tight">
              KarobarOS
            </h1>
            <p className="text-[11px] text-slate-500">
              AI Business OS
            </p>
          </div>
        </div>

      </div>

      <nav className="flex-1 px-3 py-5">

        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
          Workspace
        </p>

        <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 px-3 py-2.5 text-sm font-semibold text-emerald-300">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-xs font-bold text-slate-950">
            01
          </span>
          Dashboard
        </div>

        <div className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 transition hover:bg-slate-900 hover:text-slate-200">
          <span className="w-7 text-center text-xs text-slate-600">02</span>
          Products
        </div>

        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 transition hover:bg-slate-900 hover:text-slate-200">
          <span className="w-7 text-center text-xs text-slate-600">03</span>
          Inventory
        </div>

        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 transition hover:bg-slate-900 hover:text-slate-200">
          <span className="w-7 text-center text-xs text-slate-600">04</span>
          Orders
        </div>

        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 transition hover:bg-slate-900 hover:text-slate-200">
          <span className="w-7 text-center text-xs text-slate-600">05</span>
          Customers
        </div>

        <div className="mt-5 px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
          AI & Operations
        </div>

        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 transition hover:bg-slate-900 hover:text-slate-200">
          <span className="w-7 text-center text-xs text-slate-600">✦</span>
          AI Assistant
        </div>

        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 transition hover:bg-slate-900 hover:text-slate-200">
          <span className="w-7 text-center text-xs text-slate-600">06</span>
          Invoices
        </div>

        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 transition hover:bg-slate-900 hover:text-slate-200">
          <span className="w-7 text-center text-xs text-slate-600">07</span>
          Reports
        </div>

      </nav>

      <div className="border-t border-slate-800 p-4">

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">

          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">
              StyleHub PK
            </p>

            <span className="h-2 w-2 rounded-full bg-emerald-400" />
          </div>

          <p className="mt-1 text-xs text-slate-500">
            Clothing business
          </p>

          <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-3">
            <span className="text-[10px] uppercase tracking-wider text-slate-600">
              System
            </span>
            <span className="text-[10px] font-medium text-emerald-400">
              Online
            </span>
          </div>

        </div>

      </div>

    </aside>

    {/* Main content */}

    <section className="min-w-0 flex-1">

      {/* Header */}

      <header className="border-b border-slate-200 bg-white px-6 py-5 md:px-8">

        <div className="flex items-center justify-between gap-6">

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Business overview
            </p>

            <div className="mt-1 flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                Good morning, StyleHub PK
              </h2>

              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                AI Online
              </span>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Your AI-powered business command center.
            </p>
          </div>

          <div className="hidden items-center gap-3 sm:flex">

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Business
              </p>
              <p className="mt-0.5 text-sm font-semibold text-slate-700">
                StyleHub PK
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white">
              SH
            </div>

          </div>

        </div>

      </header>

      <div className="p-6 md:p-8">

        {/* Stats */}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

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
                    <StatCard
            title="Avg. Order Value"
            value={
              loading
                ? "..."
                : "Rs. " +
                  (
                    summary?.average_order_value ||
                    0
                  ).toLocaleString()
            }
            description="Per approved order"
          />

          <StatCard
            title="Approval Rate"
            value={
              loading
                ? "..."
                : (
                    summary?.approval_rate ||
                    0
                  ).toFixed(1) + "%"
            }
            description="Orders approved"
          />

        </div>

        {/* Sales Overview */}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Performance
              </p>
              <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-950">
                Sales Overview
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Approved sales over the last 7 days.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                7-day sales
              </p>
              <p className="mt-0.5 text-sm font-bold text-slate-900">
                Rs. {salesOverview
                  .reduce((total, item) => total + item.sales, 0)
                  .toLocaleString()}
              </p>
            </div>
          </div>

          <div className="mt-5 h-64">
            {salesOverview.length > 0 ? (
              <div className="flex h-full items-end gap-2 sm:gap-3">
                {salesOverview.map((item) => {
                  const maxSales = Math.max(
                    ...salesOverview.map((entry) => entry.sales),
                    1
                  );

                  const height =
                    item.sales === 0
                      ? 4
                      : Math.max((item.sales / maxSales) * 100, 8);

                  const label = new Date(
                    item.date + "T00:00:00"
                  ).toLocaleDateString("en-US", {
                    weekday: "short",
                  });

                  return (
                    <div
                      key={item.date}
                      className="flex h-full flex-1 flex-col justify-end"
                    >
                      <div className="mb-2 text-center text-[10px] font-semibold text-slate-500">
                        {item.sales > 0
                          ? "Rs. " +
                            item.sales.toLocaleString()
                          : ""}
                      </div>

                      <div className="flex h-full items-end">
                        <div
                          className="w-full rounded-t-xl bg-emerald-500/85 transition-all duration-500 hover:bg-emerald-500"
                          style={{ height: `${height}%` }}
                          title={`${item.date}: Rs. ${item.sales.toLocaleString()}`}
                        />
                      </div>

                      <p className="mt-2 text-center text-[10px] font-medium text-slate-400">
                        {label}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl bg-slate-50">
                <p className="text-sm text-slate-400">
                  No sales data available yet.
                </p>
              </div>
            )}
          </div>
        </div>
        {/* Top Selling Products */}

<div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
  <div className="flex items-end justify-between gap-4">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
        Product performance
      </p>
      <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-950">
        Top Selling Products
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        Best-performing products based on approved orders.
      </p>
    </div>

    <div className="hidden rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 sm:block">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        Products
      </p>
      <p className="mt-0.5 text-sm font-bold text-slate-900">
        {topProducts.length}
      </p>
    </div>
  </div>

  <div className="mt-5 space-y-3">
    {topProducts.length > 0 ? (
      topProducts.map((product, index) => (
        <div
          key={product.sku}
          className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4 transition-all duration-200 hover:border-slate-200 hover:bg-slate-50"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">
            {index + 1}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {product.name}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {product.sku}
                </p>
              </div>

              <div className="sm:text-right">
                <p className="text-sm font-bold text-slate-900">
                  Rs. {product.sales.toLocaleString()}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {product.units_sold} units sold
                </p>
              </div>
            </div>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{
                  width: `${
                    (product.units_sold /
                      Math.max(
                        ...topProducts.map(
                          (item) => item.units_sold
                        ),
                        1
                      )) *
                    100
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      ))
    ) : (
      <div className="flex min-h-32 items-center justify-center rounded-xl bg-slate-50">
        <p className="text-sm text-slate-400">
          No approved product sales yet.
        </p>
      </div>
    )}
  </div>
</div>

        {/* Approval message */}

        {approvalMessage && (
  <div className="mt-3 rounded-xl bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-300">
    {approvalMessage.split("\n").map((line, index) => (
      <p key={index} className={index > 0 ? "mt-2" : ""}>
        {line}
      </p>
    ))}
  </div>
)}
  

        {/* Main grid */}

        <div className="mt-6 grid gap-6 xl:grid-cols-3">

          {/* Recent Orders */}

<div className="rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-2">

  <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
        Customer activity
      </p>

      <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-950">
        Recent Orders
      </h3>

      <p className="mt-1 text-sm text-slate-500">
        Latest orders and approval activity
      </p>
    </div>

    <div className="flex items-center gap-2">
      <span className="flex h-2 w-2 rounded-full bg-emerald-500" />

      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
        Live
      </span>
    </div>

  </div>

  <div className="overflow-x-auto">

    <table className="w-full min-w-[900px] text-left text-sm">

      <thead className="border-b border-slate-100 bg-slate-50/80">

        <tr>

          <th className="px-6 py-3.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Order
          </th>

          <th className="px-6 py-3.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Customer
          </th>

          <th className="px-6 py-3.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            City
          </th>

          <th className="px-6 py-3.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Amount
          </th>

          <th className="px-6 py-3.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Invoice
          </th>

          <th className="px-6 py-3.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Status
          </th>

          <th className="px-6 py-3.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Action
          </th>

        </tr>

      </thead>

      <tbody>

        {orders.map((order) => (

          <tr
            key={order.id}
            className="border-t border-slate-100 transition-colors hover:bg-slate-50/70"
          >

            <td className="px-6 py-4">

              <p className="font-semibold text-slate-900">
                {order.order_number}
              </p>

              <p className="mt-1 text-[11px] text-slate-400">
                Order #{order.id}
              </p>

            </td>

            <td className="px-6 py-4">

              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white">
                  {order.customer_name
                    ? order.customer_name
                        .split(" ")
                        .map((name) => name[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()
                    : "CU"}
                </div>

                <div>

                  <p className="font-semibold text-slate-900">
                    {order.customer_name}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Customer #{order.customer_id}
                  </p>

                </div>

              </div>

            </td>

            <td className="px-6 py-4">

              <span className="text-sm font-medium text-slate-600">
                {order.delivery_city}
              </span>

            </td>

            <td className="px-6 py-4">

              <p className="font-bold text-slate-900">
                Rs. {order.total_amount.toLocaleString()}
              </p>

            </td>

            <td className="px-6 py-4">
  {order.invoice_number ? (
    <div className="flex items-center gap-2">
      <span className="inline-flex rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
        {order.invoice_number}
      </span>

      {order.status === "approved" && (
        <button
          onClick={() => downloadInvoice(order.id)}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Download PDF
        </button>
      )}
    </div>
  ) : (
    <span className="text-xs font-medium text-slate-400">
      Not generated
    </span>
  )}
</td>

            <td className="px-6 py-4">

              <span
                className={
                  "inline-flex rounded-full px-3 py-1 text-[11px] font-semibold capitalize " +
                  (
                    order.status === "approved"
                      ? "bg-emerald-50 text-emerald-700"
                      : order.status === "rejected"
                        ? "bg-red-50 text-red-700"
                        : "bg-amber-50 text-amber-700"
                  )
                }
              >
                {order.status.replace("_", " ")}
              </span>

            </td>

            <td className="px-6 py-4">

              {order.status === "pending_approval" ? (

                <div className="flex items-center gap-2">

                  <button
                    type="button"
                    onClick={() => approveOrder(order.id)}
                    disabled={
                      approvingOrderId !== null ||
                      rejectingOrderId !== null
                    }
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {approvingOrderId === order.id
                      ? "Approving..."
                      : "Approve"}
                  </button>

                  <button
                    type="button"
                    onClick={() => rejectOrder(order.id)}
                    disabled={
                      approvingOrderId !== null ||
                      rejectingOrderId !== null
                    }
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {rejectingOrderId === order.id
                      ? "Rejecting..."
                      : "Reject"}
                  </button>

                </div>

              ) : (

                <span className="text-xs font-medium text-slate-400">
                  Completed
                </span>

              )}

            </td>

          </tr>

        ))}

        {!loading && orders.length === 0 && (

          <tr>

            <td
              colSpan={7}
              className="px-6 py-12 text-center"
            >

              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                —
              </div>

              <p className="mt-3 text-sm font-medium text-slate-600">
                No orders yet
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Customer orders will appear here.
              </p>

            </td>

          </tr>

        )}

      </tbody>

    </table>

  </div>

</div>

          {/* Low Stock */}

<div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

  {/* Low Stock Header */}

  <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">

    <div>

      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
        Inventory health
      </p>

      <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-950">
        Low Stock Alerts
      </h3>

      <p className="mt-1 text-sm text-slate-500">
        Inventory requiring attention
      </p>

    </div>

    <span className="shrink-0 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
      {lowStockItems.length} alert
      {lowStockItems.length === 1 ? "" : "s"}
    </span>

  </div>

  {/* Low Stock Items */}

  <div className="divide-y divide-slate-100">

    {lowStockItems.map((item) => {

      const stockPercentage = Math.min(
        (item.quantity / item.low_stock_threshold) * 100,
        100
      );

      const severity =
        item.quantity <=
        Math.ceil(item.low_stock_threshold * 0.5)
          ? "Critical"
          : "Low";

      return (

        <div
          key={item.product_id}
          className="px-6 py-5 transition-colors hover:bg-slate-50/70"
        >

          <div className="flex items-start gap-4">

            {/* Alert Icon */}

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-sm font-bold text-red-600">
              !
            </div>

            {/* Product Information */}

            <div className="min-w-0 flex-1">

              <div className="flex items-start justify-between gap-3">

                <div className="min-w-0">

                  <p className="truncate text-sm font-semibold text-slate-900">
                    {item.name}
                  </p>

                  <p className="mt-1 text-xs font-medium text-slate-400">
                    SKU · {item.sku}
                  </p>

                </div>

                <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-red-700">
                  {severity}
                </span>

              </div>

              {/* Stock Numbers */}

              <div className="mt-4 flex items-end justify-between">

                <div>

                  <p className="text-xs font-medium text-slate-400">
                    Available stock
                  </p>

                  <p className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                    {item.quantity}

                    <span className="ml-1 text-xs font-medium text-slate-400">
                      units
                    </span>

                  </p>

                </div>

                <div className="text-right">

                  <p className="text-xs font-medium text-slate-400">
                    Alert threshold
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-600">
                    {item.low_stock_threshold} units
                  </p>

                </div>

              </div>

              {/* Stock Progress */}

              <div className="mt-3">

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">

                  <div
                    className="h-full rounded-full bg-red-500 transition-all duration-500"
                    style={{
                      width: `${stockPercentage}%`,
                    }}
                  />

                </div>

                <div className="mt-2 flex items-center justify-between">

                  <span className="text-[10px] font-medium text-red-600">
                    {Math.round(stockPercentage)}% of threshold
                  </span>

                  <span className="text-[10px] font-medium text-slate-400">
                    Needs attention
                  </span>

                </div>

              </div>

            </div>

          </div>

        </div>

      );

    })}

    {/* Empty State */}

    {!loading && lowStockItems.length === 0 && (

      <div className="px-6 py-12 text-center">

        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          ✓
        </div>

        <p className="mt-3 text-sm font-semibold text-slate-700">
          Inventory looks healthy
        </p>

        <p className="mt-1 text-xs text-slate-400">
          No products currently require restocking.
        </p>

      </div>

    )}

  </div>

</div>

                
        {/* AI Assistant */}

        <div className="mt-6 overflow-hidden rounded-2xl bg-slate-950 text-white shadow-sm">

          {/* AI Header */}

          <div className="border-b border-slate-800 px-6 py-5">

            <div className="flex items-center justify-between">

              <div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-lg">
                    ✦
                  </div>

                  <div>
                    <h3 className="font-semibold">
                      AI Operations Command Center
                    </h3>

                    <p className="mt-1 text-sm text-slate-400">
                      Ask KarobarOS to manage sales, inventory, orders, and business insights.
                    </p>
                  </div>
                </div>

              </div>

              <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                Online
              </div>

            </div>

          </div>
          {/* Agent Workflow */}

<div className="border-b border-slate-800 bg-slate-900/50 px-6 py-4">
  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
    Agent workflow
  </p>
  {activeAgent && (
  <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
    <p className="text-xs font-medium uppercase tracking-wider text-emerald-400">
      Agent activity
    </p>
    <p className="mt-1 text-sm font-medium text-emerald-300">
      {activeAgent} is working...
    </p>
  </div>
)}

  <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
    {[
      "Customer",
      "Orchestrator",
      "Sales Agent",
      "Inventory Agent",
      "Order Agent",
      "Human Approval",
    ].map((step, index) => {
      const isActive =
        activeAgent === step ||
        (step === "Customer" && activeAgent === "Orchestrator");

      return (
        <div
          key={step}
          className={`flex items-center gap-3 rounded-xl border px-3 py-3 transition-all ${
            isActive
              ? "border-emerald-400/40 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.08)]"
              : "border-slate-800 bg-slate-900/60"
          }`}
        >
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
              isActive
                ? "bg-emerald-500 text-slate-950"
                : "bg-slate-800 text-slate-500"
            }`}
          >
            {index + 1}
          </div>

          <div className="min-w-0">
            <p
              className={`text-xs font-semibold ${
                isActive ? "text-emerald-300" : "text-slate-300"
              }`}
            >
              {step}
            </p>

            <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-600">
              {isActive ? "Active" : "Workflow step"}
            </p>
          </div>
        </div>
      );
    })}
  </div>
</div>

          {/* Live Agent Activity */}

          <div className="border-b border-slate-800 bg-slate-950/40 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Live agent activity
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Real workflow events recorded by KarobarOS.
                </p>
              </div>

              <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-400">
                {agentActivities.length} events
              </span>
            </div>

            <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
              {agentActivities.length === 0 ? (
                <p className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-500">
                  No agent activity recorded yet.
                </p>
              ) : (
                agentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5"
                  >
                    <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-slate-200">
                          {activity.agent_name}
                        </span>

                        <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                          {activity.status}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-slate-400">
                        {activity.details || activity.action}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat */}

          <div className="p-6">

             {/* Example requests */}

<div className="rounded-xl bg-slate-900 p-4">

  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
    Example requests
  </p>

  <div className="mt-3 grid gap-3 sm:grid-cols-2">

    <button
      type="button"
      onClick={() =>
        setChatMessage(
          "Bhai 2 black T-shirts size L chahiye, Lahore delivery."
        )
      }
      className="rounded-xl bg-slate-800 p-4 text-left text-sm text-slate-300 transition hover:bg-slate-700"
    >
      “Bhai 2 black T-shirts size L chahiye, Lahore delivery.”
    </button>

    <button
      type="button"
      onClick={() =>
        setChatMessage(
          "Aaj ka business summary batao"
        )
      }
      className="rounded-xl bg-slate-800 p-4 text-left text-sm text-slate-300 transition hover:bg-slate-700"
    >
      “Aaj ka business summary batao”
    </button>

  </div>

</div>

            {/* AI response */}

            <div className="mt-4 rounded-xl bg-slate-900 p-4">

  <div className="flex items-center justify-between">
    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
      AI response
    </p>

    {restockRecommendation === null &&
      aiResponse.includes("restocked successfully") && (
        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
          ✓ Action completed
        </span>
      )}
  </div>

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

  </div>

      <section className="mt-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Customer History
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Recent orders and spending for the selected customer.
              </p>
            </div>

            <select
              value={selectedCustomerId}
              onChange={(event) =>
                setSelectedCustomerId(
                  Number(event.target.value)
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-slate-400"
            >
              {customers.map((customer) => (
                <option
                  key={customer.id}
                  value={customer.id}
                >
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          {customerHistory?.customer && (
            <div className="mt-5 rounded-xl bg-slate-50 p-4">
              <p className="font-medium text-slate-900">
                {customerHistory.customer.name}
              </p>
              <p className="text-sm text-slate-500">
                {customerHistory.customer.city}
              </p>
            </div>
          )}

          {customerHistory?.summary && (
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Total Orders</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {customerHistory.summary.total_orders}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Approved Orders</p>
                <p className="mt-1 text-2xl font-semibold text-emerald-600">
                  {customerHistory.summary.approved_orders}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Total Spent</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  Rs {customerHistory.summary.total_spent.toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {customerHistory?.orders?.length > 0 && (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="pb-3 font-medium">Order</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">City</th>
                    <th className="pb-3 font-medium">Invoice</th>
                  </tr>
                </thead>

                <tbody>
                  {customerHistory.orders.slice(0, 5).map(
                    (order: any) => (
                      <tr
                        key={order.order_id}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="py-3 font-medium text-slate-900">
                          {order.order_number}
                        </td>

                        <td className="py-3">
                          <span
                            className={
                              "rounded-full px-3 py-1 text-xs font-medium " +
                              (
                                order.status === "approved"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : order.status === "rejected"
                                    ? "bg-red-50 text-red-700"
                                    : "bg-amber-50 text-amber-700"
                              )
                            }
                          >
                            {order.status.replace("_", " ")}
                          </span>
                        </td>

                        <td className="py-3 text-slate-700">
                          Rs {order.total_amount.toLocaleString()}
                        </td>

                        <td className="py-3 text-slate-700">
                          {order.delivery_city}
                        </td>

                        <td className="py-3 text-slate-700">
                          {order.invoice_number || "—"}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </section>

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
  const icon =
    title === "Total Sales"
      ? "Rs"
      : title === "Orders"
      ? "#"
      : title === "Products"
      ? "P"
      : title === "Low Stock"
      ? "!"
      : title === "Avg. Order Value"
      ? "↗"
      : "%";

  return (
    <div
      className={
        "group relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md " +
        (alert
          ? "border-red-200/80 bg-gradient-to-br from-white to-red-50/50"
          : "border-slate-200")
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            {title}
          </p>

          <p
            className={
              "mt-3 text-2xl font-bold tracking-tight sm:text-3xl " +
              (alert ? "text-red-600" : "text-slate-950")
            }
          >
            {value}
          </p>
        </div>

        <div
          className={
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold " +
            (alert
              ? "bg-red-100 text-red-600"
              : "bg-slate-100 text-slate-700")
          }
        >
          {icon}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span
          className={
            "h-1.5 w-1.5 rounded-full " +
            (alert ? "bg-red-500" : "bg-emerald-500")
          }
        />

        <p className="text-xs font-medium text-slate-500">
          {description}
        </p>
      </div>

      <div className="absolute -bottom-10 -right-10 h-24 w-24 rounded-full bg-slate-100/70 blur-2xl transition-all duration-300 group-hover:bg-emerald-100/70" />
    </div>
  );
}
