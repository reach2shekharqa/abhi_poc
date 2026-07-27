import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";

import type { ReportData } from "../parser/reportParser";


interface Props {
  data: ReportData[];
}


const COLORS = [
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981"
];


export default function Charts({ data }: Props) {


  if (data.length === 0) {
    return (
      <p>
        No data available
      </p>
    );
  }


  return (

    <div>

      <h2 className="text-2xl font-bold mb-4">
        Expense Analysis
      </h2>


      <div style={{ width: "100%", height: 350 }}>

        <ResponsiveContainer>

          <PieChart>

            <Pie
              data={data}
              dataKey="amount"
              nameKey="category"
              outerRadius={120}
              label
            >

              {
                data.map((_, index) => (
                  <Cell
                    key={index}
                    fill={
                      COLORS[index % COLORS.length]
                    }
                  />
                ))
              }

            </Pie>


            <Tooltip />

            <Legend />

          </PieChart>

        </ResponsiveContainer>

      </div>



      <h2 className="text-2xl font-bold mb-4 mt-8">
        Category Comparison
      </h2>


      <div style={{ width: "100%", height: 350 }}>

        <ResponsiveContainer>

          <BarChart data={data}>

            <CartesianGrid />

            <XAxis
              dataKey="category"
            />

            <YAxis />

            <Tooltip />

            <Bar
              dataKey="amount"
              fill="#06b6d4"
            />

          </BarChart>

        </ResponsiveContainer>

      </div>


    </div>

  );
}