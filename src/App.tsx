import { useState } from "react";

import PdfUploader from "./components/PdfUploader";
import Dashboard from "./components/Dashboard";

import type { ReportData } from "./parser/reportParser";


function App() {

  const [data, setData] = useState<ReportData[]>([]);


  return (

    <div className="
      min-h-screen
      w-full
      overflow-x-hidden
      px-4
      py-6
      sm:px-6
      lg:px-10
    ">


      <div className="
        max-w-7xl
        w-full
        mx-auto
      ">


        <h1 className="
          text-3xl
          sm:text-5xl
          font-bold
          text-center
          mb-4
          bg-gradient-to-r
          from-cyan-400
          to-blue-500
          text-transparent
          bg-clip-text
        ">
          PDF Analytics
        </h1>



        <p className="
          text-center
          text-gray-300
          mb-8
          px-2
        ">
          Upload any PDF and convert it into visual insights
        </p>




        <div className="
          w-full
          max-w-3xl
          mx-auto
          bg-white/10
          backdrop-blur-xl
          rounded-3xl
          p-4
          sm:p-8
          shadow-2xl
          border
          border-white/20
        ">


          <PdfUploader
            onDataExtracted={setData}
          />


        </div>





        {
          data.length > 0 &&

          <div className="
            mt-8
            w-full
          ">

            <Dashboard
              data={data}
            />

          </div>
        }



      </div>


    </div>

  );
}


export default App;