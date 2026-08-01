"use client";

import { useParams } from "next/navigation";

export default function SchoolCBTPage(){

const params = useParams();

const schoolId = params.schoolId as string;


return (

<div className="space-y-6">

<h1 className="text-3xl font-bold">
CBT Management
</h1>

<p className="text-slate-500">
Create exams, manage questions and monitor student attempts.
</p>


<div className="grid md:grid-cols-3 gap-5">


<div className="rounded-2xl border bg-white p-6">
<h2 className="font-bold text-xl">
Create Exam
</h2>
<p className="text-sm text-slate-500 mt-2">
Setup CBT examinations.
</p>
</div>


<div className="rounded-2xl border bg-white p-6">
<h2 className="font-bold text-xl">
Questions
</h2>
<p className="text-sm text-slate-500 mt-2">
Add and manage questions.
</p>
</div>


<div className="rounded-2xl border bg-white p-6">
<h2 className="font-bold text-xl">
Attempts
</h2>
<p className="text-sm text-slate-500 mt-2">
View student submissions.
</p>
</div>


</div>


</div>

);

}
