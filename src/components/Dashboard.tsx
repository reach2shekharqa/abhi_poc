import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import Charts from "./Charts";

import type { DashboardSnapshot } from "../types";


interface Props {
  snapshot: DashboardSnapshot;
  unit: string;
  entityOptions: Array<{ id: string; name: string }>;
  selectedEntityId: string;
  selectedYear: number;
  onEntityChange: (value: string) => void;
  onYearChange: (value: number) => void;
}

const inventoryColors = ["#06b6d4", "#8b5cf6", "#10b981"];

export default function Dashboard({
  snapshot,
  unit,
  entityOptions,
  selectedEntityId,
  selectedYear,
  onEntityChange,
  onYearChange,
}: Props) {

  const inventoryTotal = snapshot.inventorySnapshot.rawMaterial + snapshot.inventorySnapshot.workInProgress + snapshot.inventorySnapshot.finishedGoods;
  const assetTotal = snapshot.assetBreakdown.reduce((sum, item) => sum + item.value, 0);
  const liabilityTotal = snapshot.liabilityBreakdown.reduce((sum, item) => sum + item.value, 0);
  const costTotal = snapshot.costBreakdown.reduce((sum, item) => sum + item.amount, 0);


  const inventoryData = [
    { name: "Raw Material", value: snapshot.inventorySnapshot.rawMaterial },
    { name: "Work in Progress", value: snapshot.inventorySnapshot.workInProgress },
    { name: "Finished Goods", value: snapshot.inventorySnapshot.finishedGoods },
  ];

  const formatMetric = (value: number) => {
    if (unit && unit !== "₹") {
      return `${value.toLocaleString()} ${unit}`;
    }
    return `₹${value.toLocaleString()}`;
  };


  return (

    <div className="space-y-8">


      <div className="rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">


        <div className="mb-4 flex flex-wrap gap-3">


          <select
            className="rounded-2xl border border-white/20 bg-slate-950/40 px-4 py-3"
            value={selectedEntityId}
            onChange={(event) => onEntityChange(event.target.value)}
          >
            {entityOptions.map((entity) => (
              <option key={entity.id} value={entity.id}>{entity.name}</option>
            ))}
          </select>


          <select
            className="rounded-2xl border border-white/20 bg-slate-950/40 px-4 py-3"
            value={selectedYear}
            onChange={(event) => onYearChange(Number(event.target.value))}
          >
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
          </select>

        </div>


        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">


          <div className="rounded-2xl bg-slate-950/40 p-4">
            <p className="text-sm text-slate-300">Sales Trend Points</p>
            <p className="mt-2 text-3xl font-bold">{snapshot.salesTrend.length}</p>
          </div>


          <div className="rounded-2xl bg-slate-950/40 p-4">
            <p className="text-sm text-slate-300">Latest Revenue</p>
            <p className="mt-2 text-3xl font-bold">{formatMetric(snapshot.salesTrend[snapshot.salesTrend.length - 1]?.sales ?? 0)}</p>
          </div>


          <div className="rounded-2xl bg-slate-950/40 p-4">
            <p className="text-sm text-slate-300">Inventory Snapshot</p>
            <p className="mt-2 text-3xl font-bold">{formatMetric(inventoryTotal)}</p>
          </div>


          <div className="rounded-2xl bg-slate-950/40 p-4">
            <p className="text-sm text-slate-300">Asset Total</p>
            <p className="mt-2 text-3xl font-bold">{formatMetric(assetTotal)}</p>
          </div>


          <div className="rounded-2xl bg-slate-950/40 p-4">
            <p className="text-sm text-slate-300">Liability Total</p>
            <p className="mt-2 text-3xl font-bold">{formatMetric(liabilityTotal)}</p>
          </div>

        </div>


        <div className="mt-6 grid gap-6 lg:grid-cols-2">


          <div className="rounded-2xl bg-slate-950/40 p-4">
            <h3 className="text-lg font-semibold">Inventory Snapshot</h3>
            <div style={{ width: "100%", height: 320 }} className="mt-4">
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={inventoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={90}
                    label
                  >
                    {inventoryData.map((entry, index) => (
                      <Cell key={`${entry.name}-${index}`} fill={inventoryColors[index % inventoryColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatMetric(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>


          <div className="rounded-2xl bg-slate-950/40 p-4">
            <h3 className="text-lg font-semibold">Financial Summary</h3>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span>Total Cost Components</span><span>{formatMetric(costTotal)}</span></div>
              <div className="flex justify-between"><span>Asset Total</span><span>{formatMetric(assetTotal)}</span></div>
              <div className="flex justify-between"><span>Liability Total</span><span>{formatMetric(liabilityTotal)}</span></div>
            </div>
          </div>

        </div>

      </div>



      <Charts snapshot={snapshot} unit={unit} />


    </div>

  );
}