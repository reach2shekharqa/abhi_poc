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


  console.log("Chart data:", data);


  if (data.length === 0) {
    return (
      <p>
        No data available
      </p>
    );
  }


  return (

    <div className="w-full">


      <h2 className="
        text-2xl
        font-bold
        mb-4
      ">
        Expense Analysis
      </h2>


      <div
        className="
          w-full
          h-[350px]
        "
      >

        <ResponsiveContainer
          width="100%"
          height="100%"
        >

          <PieChart>


            <Pie
              data={data}
              dataKey="amount"
              nameKey="category"
              cx="50%"
              cy="50%"
              outerRadius={110}
              label
              isAnimationActive={true}
              animationDuration={1200}
              animationBegin={200}
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



      <h2 className="
        text-2xl
        font-bold
        mb-4
        mt-8
      ">
        Category Comparison
      </h2>



      <div
        className="
          w-full
          h-[350px]
        "
      >

        <ResponsiveContainer
          width="100%"
          height="100%"
        >

          <BarChart
            data={data}
            margin={{
              top:20,
              right:20,
              left:0,
              bottom:40
            }}
          >

            <CartesianGrid />


            <XAxis
              dataKey="category"
              angle={-35}
              textAnchor="end"
              height={70}
            />


            <YAxis />


            <Tooltip />



            <Bar
              dataKey="amount"
              isAnimationActive={true}
              animationDuration={1200}
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


            </Bar>


          </BarChart>


        </ResponsiveContainer>


      </div>


    </div>

  );

}