"use client";

import { useEffect, useState, type ReactNode } from "react";

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

const lowStockItems = inventory.filter((item) => item.low_stock);
const salesMax = Math.max(...salesOverview.map((item) => item.sales), 1);
const salesPoints = salesOverview.map((item, index) => {
  const x = salesOverview.length <= 1 ? 50 : 4 + (index / (salesOverview.length - 1)) * 92;
  const y = 88 - (item.sales / salesMax) * 70;
  return `${x},${y}`;
}).join(" ");
const featuredOrder = orders.find((order) => order.invoice_number) || orders[0];

return (
  <main className="min-h-screen bg-[#f5f7fa] text-slate-900">
    <div className="flex min-h-screen">
      <aside className="hidden w-[220px] shrink-0 flex-col bg-[#0b1d2b] text-white md:flex">
        <div className="px-4 pt-4">
          <div className="flex items-center gap-3 rounded-2xl bg-white/[0.04] p-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 text-lg font-black">K</div>
            <div><h1 className="text-[17px] font-bold">KarobarOS</h1><p className="text-[9px] text-slate-400">Your Business. AI Powered.</p></div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-6">
          <p className="px-3 pb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">Workspace</p>
          {[["⌂","Dashboard",true],["◫","Orders",false],["▣","Inventory",false],["♙","Customers",false],["▤","Invoices",false],["◇","Suppliers",false],["◒","Reports",false]].map(([icon,label,active]) => <div key={String(label)} className={`mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] font-semibold ${active ? "bg-emerald-500 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5">{icon}</span>{label}</div>)}
        </nav>
        <div className="space-y-1 px-3 pb-4">
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] font-semibold text-slate-400"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5">⚙</span>Settings</div>
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] font-semibold text-slate-400"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5">↪</span>Logout</div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3"><div className="flex justify-between"><b className="text-[11px]">StyleHub PK</b><span className="h-2 w-2 rounded-full bg-emerald-400" /></div><p className="mt-1 text-[9px] text-slate-500">Clothing business</p></div>
        </div>
      </aside>

      <section className="min-w-0 flex-1">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden"><div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 font-bold text-white">K</span><b className="text-sm">KarobarOS</b></div><button className="rounded-lg border border-slate-200 px-3 py-2">☰</button></div>
        <header className="border-b border-slate-200 bg-white px-5 py-5 sm:px-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="text-[22px] font-bold tracking-tight sm:text-[25px]">Good Morning, Ahmed! 👋</h2><p className="mt-1 text-sm text-slate-500">Here's what's happening with your business today.</p></div><div className="flex items-center gap-2"><div className="hidden rounded-xl border border-slate-200 px-3 py-2 sm:block"><span className="text-[10px] text-slate-400">Business</span><p className="text-xs font-bold">ABC Fashion Store⌄</p></div><div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200">♧</div><div className="flex items-center gap-2 rounded-xl border border-slate-200 px-2 py-1.5"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0b1d2b] text-[10px] font-bold text-white">AH</span><div className="hidden sm:block"><b className="text-xs">Ahmed Khan</b><p className="text-[9px] text-slate-400">Owner</p></div>⌄</div></div></div>
        </header>

        <div className="space-y-5 p-4 sm:p-6 lg:p-7">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <DashboardKpi title="Total Sales (Today)" value={loading ? "..." : `Rs. ${summary?.total_sales?.toLocaleString() || "0"}`} meta="Approved sales" icon="▣" accent="emerald" />
            <DashboardKpi title="Total Orders" value={loading ? "..." : String(summary?.total_orders || 0)} meta={`${summary?.pending_orders || 0} pending approval`} icon="◇" accent="purple" />
            <DashboardKpi title="Inventory Items" value={loading ? "..." : String(summary?.total_products || 0)} meta={`${summary?.low_stock_items || 0} low-stock items`} icon="▣" accent="blue" />
            <DashboardKpi title="Pending Invoices" value={loading ? "..." : String(summary?.pending_orders || 0)} meta="Needs attention" icon="▤" accent="orange" warning />
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(240px,.9fr)_minmax(280px,1fr)]">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><h3 className="text-sm font-bold">Sales Overview</h3><p className="mt-1 text-[10px] text-slate-400">Approved sales over the last 7 days</p></div><button className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[9px] font-semibold">Last 7 days⌄</button></div><div className="mt-5 h-[205px]">{salesOverview.length ? <div className="relative h-full"><div className="absolute inset-0 space-y-[38px]">{[100,75,50,25,0].map(v=><div key={v} className="flex items-center gap-2"><span className="w-6 text-[8px] text-slate-400">{v}k</span><div className="h-px flex-1 bg-slate-100" /></div>)}</div><svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-x-7 bottom-7 top-1 h-[150px] w-[calc(100%-28px)]"><defs><linearGradient id="salesFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="currentColor" stopOpacity=".22"/><stop offset="100%" stopColor="currentColor" stopOpacity="0"/></linearGradient></defs><polyline points={`4,88 ${salesPoints} 96,88`} fill="url(#salesFill)" className="text-emerald-500"/><polyline points={salesPoints} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" className="text-emerald-500"/>{salesOverview.map((item,index)=>{const x=salesOverview.length<=1?50:4+(index/(salesOverview.length-1))*92;const y=88-(item.sales/salesMax)*70;return <circle key={item.date} cx={x} cy={y} r="1.6" className="fill-emerald-500"/>})}</svg><div className="absolute bottom-0 left-7 right-0 flex justify-between">{salesOverview.map(item=><span key={item.date} className="text-[8px] text-slate-400">{new Date(item.date+"T00:00:00").toLocaleDateString("en-US",{weekday:"short"})}</span>)}</div></div> : <div className="flex h-full items-center justify-center rounded-xl bg-slate-50 text-xs text-slate-400">No sales data available yet.</div>}</div></section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex justify-between"><div><h3 className="text-sm font-bold">Top Selling Products</h3><p className="mt-1 text-[10px] text-slate-400">Best performers</p></div><button className="text-[9px] font-bold text-sky-600">View all</button></div><div className="mt-4 space-y-2">{topProducts.slice(0,4).map((product,index)=><div key={product.sku} className="flex items-center gap-2.5 border-b border-slate-100 pb-2.5 last:border-0"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-sm">{["👕","👖","🧥","👔"][index]||"▣"}</span><div className="min-w-0 flex-1"><p className="truncate text-[10px] font-bold">{product.name}</p><p className="text-[8px] text-slate-400">{product.units_sold} units</p></div><span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[8px] font-bold">Rs. {product.sales.toLocaleString()}</span></div>)}{!topProducts.length&&<p className="py-8 text-center text-xs text-slate-400">No approved product sales yet.</p>}</div></section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex justify-between"><div><h3 className="text-sm font-bold">Recent Orders</h3><p className="mt-1 text-[10px] text-slate-400">Latest customer activity</p></div><button className="text-[9px] font-bold text-sky-600">View all</button></div><div className="mt-2 divide-y divide-slate-100">{orders.slice(0,5).map(order=><div key={order.id} className="flex items-center gap-2 py-2.5"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[8px] font-bold">{order.customer_name?.split(" ").map(x=>x[0]).slice(0,2).join("").toUpperCase()||"CU"}</span><div className="min-w-0 flex-1"><p className="text-[9px] font-bold">{order.order_number}</p><p className="truncate text-[8px] text-slate-400">{order.customer_name} · {order.delivery_city}</p><p className="text-[8px] font-bold">Rs. {order.total_amount.toLocaleString()}</p></div><div className="text-right"><StatusBadge status={order.status}/><p className="mt-1 text-[7px] text-slate-400">{new Date(order.created_at).toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})}</p></div></div>)}</div></section>
          </div>

          <section className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center"><div className="flex min-w-0 flex-1 items-center gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">🤖</div><div><h3 className="text-sm font-bold">KarobarOS AI Assistant</h3><p className="mt-1 text-[10px] text-slate-500">Manage your business with simple messages. Ask me anything!</p><div className="mt-2 flex flex-wrap gap-1.5">{[["Create new order","Bhai 2 black T-shirts size L chahiye, Lahore delivery."],["Check inventory","Which products are low in stock?"],["Generate invoice","Generate an invoice for my latest approved order."],["Daily report","Aaj ka business summary batao"],["Talk to supplier","Show me restock recommendations."]].map(([label,message])=><button key={label} type="button" onClick={()=>setChatMessage(message)} className="rounded-full bg-slate-50 px-2.5 py-1 text-[8px] font-semibold text-slate-600 ring-1 ring-slate-200">{label}</button>)}</div></div></div><div className="flex w-full gap-2 lg:max-w-[430px]"><input type="text" value={chatMessage} onChange={e=>setChatMessage(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")sendMessage()}} placeholder="Type your message..." className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs outline-none focus:border-emerald-300 focus:bg-white"/><button type="button" onClick={sendMessage} disabled={chatLoading||!chatMessage.trim()} className="h-11 w-11 shrink-0 rounded-xl bg-emerald-500 font-bold text-white disabled:opacity-50">➤</button></div></div>{aiResponse!=="Ask me about products, inventory, orders, or sales."&&<div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-700"><b className="mr-2 text-emerald-600">AI:</b>{aiResponse}</div>}{approvalMessage&&<div className="mt-2 rounded-xl bg-emerald-50 p-3 text-xs leading-5 text-black">{approvalMessage.split("\n").map((line,i)=><p key={i}>{line}</p>)}</div>}</section>

          <div className="grid gap-4 xl:grid-cols-4">
            <FeatureCard icon="🤖" title="AI Chat & Order Management" subtitle="Just send a message, and the AI will handle the rest."><div className="ml-5 rounded-xl rounded-tr-sm bg-emerald-500 p-2.5 text-[9px] leading-4 text-white">Bhai 2 black T-shirts chahiye, size L, Lahore delivery.</div><div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-[9px] font-bold">Order details extracted successfully!</p><div className="mt-2 space-y-1 text-[8px] text-slate-600"><p>Product: <b>Classic T-Shirt</b></p><p>Quantity: <b>2</b></p><p>Size: <b>L</b></p><p>Delivery: <b>Lahore</b></p><p>Price per unit: <b>Rs. 1,800</b></p><p>Total: <b>Rs. 3,600</b></p></div><div className="mt-2 rounded-lg bg-emerald-50 px-2 py-1.5 text-[8px] font-semibold text-emerald-700">✓ Live inventory check available</div></div><div className="mt-3 flex gap-2"><button type="button" onClick={()=>{const pending=orders.find(o=>o.status==="pending_approval");if(pending)approveOrder(pending.id)}} className="flex-1 rounded-lg bg-emerald-500 py-2 text-[8px] font-bold text-white">✓ Approve Order</button><button type="button" onClick={()=>setChatMessage("Bhai 2 black T-shirts size L chahiye, Lahore delivery.")} className="rounded-lg border border-slate-200 px-3 text-[8px] font-bold">Modify</button></div></FeatureCard>

            <FeatureCard icon="⚗" title="Inventory Management" subtitle="Track stock, get alerts, and auto-restock when needed.">{lowStockItems[0]?<div className="rounded-xl border border-red-100 bg-red-50 p-3"><p className="text-[9px] font-bold text-red-700">⚠ Low Stock Alert</p><p className="mt-1 text-[9px] text-red-600">{lowStockItems[0].name} is running low!</p><p className="mt-1 text-[8px] text-red-600">Only {lowStockItems[0].quantity} units left.</p><button type="button" onClick={()=>setRestockRecommendation({product_id:lowStockItems[0].product_id,product:lowStockItems[0].name,sku:lowStockItems[0].sku,current_quantity:lowStockItems[0].quantity,requested_quantity:lowStockItems[0].low_stock_threshold,shortage:Math.max(lowStockItems[0].low_stock_threshold-lowStockItems[0].quantity,0),recommended_quantity:lowStockItems[0].low_stock_threshold,reason:`Below threshold of ${lowStockItems[0].low_stock_threshold} units`})} className="mt-2 rounded-lg bg-emerald-500 px-2.5 py-1.5 text-[8px] font-bold text-white">Create Purchase Request →</button></div>:<div className="rounded-xl bg-emerald-50 p-3 text-[8px] font-bold text-emerald-700">✓ Inventory is healthy</div>}<div className="mt-3 overflow-hidden rounded-xl border border-slate-100"><div className="grid grid-cols-[1fr_40px_58px] bg-slate-50 px-2.5 py-2 text-[7px] font-bold uppercase text-slate-400"><span>Product</span><span>Stock</span><span>Status</span></div>{inventory.slice(0,5).map(item=><div key={item.product_id} className="grid grid-cols-[1fr_40px_58px] items-center border-t border-slate-100 px-2.5 py-2 text-[8px]"><span className="truncate font-semibold">{item.name}</span><b>{item.quantity}</b><StatusBadge status={item.low_stock?"low":"approved"}/></div>)}</div></FeatureCard>

            <FeatureCard icon="▤" title="Invoice Generation" subtitle="Create professional invoices automatically."><div className="rounded-xl border border-slate-200 p-3"><div className="flex justify-between border-b border-slate-100 pb-2"><div><p className="text-sm font-black">INVOICE</p><p className="text-[8px] font-bold text-emerald-600">{featuredOrder?.invoice_number||"Pending"}</p></div><span className="text-[8px] text-slate-400">KarobarOS</span></div><div className="py-3 text-[8px] text-slate-500"><b className="text-slate-800">ABC Fashion Store</b><p>Lahore, Pakistan</p><p className="mt-2"><b>Bill To:</b> {featuredOrder?.customer_name||"Customer"}</p></div><div className="rounded-lg bg-slate-50 p-2 text-[8px]"><div className="flex justify-between text-slate-400"><span>Order</span><b>Total</b></div><div className="mt-2 flex justify-between"><span>{featuredOrder?.order_number||"—"}</span><b>Rs. {featuredOrder?.total_amount?.toLocaleString()||"0"}</b></div></div><div className="mt-3 flex justify-between text-[10px] font-black"><span>Total</span><span>Rs. {featuredOrder?.total_amount?.toLocaleString()||"0"}</span></div></div><div className="mt-3 flex gap-2"><button type="button" disabled={!featuredOrder?.invoice_number} onClick={()=>featuredOrder&&downloadInvoice(featuredOrder.id)} className="flex-1 rounded-lg bg-emerald-500 py-2 text-[8px] font-bold text-white disabled:opacity-40">↓ Download PDF</button><button type="button" className="flex-1 rounded-lg border border-slate-200 py-2 text-[8px] font-bold">Send to Customer</button></div></FeatureCard>

            <FeatureCard icon="♧" title="AI Agents Working Together" subtitle="Multiple specialized agents handle your business."><div className="space-y-2">{[["◉","Customer Agent","Understands Hindi/Urdu/English"],["▣","Inventory Agent","Checks stock & manages inventory"],["◇","Sales Agent","Handles pricing & orders"],["▤","Invoice Agent","Creates invoices & receipts"],["♧","Supplier Agent","Manages purchase requests"],["✦","Business Analyst Agent","Reports & recommendations"]].map(([icon,name,desc])=><div key={name} className="flex items-center gap-2"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-xs text-emerald-600">{icon}</span><div className="min-w-0"><p className="text-[8px] font-bold">{name}</p><p className="truncate text-[7px] text-slate-400">{desc}</p></div></div>)}</div><div className="mt-3 rounded-xl bg-emerald-50 p-2.5 text-center text-[8px] font-bold text-emerald-700">Smart automation. Better decisions. More growth.</div></FeatureCard>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,.7fr)]">
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h3 className="text-sm font-bold">Recent Orders</h3><p className="mt-1 text-[9px] text-slate-400">Latest orders and approval activity</p></div><span className="rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-bold text-emerald-700">● Live</span></div><div className="overflow-x-auto"><table className="w-full min-w-[740px] text-left"><thead className="bg-slate-50"><tr>{["Order","Customer","City","Amount","Invoice","Status","Action"].map(h=><th key={h} className="px-3 py-2 text-[7px] font-bold uppercase tracking-wider text-slate-400">{h}</th>)}</tr></thead><tbody>{orders.slice(0,8).map(order=><tr key={order.id} className="border-t border-slate-100"><td className="px-3 py-3 text-[9px] font-bold">{order.order_number}<span className="block text-[7px] font-normal text-slate-400">#{order.id}</span></td><td className="px-3 py-3 text-[9px]">{order.customer_name}</td><td className="px-3 py-3 text-[8px]">{order.delivery_city}</td><td className="px-3 py-3 text-[9px] font-bold">Rs. {order.total_amount.toLocaleString()}</td><td className="px-3 py-3">{order.invoice_number?<div className="flex gap-1"><span className="rounded bg-slate-50 px-1.5 py-1 text-[7px]">{order.invoice_number}</span>{order.status==="approved"&&<button type="button" onClick={()=>downloadInvoice(order.id)} className="rounded border px-1.5 py-1 text-[7px]">PDF</button>}</div>:<span className="text-[7px] text-slate-300">—</span>}</td><td className="px-3 py-3"><StatusBadge status={order.status}/></td><td className="px-3 py-3">{order.status==="pending_approval"?<div className="flex gap-1"><button type="button" onClick={()=>approveOrder(order.id)} disabled={approvingOrderId!==null||rejectingOrderId!==null} className="rounded bg-emerald-500 px-2 py-1.5 text-[7px] font-bold text-white disabled:opacity-50">{approvingOrderId===order.id?"...":"Approve"}</button><button type="button" onClick={()=>rejectOrder(order.id)} disabled={approvingOrderId!==null||rejectingOrderId!==null} className="rounded border border-red-200 bg-red-50 px-2 py-1.5 text-[7px] font-bold text-red-600">{rejectingOrderId===order.id?"...":"Reject"}</button></div>:<span className="text-[7px] text-slate-300">Completed</span>}</td></tr>)}</tbody></table></div></section>
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h3 className="text-sm font-bold">Low Stock Alerts</h3><p className="mt-1 text-[9px] text-slate-400">Inventory requiring attention</p></div><span className="rounded-full bg-red-50 px-2 py-1 text-[8px] font-bold text-red-600">{lowStockItems.length} alerts</span></div>{lowStockItems.map(item=><div key={item.product_id} className="border-b border-slate-100 p-4"><div className="flex justify-between"><div><p className="text-[9px] font-bold">{item.name}</p><p className="text-[7px] text-slate-400">{item.sku}</p></div><span className="rounded-full bg-red-50 px-1.5 py-1 text-[7px] font-bold text-red-600">CRITICAL</span></div><div className="mt-3 flex justify-between"><span><small className="block text-[7px] text-slate-400">Available stock</small><b className="text-lg">{item.quantity}</b></span><span className="text-right"><small className="block text-[7px] text-slate-400">Threshold</small><b className="text-[9px]">{item.low_stock_threshold}</b></span></div><div className="mt-2 h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-red-500" style={{width:`${Math.min((item.quantity/Math.max(item.low_stock_threshold,1))*100,100)}%`}}/></div></div>)}{!lowStockItems.length&&<p className="p-8 text-center text-xs text-slate-400">Inventory looks healthy.</p>}</section>
          </div>

          <section className="rounded-2xl bg-[#0c1b2a] p-5 text-white shadow-sm"><div className="flex items-center justify-between"><div><h3 className="text-sm font-bold">✦ AI Operations Command Center</h3><p className="mt-1 text-[9px] text-slate-400">Real workflow events recorded by KarobarOS.</p></div><span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[8px] font-bold text-emerald-400">{agentActivities.length} events</span></div><div className="mt-4 grid gap-4 lg:grid-cols-2"><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{["Customer","Orchestrator","Sales Agent","Inventory Agent","Order Agent","Human Approval"].map((step,i)=><div key={step} className={`rounded-xl border p-2.5 ${activeAgent===step?"border-emerald-400/30 bg-emerald-500/10":"border-white/10 bg-white/[0.03]"}`}><span className="mr-2 text-[8px] text-emerald-400">{i+1}</span><span className="text-[8px] font-semibold text-slate-300">{step}</span></div>)}</div><div className="max-h-28 space-y-1.5 overflow-y-auto">{agentActivities.slice(0,6).map(a=><div key={a.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-2"><p className="text-[8px] font-semibold text-slate-300">● {a.agent_name} <span className="text-slate-500">{a.status}</span></p><p className="mt-1 truncate text-[7px] text-slate-500">{a.details||a.action}</p></div>)}</div></div></section>

          <div className="grid gap-4 xl:grid-cols-[.9fr_1.5fr]"><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="text-sm font-bold">Daily Business Report</h3><p className="mt-1 text-[9px] text-slate-400">Live summary from KarobarOS</p><div className="mt-4 grid grid-cols-2 gap-2"><MiniMetric label="Revenue" value={`Rs. ${summary?.total_sales?.toLocaleString()||"0"}`}/><MiniMetric label="Orders" value={String(summary?.total_orders||0)}/><MiniMetric label="Best Selling" value={topProducts[0]?.name||"—"}/><MiniMetric label="Low Stock" value={`${lowStockItems.length} items`}/></div><div className="mt-3 rounded-xl bg-amber-50 p-3 text-[8px] font-semibold text-amber-700">{lowStockItems[0]?`Recommendation: restock ${lowStockItems[0].name}.`:"Inventory is currently healthy."}</div></section><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><h3 className="text-sm font-bold">Customer History</h3><p className="mt-1 text-[9px] text-slate-400">Recent orders and spending for the selected customer</p></div><select value={selectedCustomerId} onChange={e=>setSelectedCustomerId(Number(e.target.value))} className="rounded-lg border border-slate-200 px-2.5 py-2 text-[9px] font-semibold">{customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>{customerHistory?.summary&&<div className="mt-3 grid grid-cols-3 gap-2"><MiniMetric label="Total Orders" value={String(customerHistory.summary.total_orders)}/><MiniMetric label="Approved" value={String(customerHistory.summary.approved_orders)}/><MiniMetric label="Total Spent" value={`Rs ${customerHistory.summary.total_spent.toLocaleString()}`}/></div>}{customerHistory?.orders?.length>0&&<div className="mt-3 overflow-x-auto"><table className="w-full min-w-[560px] text-left"><thead><tr className="border-b border-slate-100">{["Order","Status","Amount","City","Invoice"].map(h=><th key={h} className="pb-2 text-[7px] font-bold uppercase text-slate-400">{h}</th>)}</tr></thead><tbody>{customerHistory.orders.slice(0,5).map((o:any)=><tr key={o.order_id} className="border-b border-slate-100"><td className="py-2 text-[8px] font-bold">{o.order_number}</td><td className="py-2"><StatusBadge status={o.status}/></td><td className="py-2 text-[8px]">Rs {o.total_amount.toLocaleString()}</td><td className="py-2 text-[8px]">{o.delivery_city}</td><td className="py-2 text-[8px]">{o.invoice_number||"—"}</td></tr>)}</tbody></table></div>}</section></div>
        </div>
      </section>
    </div>
  </main>
);
}

function DashboardKpi({ title, value, meta, icon, accent, warning=false }: { title:string; value:string; meta:string; icon:string; accent:"emerald"|"purple"|"blue"|"orange"; warning?:boolean }) {
  const tone={emerald:"bg-emerald-50 text-emerald-600",purple:"bg-violet-50 text-violet-600",blue:"bg-sky-50 text-sky-600",orange:"bg-orange-50 text-orange-600"}[accent];
  return <div className={`rounded-xl border bg-white p-4 shadow-sm ${warning?"border-orange-100":"border-slate-200"}`}><div className="flex items-start justify-between"><div><p className="text-[9px] font-semibold text-slate-400">{title}</p><p className="mt-2 text-[20px] font-black tracking-tight">{value}</p></div><span className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm ${tone}`}>{icon}</span></div><p className={`mt-2 text-[9px] font-semibold ${warning?"text-orange-500":"text-slate-400"}`}>{meta}</p></div>;
}
function FeatureCard({ icon, title, subtitle, children }: { icon:string; title:string; subtitle:string; children:ReactNode }) { return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-4 py-3.5"><div className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-sm text-emerald-600">{icon}</span><div><h3 className="text-[10px] font-bold">{title}</h3><p className="mt-0.5 text-[8px] text-slate-400">{subtitle}</p></div></div></div><div className="p-4">{children}</div></section>; }
function StatusBadge({ status }: { status:string }) { const s=status.toLowerCase(); const label=s==="pending_approval"?"Pending":s==="approved"?"Approved":s==="rejected"?"Rejected":s==="low"?"Low Stock":s; const cls=s==="approved"?"bg-emerald-50 text-emerald-700":s==="rejected"?"bg-red-50 text-red-700":s==="low"?"bg-orange-50 text-orange-600":"bg-amber-50 text-amber-700"; return <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-[7px] font-bold ${cls}`}>{label}</span>; }
function MiniMetric({ label, value }: { label:string; value:string }) { return <div className="rounded-xl bg-slate-50 p-3"><p className="text-[8px] text-slate-400">{label}</p><p className="mt-1 truncate text-[12px] font-black">{value}</p></div>; }
