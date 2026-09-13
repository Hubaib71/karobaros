export default function SuppliersPage() {
  const suppliers = [
    {
      name: "Lahore Textile Suppliers",
      category: "T-Shirts & Hoodies",
      status: "Active",
    },
    {
      name: "Karachi Fashion Wholesale",
      category: "Polo & Jeans",
      status: "Active",
    },
    {
      name: "Punjab Garments Hub",
      category: "General Clothing",
      status: "Active",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 p-6 sm:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Suppliers</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage suppliers and purchasing information.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-bold text-slate-900">
            Supplier Directory
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-5 py-3">Supplier</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>

            <tbody>
              {suppliers.map((supplier) => (
                <tr
                  key={supplier.name}
                  className="border-t border-slate-100"
                >
                  <td className="px-5 py-4 font-semibold text-slate-800">
                    {supplier.name}
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {supplier.category}
                  </td>

                  <td className="px-5 py-4">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                      {supplier.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}