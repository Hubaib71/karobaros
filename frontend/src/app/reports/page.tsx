"use client";

import { useEffect, useState } from "react";

type Intelligence = {
  summary: {
    total_sales: number;
    total_orders: number;
    average_order_value: number;
  };
  top_products: {
    product_id: number;
    product: string;
    sku: string;
    units: number;
    sales: number;
  }[];
  top_customers: {
    customer_id: number;
    customer: string;
    orders: number;
    spent: number;
  }[];
  insights: string[];
  recommendations: string[];
};

export default function ReportsPage() {
  const [data, setData] = useState<Intelligence | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadReports() {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/dashboard/sales-intelligence"
      );

      const result = await response.json();

      if (result.success) {
        setData(result);
      }
    } catch (error) {
      console.error("Reports error:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        Loading AI Business Intelligence...
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        No intelligence data available.
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 lg:p-10">
      <div className="mx-auto max-w-7xl">

        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
            AI Analytics
          </p>

          <h1 className="mt-2 text-3xl font-black text-slate-900">
            Business Intelligence
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            AI-powered insights to help you make smarter decisions.
          </p>
        </div>


        {/* Summary Cards */}

        <div className="grid gap-4 md:grid-cols-3">

          <Card
            title="Total Sales"
            value={`Rs. ${data.summary.total_sales.toLocaleString()}`}
          />

          <Card
            title="Approved Orders"
            value={data.summary.total_orders}
          />

          <Card
            title="Average Order Value"
            value={`Rs. ${data.summary.average_order_value.toLocaleString()}`}
          />

        </div>


        <div className="mt-6 grid gap-6 lg:grid-cols-2">


          {/* Products */}

          <section className="rounded-2xl border bg-white p-6 shadow-sm">

            <h2 className="text-lg font-black text-slate-900">
              🏆 Top Selling Products
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Products generating the most revenue
            </p>


            <div className="mt-5 space-y-3">

              {data.top_products.map((product,index)=>(

                <div
                  key={product.product_id}
                  className="flex items-center justify-between rounded-xl bg-slate-50 p-4"
                >

                  <div>
                    <p className="font-bold text-slate-900">
                      #{index+1} {product.product}
                    </p>

                    <p className="text-xs text-slate-400">
                      {product.units} units • {product.sku}
                    </p>
                  </div>


                  <p className="font-black text-emerald-600">
                    Rs. {product.sales.toLocaleString()}
                  </p>

                </div>

              ))}

            </div>

          </section>



          {/* Customers */}

          <section className="rounded-2xl border bg-white p-6 shadow-sm">

            <h2 className="text-lg font-black text-slate-900">
              👑 Top Customers
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Highest value customers
            </p>


            <div className="mt-5 space-y-3">

              {data.top_customers.map((customer,index)=>(

                <div
                  key={customer.customer_id}
                  className="flex items-center justify-between rounded-xl bg-slate-50 p-4"
                >

                  <div>
                    <p className="font-bold text-slate-900">
                      #{index+1} {customer.customer}
                    </p>

                    <p className="text-xs text-slate-400">
                      {customer.orders} orders
                    </p>
                  </div>


                  <p className="font-black text-blue-600">
                    Rs. {customer.spent.toLocaleString()}
                  </p>

                </div>

              ))}

            </div>

          </section>

        </div>



        {/* AI Insights */}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">


          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">

            <h2 className="font-black text-emerald-950">
              🤖 AI Insights
            </h2>


            <div className="mt-4 space-y-3">

              {data.insights.map((item,index)=>(

                <div
                  key={index}
                  className="rounded-xl bg-white p-4 text-sm text-emerald-900"
                >
                  {item}
                </div>

              ))}

            </div>

          </section>



          <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6">

            <h2 className="font-black text-blue-950">
              🎯 AI Recommendations
            </h2>


            <div className="mt-4 space-y-3">

              {data.recommendations.map((item,index)=>(

                <div
                  key={index}
                  className="rounded-xl bg-white p-4 text-sm text-blue-900"
                >
                  {item}
                </div>

              ))}

            </div>

          </section>


        </div>

      </div>
    </main>
  );
}


function Card({
  title,
  value,
}:{
  title:string;
  value:string|number;
}) {

  return (

    <div className="rounded-2xl border bg-white p-6 shadow-sm">

      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
        {title}
      </p>

      <p className="mt-3 text-2xl font-black text-slate-900">
        {value}
      </p>

    </div>

  );
}