"use client";

import { FileText } from "lucide-react";

export default function SchoolReportsPage() {
  return (
    <section className="space-y-6">

      <div
        className="
        rounded-3xl
        border
        border-rose-100
        bg-gradient-to-br
        from-rose-50
        via-white
        to-pink-50
        p-8
        shadow-sm
        "
      >
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-rose-100 p-3 text-rose-600">
            <FileText size={24}/>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              School Reports
            </h1>

            <p className="text-sm text-slate-600">
              View academic and administrative reports for this school.
            </p>
          </div>
        </div>
      </div>


      <div
        className="
        rounded-3xl
        border
        bg-white
        p-8
        shadow-sm
        "
      >
        <p className="text-slate-500">
          Reports module will be connected here.
        </p>
      </div>

    </section>
  );
}
