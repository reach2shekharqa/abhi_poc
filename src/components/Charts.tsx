import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { DashboardSnapshot } from "../types";


interface Props {
  snapshot: DashboardSnapshot;
  unit: string;
}


const COLORS = [
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981"
];


export default function Charts({ snapshot, unit }: Props) {

  const effectiveUnit = unit && unit.toLowerCase() !== "unknown" ? unit : "₹";

  const formatMetric = (value: number) => {
    if (effectiveUnit && effectiveUnit !== "₹") {
      return `${value.toLocaleString()} ${effectiveUnit}`;
    }
    return `₹${value.toLocaleString()}`;
  };

  const hasAssetData = snapshot.assetBreakdown.some((item) => item.value > 0);
  const hasLiabilityData = snapshot.liabilityBreakdown.some((item) => item.value > 0);
  const hasCostData = snapshot.costBreakdown.some((item) => item.amount > 0);
  const hasSalesData = snapshot.salesTrend.some((item) => item.sales > 0);

  const hasAnyChartData = hasAssetData || hasLiabilityData || hasCostData || hasSalesData;

  return (

    <div className="grid gap-6 lg:grid-cols-2">

      {!hasAnyChartData ? (
        <div className="lg:col-span-2 rounded-3xl border border-white/15 bg-slate-950/50 p-6 text-center text-slate-300">
          <h2 className="text-xl font-semibold text-white">No chartable financial data found</h2>
          <p className="mt-3 text-sm">The uploaded PDF returned only a few metrics. The dashboard will still show revenue and net profit, but chart breakdowns may be empty until additional values are extracted.</p>
        </div>
      ) : null}

      <div className="rounded-3xl border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-xl">


        <h2 className="mb-4 text-2xl font-bold">
          Assets Breakdown
        </h2>


        <div
          style={{
            width: "100%",
            height: 320
          }}
        >

          <ResponsiveContainer
            width="100%"
            height={320}
          >

            <PieChart>


              <Pie
                data={snapshot.assetBreakdown}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >

                {
                  snapshot.assetBreakdown.map((entry, index) => (

                    <Cell
                      key={`${entry.name}-${index}`}
                      fill={
                        COLORS[index % COLORS.length]
                      }
                    />

                  ))
                }

              </Pie>


              <Tooltip
                formatter={(value: number) => formatMetric(value)}
              />

              <Legend />


            </PieChart>


          </ResponsiveContainer>


        </div>


      </div>



      <div className="rounded-3xl border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-xl">


        <h2 className="mb-4 text-2xl font-bold">
          Liabilities Breakdown
        </h2>


        <div
          style={{
            width: "100%",
            height: 320
          }}
        >

          <ResponsiveContainer
            width="100%"
            height={320}
          >

            <PieChart>


              <Pie
                data={snapshot.liabilityBreakdown}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >

                {
                  snapshot.liabilityBreakdown.map((entry, index) => (

                    <Cell
                      key={`${entry.name}-${index}`}
                      fill={
                        COLORS[index % COLORS.length]
                      }
                    />

                  ))
                }

              </Pie>


              <Tooltip
                formatter={(value: number) => formatMetric(value)}
              />

              <Legend />


            </PieChart>


          </ResponsiveContainer>


        </div>


      </div>



      <div className="rounded-3xl border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-xl">


        <h2 className="mb-4 text-2xl font-bold">
          Cost Components
        </h2>


        <div
          style={{
            width: "100%",
            height: 320
          }}
        >

          <ResponsiveContainer
            width="100%"
            height={320}
          >

            <PieChart>


              <Pie
                data={snapshot.costBreakdown}
                dataKey="amount"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >

                {
                  snapshot.costBreakdown.map((entry, index) => (

                    <Cell
                      key={`${entry.category}-${index}`}
                      fill={
                        COLORS[index % COLORS.length]
                      }
                    />

                  ))
                }

              </Pie>


              <Tooltip
                formatter={(value: number) => formatMetric(value)}
              />

              <Legend />


            </PieChart>


          </ResponsiveContainer>


        </div>


      </div>



      <div className="rounded-3xl border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-xl">


        <h2 className="mb-4 text-2xl font-bold">
          Sales Trend
        </h2>


        <div
          style={{
            width: "100%",
            height: 320
          }}
        >

          <ResponsiveContainer
            width="100%"
            height={320}
          >


            <LineChart

              data={snapshot.salesTrend}

              margin={{
                top: 20,
                right: 20,
                left: 10,
                bottom: 10
              }}

            >


              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#94a3b8"
              />


              <XAxis
                dataKey="period"
              />


              <YAxis />


              <Tooltip
                formatter={(value: number) => formatMetric(value)}
              />


              <Legend />


              <Line
                type="monotone"
                dataKey="sales"
                stroke="#22d3ee"
                strokeWidth={3}
                dot={{
                  r: 4
                }}
              />


            </LineChart>


          </ResponsiveContainer>


        </div>


      </div>


    </div>

  );

}