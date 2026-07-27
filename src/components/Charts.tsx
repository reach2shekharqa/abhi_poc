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

      <h2>
        Expense Analysis
      </h2>


      <div style={{ width:"100%", height:350 }}>

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
                data.map(
                  (_, index) => (
                    <Cell key={index}/>
                  )
                )
              }

            </Pie>

            <Tooltip />

            <Legend />

          </PieChart>

        </ResponsiveContainer>

      </div>



      <h2>
        Category Comparison
      </h2>


      <div style={{ width:"100%", height:350 }}>

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
            />

          </BarChart>

        </ResponsiveContainer>

      </div>


    </div>
  );
}