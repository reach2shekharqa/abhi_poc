import Charts from "./Charts";
import type { ReportData } from "../parser/reportParser";


interface Props {
  data: ReportData[];
}


export default function Dashboard({
  data
}: Props) {


  const totalAmount = data.reduce(
    (sum, item) => sum + item.amount,
    0
  );


  const highestExpense = data.reduce(
    (max, item) =>
      item.amount > max.amount ? item : max,
    {
      category: "None",
      amount: 0
    }
  );


  return (

    <div className="space-y-8">


      <h2 className="
        text-3xl
        font-bold
      ">
        Analytics Overview
      </h2>



      <div className="
        grid
        md:grid-cols-3
        gap-6
      ">


        {/* Total */}

        <div className="
          bg-white/10
          backdrop-blur-xl
          border
          border-white/20
          rounded-3xl
          p-6
          shadow-xl
          hover:scale-105
          transition
        ">

          <div className="text-4xl">
            💰
          </div>

          <p className="text-gray-300 mt-4">
            Total Amount
          </p>

          <h3 className="
            text-3xl
            font-bold
            mt-2
          ">
            ₹ {totalAmount.toLocaleString()}
          </h3>

        </div>




        {/* Highest */}

        <div className="
          bg-white/10
          backdrop-blur-xl
          border
          border-white/20
          rounded-3xl
          p-6
          shadow-xl
          hover:scale-105
          transition
        ">

          <div className="text-4xl">
            📊
          </div>


          <p className="text-gray-300 mt-4">
            Highest Category
          </p>


          <h3 className="
            text-2xl
            font-bold
            mt-2
          ">
            {highestExpense.category}
          </h3>


          <p className="
            text-cyan-300
            mt-1
          ">
            ₹ {highestExpense.amount.toLocaleString()}
          </p>


        </div>




        {/* Records */}

        <div className="
  bg-white/10
  backdrop-blur-xl
  border
  border-white/20
  rounded-3xl
  p-6
  shadow-xl
">


  <div className="
    text-green-400
    text-xl
    mb-4
  ">
    Records loaded: {data.length}
  </div>


  <Charts
    key={data.length}
    data={data}
  />


</div>


      </div>




      <div className="
        bg-white/10
        backdrop-blur-xl
        border
        border-white/20
        rounded-3xl
        p-6
        shadow-xl
      ">

        <Charts
          data={data}
        />

      </div>



    </div>

  );
}