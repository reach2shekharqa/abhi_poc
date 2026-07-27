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
        grid-cols-1
        sm:grid-cols-2
        lg:grid-cols-3
        gap-6
      ">


        {/* Total Amount */}

        <div className="
          bg-white/10
          backdrop-blur-xl
          border
          border-white/20
          rounded-3xl
          p-6
          shadow-2xl
          transition
          hover:scale-105
        ">

          <div className="text-4xl">
            💰
          </div>

          <p className="
            text-gray-300
            mt-4
          ">
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




        {/* Highest Category */}

        <div className="
          bg-white/10
          backdrop-blur-xl
          border
          border-white/20
          rounded-3xl
          p-6
          shadow-2xl
          transition
          hover:scale-105
        ">

          <div className="text-4xl">
            📊
          </div>


          <p className="
            text-gray-300
            mt-4
          ">
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




        {/* Categories */}

        <div className="
          bg-white/10
          backdrop-blur-xl
          border
          border-white/20
          rounded-3xl
          p-6
          shadow-2xl
          transition
          hover:scale-105
        ">


          <div className="text-4xl">
            📄
          </div>


          <p className="
            text-gray-300
            mt-4
          ">
            Categories Detected
          </p>


          <h3 className="
            text-3xl
            font-bold
            mt-2
          ">
            {data.length}
          </h3>


        </div>


      </div>





      {/* Charts Section */}

      <div className="
        bg-white/10
        backdrop-blur-xl
        border
        border-white/20
        rounded-3xl
        p-8
        shadow-2xl
        mt-8
      ">


        <Charts
          key={data.length}
          data={data}
        />


      </div>



    </div>

  );
}