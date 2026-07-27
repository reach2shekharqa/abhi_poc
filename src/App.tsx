import { useState } from "react";

import PdfUploader from "./components/PdfUploader";
import Dashboard from "./components/Dashboard";

import type { ReportData } from "./parser/reportParser";


function App() {

  const [data,setData] =
    useState<ReportData[]>([]);


  return (

    <div className="
      min-h-screen
      p-8
    ">


      <div className="
        max-w-6xl
        mx-auto
      ">


        <h1 className="
          text-5xl
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
          mb-10
        ">
          Upload any PDF and convert it into visual insights
        </p>



        <div className="
          bg-white/10
          backdrop-blur-xl
          rounded-3xl
          p-8
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
          <div className="mt-10">

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