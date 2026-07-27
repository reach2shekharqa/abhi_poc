import { useState } from "react";

import { extractPdfText } from "../services/pdfExtractor";
import { parseReport } from "../parser/reportParser";

import type { ReportData } from "../parser/reportParser";


interface Props {
  onDataExtracted: (data: ReportData[]) => void;
}


export default function PdfUploader({
  onDataExtracted
}: Props) {

  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");



  async function processFile(file: File) {

    setLoading(true);
    setFileName(file.name);


    try {

      const text =
        await extractPdfText(file);


      const data =
        parseReport(text);


      console.log("Extracted Text:", text);
      console.log("Parsed Data:", data);


      onDataExtracted(data);


    } catch(error) {

      console.error(
        "PDF processing failed",
        error
      );

    }


    setLoading(false);
  }



  function handleUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {

    const file =
      event.target.files?.[0];


    if(file) {
      processFile(file);
    }

  }



  return (

    <div className="text-center">


      <label
        htmlFor="pdf-upload"
        className="
          cursor-pointer
          block
          border-2
          border-dashed
          border-cyan-400/50
          rounded-3xl
          p-10
          hover:bg-white/10
          transition
        "
      >


        <div className="
          text-5xl
          mb-4
        ">
          📄
        </div>


        <h2 className="
          text-2xl
          font-semibold
        ">
          Upload PDF Report
        </h2>


        <p className="
          text-gray-300
          mt-2
        ">
          Drag & drop your PDF or click to browse
        </p>


        <div className="
          mt-6
          inline-block
          bg-gradient-to-r
          from-cyan-500
          to-blue-600
          px-8
          py-3
          rounded-full
          font-semibold
          shadow-lg
        ">
          Select PDF
        </div>


        <input
          id="pdf-upload"
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleUpload}
        />


      </label>



      {
        fileName &&
        <div className="
          mt-4
          text-green-400
        ">
          ✅ {fileName}
        </div>
      }



      {
        loading &&
        <div className="
          mt-4
          text-cyan-300
        ">
          🔄 Analyzing PDF...
        </div>
      }


    </div>

  );
}