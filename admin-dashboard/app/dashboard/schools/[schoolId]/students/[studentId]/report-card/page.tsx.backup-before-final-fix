"use client";

import { use, useEffect, useState, useRef } from "react";
import Image from "next/image";
import api from "@/lib/api";

type Subject = {
  name: string;
  ca: number;
  exam: number;
  total: number;
  grade: string | null;
  remark: string | null;
};

type Report = {
  id?: string;
  session?: string;
  term?: string;
  date_printed?: string;
  student: {
    name: string;
    admission_number: string;
    passport: string | null;
    class: string | null;
  };
  school: {
    name: string;
    logo: string | null;
    motto: string | null;
    primary_color?: string | null;
    accent_color?: string | null;
  };
  subjects: Subject[];
  total: number;
  average: number;
  position: number | null;
  attendance: number;
  remark: string;
  comments: {
    teacher: string | null;
    principal: string | null;
  };
};

export default function ReportCardPage({
  params,
}: {
  params: Promise<{
    schoolId: string;
    studentId: string;
  }>;
}) {
  const { studentId } = use(params);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
  
  // Create a ref to target exactly what we want to clone and print
  const printAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get(`/results/student/${studentId}/report`);
        setReport(res.data);
      } catch (error) {
        console.error("Report loading failed", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [studentId]);

  const handlePrint = () => {
    if (!printAreaRef.current || !report) return;

    setPrinting(true);

    // 1. Extract the styling properties to carry over dynamically
    const primary = report.school.primary_color || "#1e3a8a";
    const accent = report.school.accent_color || "#b45309";

    // 2. Open a completely pristine browser window tab context
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to generate and print the report card.");
      setPrinting(false);
      return;
    }

    // 3. Grab Tailwind and custom inline styles currently active on the page
    let styleTagsHtml = "";
    document.querySelectorAll("style, link[rel='stylesheet']").forEach((el) => {
      styleTagsHtml += el.outerHTML;
    });

    // 4. Extract *only* the inner content of our report card component
    const reportHtml = printAreaRef.current.innerHTML;

    // 5. Construct a pure, layout-less document structure inside the new window
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Report Card - ${report.student.name}</title>
          ${styleTagsHtml}
          <style>
            @media print {
              @page {
                size: A4 portrait;
                margin: 0;
              }
              html, body {
                background-color: #ffffff !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                margin: 0 !important;
                padding: 0 !important;
              }
            }
            body {
              background: #ffffff !important;
              padding: 2rem !important;
              font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
            }
          </style>
        </head>
        <body style="--school-brand: ${primary}; --school-accent: ${accent};">
          <div style="border-color: ${primary}; max-w: none; width: 100%; box-shadow: none; margin: 0;">
            ${reportHtml}
          </div>
          <script>
            // Allow asynchronous assets (images/fonts) a brief window to confirm layout hydration
            window.addEventListener('load', () => {
              setTimeout(() => {
                window.print();
                window.close();
              }, 300);
            });
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
    setPrinting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f1ea] font-serif text-slate-700">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-slate-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="tracking-widest text-sm uppercase">Retrieving Academic Record...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f1ea] font-serif p-6">
        <div className="border border-slate-300 bg-white p-8 max-w-md text-center shadow-md">
          <h2 className="text-xl font-bold text-red-800 uppercase tracking-wider">Record Not Found</h2>
          <p className="text-slate-600 mt-2 text-sm">The requested terminal report transcript could not be located.</p>
        </div>
      </div>
    );
  }

  const primary = report.school.primary_color || "#1e3a8a";
  const accent = report.school.accent_color || "#b45309";
  const currentPrintDate = report.date_printed || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div 
      className="min-h-screen bg-[#f4f1ea] py-12 px-4 sm:px-6"
      style={{ 
        "--school-brand": primary,
        "--school-accent": accent 
      } as React.CSSProperties}
    >
      {/* THE ISOLATED REPORT CARD GRID WRAPPER */}
      <div 
        ref={printAreaRef}
        className="max-w-4xl mx-auto bg-[#fffdf9] text-slate-900 shadow-[0_0_25px_rgba(0,0,0,0.08)] p-8 sm:p-12 font-serif relative border-[12px] border-double box-border flex flex-col justify-between transition-all"
        style={{ borderColor: primary }}
      >
        
        {/* TRADITIONAL GEOMETRIC CORNER FLOURISHES */}
        <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 opacity-40" style={{ borderColor: primary }}></div>
        <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 opacity-40" style={{ borderColor: primary }}></div>
        <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 opacity-40" style={{ borderColor: primary }}></div>
        <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 opacity-40" style={{ borderColor: primary }}></div>

        {/* BACKGROUND BRANDING WATERMARK */}
        {report.school.logo && (
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center select-none">
            <Image
              src={report.school.logo}
              alt=""
              width={450}
              height={450}
              style={{ width: 'auto', height: 'auto' }}
              className="object-contain grayscale"
              unoptimized
            />
          </div>
        )}

        {/* DATA CONTAINER */}
        <div className="w-full flex flex-col justify-between">
          
          {/* HEADER SECTION */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-b-2 pb-4 gap-4" style={{ borderColor: primary }}>
            <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-5">
              {report.school.logo && (
                <div className="p-1.5 bg-white border border-slate-200 shadow-sm rounded-sm">
                  <Image
                    src={report.school.logo}
                    alt="School Crest"
                    width={90}
                    height={90}
                    className="object-contain"
                    priority
                    unoptimized
                  />
                </div>
              )}
              <div>
                <h1 
                  className="text-2xl sm:text-3xl font-black tracking-wide uppercase leading-tight"
                  style={{ color: primary }}
                >
                  {report.school.name}
                </h1>
                {report.school.motto && (
                  <p className="italic text-slate-600 text-sm mt-1.5 font-sans relative pl-4">
                    <span
                      className="absolute left-0 top-1 bottom-1 w-[3px]"
                      style={{ backgroundColor: accent }}
                    />
                    {report.school.motto}
                  </p>
                )}
              </div>
            </div>
            
            <div className="text-center sm:text-right sm:border-l sm:pl-6 border-slate-300 min-w-[140px]">
              <span className="text-xs font-sans uppercase tracking-widest font-bold block" style={{ color: accent }}>Official Record</span>
              <h2 className="text-lg font-bold tracking-tight text-slate-800 uppercase mt-0.5">Transcript</h2>
            </div>
          </div>

          {/* METADATA SYSTEM SUB-BAR */}
          <div className="grid grid-cols-3 gap-4 pt-2 pb-2 border-b text-xs font-sans uppercase tracking-wider text-slate-600 border-slate-200 text-center sm:text-left">
            <div><b>Session:</b> <span className="font-serif normal-case font-bold text-slate-800">{report.session || "—"}</span></div>
            <div className="text-center"><b>Term:</b> <span className="font-serif normal-case font-bold text-slate-800">{report.term || "—"}</span></div>
            <div className="text-right"><b>Date Issued:</b> <span className="font-serif normal-case font-bold text-slate-800">{currentPrintDate}</span></div>
          </div>

          {/* DOCUMENT TITLE BAR */}
          <div className="text-center my-4">
            <div className="border-y border-slate-300 py-1 bg-slate-50/70">
              <h2 className="text-base font-bold tracking-[0.2em] uppercase" style={{ color: primary }}>
                Terminal Report Card
              </h2>
            </div>
          </div>

          {/* STUDENT BIO MATRIX SECTION */}
          <div className="grid grid-cols-4 gap-4 bg-[#faf8f5] border border-slate-200 p-4 rounded-xs">
            <div className="flex justify-center items-center border-r border-slate-200 pr-4">
              {report.student.passport ? (
                <div className="border-[4px] border-white shadow-md p-0.5 bg-white">
                  <Image
                    src={`http://localhost:8000${report.student.passport}`}
                    alt={report.student.name}
                    width={105}
                    height={105}
                unoptimized
                    className="object-cover sepia-[15%] contrast-[105%]"
                    style={{ width: "105px", height: "auto" }}
                  />
                </div>
              ) : (
                <div className="w-[105px] h-[105px] bg-slate-100 border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 text-xs text-center p-2 font-sans">
                  <span>Photo Archive</span>
                </div>
              )}
            </div>

            <div className="col-span-3 grid grid-cols-2 gap-x-6 gap-y-3 text-sm self-center font-sans">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">Student's Full Name</span>
                <span className="font-serif font-bold text-base text-slate-900">{report.student.name}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">Admission Reference</span>
                <span className="font-mono font-bold text-base" style={{ color: primary }}>{report.student.admission_number}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">Class Assignation</span>
                <span className="font-serif font-bold text-slate-800 text-base">{report.student.class || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">Session Attendance Rate</span>
                <span className="font-serif font-bold text-slate-800 text-base">{report.attendance}% of academic days</span>
              </div>
            </div>
          </div>

          {/* ACADEMIC PERFORMANCE TABLE */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full border-collapse border-2 border-slate-800 shadow-xs">
              <thead>
                <tr className="text-white text-xs font-sans uppercase tracking-widest border-b-2 border-slate-800" style={{ backgroundColor: primary }}>
                  <th className="p-2.5 text-left pl-4 font-semibold tracking-wider">Subject Coursework</th>
                  <th className="border-l border-slate-400/30 p-2.5 text-center font-semibold w-20">C.A.</th>
                  <th className="border-l border-slate-400/30 p-2.5 text-center font-semibold w-20">Exam</th>
                  <th className="border-l border-slate-400/30 p-2.5 text-center font-semibold w-20 bg-black/10">Total</th>
                  <th className="border-l border-slate-400/30 p-2.5 text-center font-semibold w-16">Grade</th>
                  <th className="border-l border-slate-400/30 p-2.5 text-center font-semibold w-32">System Remark</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {report.subjects.map((item, index) => (
                  <tr 
                    key={index} 
                    className={`${index % 2 === 0 ? "bg-white" : "bg-[#faf9f5]"} border-b border-slate-200 hover:bg-amber-50/40 transition-colors break-inside-avoid`}
                  >
                    <td className="p-2 pl-4 font-bold text-slate-800 tracking-wide">{item.name}</td>
                    <td className="border-l border-slate-200 p-2 text-center font-mono text-slate-600">{item.ca}</td>
                    <td className="border-l border-slate-200 p-2 text-center font-mono text-slate-600">{item.exam}</td>
                    <td className="border-l border-slate-200 p-2 text-center font-mono font-bold bg-slate-50/70" style={{ color: primary }}>{item.total}</td>
                    <td className="border-l border-slate-200 p-2 text-center font-black text-base" style={{ color: accent }}>{item.grade || "—"}</td>
                    <td className="border-l border-slate-200 p-2 text-center font-sans text-xs font-medium text-slate-500 uppercase tracking-wider">{item.remark || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PERFORMANCE SUMMARY METRICS */}
          <div className="grid grid-cols-3 gap-0 mt-4 border-2 border-slate-800 bg-white text-center rounded-xs overflow-hidden break-inside-avoid">
            <div className="p-3 border-r border-slate-800">
              <span className="text-[10px] font-sans uppercase tracking-widest font-bold text-slate-500 block mb-0.5">Aggregate Mark</span>
              <span className="text-lg font-bold font-mono" style={{ color: primary }}>{report.total}</span>
            </div>
            <div className="p-3 bg-[#faf9f5] border-r border-slate-800">
              <span className="text-[10px] font-sans uppercase tracking-widest font-bold text-slate-500 block mb-0.5">Cumulative Average</span>
              <span className="text-lg font-bold font-mono" style={{ color: primary }}>{report.average}%</span>
            </div>
            <div className="p-3">
              <span className="text-[10px] font-sans uppercase tracking-widest font-bold text-slate-500 block mb-0.5">Order of Merit</span>
              <span className="text-lg font-bold font-mono" style={{ color: accent }}>{report.position ? `${report.position}` : "—"}</span>
            </div>
          </div>

          {/* RECOGNITION COMMENTS */}
          <div className="mt-6 space-y-4 break-inside-avoid">
            <div className="bg-white border border-slate-300 p-3.5 relative rounded-xs">
              <h3 className="text-[10px] font-sans uppercase tracking-widest font-bold absolute -top-2 left-4 bg-white px-2 border border-slate-200" style={{ color: primary }}>
                Instructor Assessment Remarks
              </h3>
              <p className="text-xs italic text-slate-700 leading-relaxed pt-1 min-h-[2.5rem]">
                "{report.comments.teacher || "No formal performance note entered by the assigned instructor."}"
              </p>
            </div>

            <div className="bg-white border border-slate-300 p-3.5 relative rounded-xs">
              <h3 className="text-[10px] font-sans uppercase tracking-widest font-bold absolute -top-2 left-4 bg-white px-2 border border-slate-200" style={{ color: primary }}>
                Principal Executive Review
              </h3>
              <p className="text-xs italic text-slate-700 leading-relaxed pt-1 min-h-[2.5rem]">
                "{report.comments.principal || report.remark || "No administrative oversight statement declared."}"
              </p>
            </div>
          </div>

          {/* SIGNATORY MATRIX FOOTER */}
          <div className="grid grid-cols-2 mt-8 pt-4 border-t border-dashed border-slate-300 text-center text-sm break-inside-avoid">
            <div className="flex flex-col items-center">
              <div className="h-8 w-44 border-b border-slate-400 mb-1"></div>
              <span className="font-bold text-slate-800 text-xs uppercase tracking-wide">Class Instructor</span>
              <span className="text-[10px] font-sans text-slate-400 uppercase tracking-widest mt-0.5">Signature & Stamp</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="h-8 w-44 border-b border-slate-400 mb-1"></div>
              <span className="font-bold text-slate-800 text-xs uppercase tracking-wide">School Principal</span>
              <span className="text-[10px] font-sans text-slate-400 uppercase tracking-widest mt-0.5">Endorsement Seal</span>
            </div>
          </div>

        </div>

      </div>

      {/* STATIC INTERACTION CONTROL - HELD SEPARATELY OUTSIDE THE DOM COPIER CONTAINER */}
      <div className="max-w-4xl mx-auto mt-6 flex justify-end">
        <button
          onClick={handlePrint}
          disabled={printing}
          className="px-6 py-3 text-white text-xs font-sans font-bold uppercase tracking-widest rounded-sm shadow-md hover:brightness-95 transition-all active:scale-[0.99] disabled:opacity-75"
          style={{ backgroundColor: primary }}
        >
          {printing ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Isolating Viewport...
            </span>
          ) : (
            "Download Academic Registry PDF"
          )}
        </button>
      </div>
    </div>
  );
}