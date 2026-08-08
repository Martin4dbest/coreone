"use client";

import { use, useEffect, useState } from "react";
import api from "@/lib/api";
import { Plus, X, ArrowLeft, Loader2 } from "lucide-react";

type Result = {
  id:number;
  student_name:string;
  admission_number:string;
  class_name:string;
  subject_name:string;
  term_name:string;
  session_name:string;
  total_score:number;
  grade:string|null;
};

type Option = {
  id:number;
  name:string;
};

type Student = {
  id:number;
  first_name:string;
  last_name:string;
  admission_number:string;
};

export default function ResultsPage({
  params,
}:{
  params:Promise<{schoolId:string}>
}) {

const {schoolId}=use(params);

const [results,setResults]=useState<Result[]>([]);
const [students,setStudents]=useState<Student[]>([]);
const [classes,setClasses]=useState<Option[]>([]);
const [subjects,setSubjects]=useState<Option[]>([]);
const [terms,setTerms]=useState<Option[]>([]);
const [sessions,setSessions]=useState<Option[]>([]);

const [open,setOpen]=useState(false);
  const [saving,setSaving]=useState(false);

const [studentId,setStudentId]=useState("");
const [classId,setClassId]=useState("");
const [subjectId,setSubjectId]=useState("");
const [termId,setTermId]=useState("");
const [sessionId,setSessionId]=useState("");
const [ca,setCa]=useState("");
const [exam,setExam]=useState("");

const [bulkOpen,setBulkOpen]=useState(false);
const [bulkStudents,setBulkStudents]=useState<Student[]>([]);
const [bulkScores,setBulkScores]=useState<Record<number,{ca:string,exam:string}>>({});
const [bulkClassId,setBulkClassId]=useState("");
const [bulkSubjectId,setBulkSubjectId]=useState("");
const [bulkTermId,setBulkTermId]=useState("");
const [bulkSessionId,setBulkSessionId]=useState("");
const [bulkLoading,setBulkLoading]=useState(false);
const [bulkSaving,setBulkSaving]=useState(false);

async function loadData(){

try{

const [
resultsRes,
studentsRes,
classesRes,
subjectsRes,
termsRes,
sessionsRes

]=await Promise.all([

api.get("/results"),

api.get("/students"),

api.get("/classes"),

api.get("/subjects",{
params:{
school_id:schoolId
}
}),

api.get("/terms",{
params:{
school_id:schoolId
}
}),

api.get("/academic-sessions",{
params:{
school_id:schoolId
}
})

]);

setResults(resultsRes.data);
setStudents(studentsRes.data);
setClasses(classesRes.data);
setSubjects(subjectsRes.data);
setTerms(termsRes.data);
setSessions(sessionsRes.data);

}catch(error){

console.error(
"RESULT LOAD FAILED:",
error
);

}

}

useEffect(()=>{

loadData();

},[]);

async function loadBulkStudents(){

if(!bulkClassId){
return;
}

try{

setBulkLoading(true);

const res = await api.get("/students",{
params:{
class_id:bulkClassId,
school_id:schoolId
}
});

setBulkStudents(res.data);

const initial:any={};

res.data.forEach((s:Student)=>{
initial[s.id]={
ca:"",
exam:""
};
});

setBulkScores(initial);

}catch(error){

console.error(error);

}finally{

setBulkLoading(false);

}

}

function updateBulkScore(
studentId:number,
field:"ca"|"exam",
value:string
){

setBulkScores(prev=>({

...prev,

[studentId]:{

...prev[studentId],

[field]:value

}

}));

}

async function saveBulkResults(){

try{

setBulkSaving(true);

const payload = {
school_id:Number(schoolId),
class_id:Number(bulkClassId),
subject_id:Number(bulkSubjectId),
term_id:Number(bulkTermId),
academic_session_id:Number(bulkSessionId),

results: bulkStudents.map(student=>{

const score = bulkScores[student.id] || {
ca:"",
exam:""
};

return {
student_id:student.id,
ca_score:Number(score.ca || 0),
exam_score:Number(score.exam || 0)
};

})

};

await api.post("/results/bulk-entry", payload);

await loadData();

setBulkOpen(false);

}catch(error){

console.error("BULK RESULT SAVE FAILED:", error);
alert("Failed to save bulk results.");

}finally{

setBulkSaving(false);

}

}

async function createResult(){

  setSaving(true);

await api.post("/results",{

school_id:Number(schoolId),

student_id:Number(studentId),

class_id:Number(classId),

subject_id:Number(subjectId),

term_id:Number(termId),

academic_session_id:Number(sessionId),

ca_score:Number(ca),

exam_score:Number(exam)

});

setOpen(false);

await loadData();

}

return (

<div className="min-h-screen bg-white text-gray-900 p-4">

<div className="flex justify-between items-center mb-8">

<div>

<a
href={`/dashboard/schools/${schoolId}/academics`}
className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 mb-4"
>
<ArrowLeft size={16}/>
Back to Academics
</a>

<h1 className="text-base font-bold">
<button
onClick={()=>setBulkOpen(true)}
className="ml-3 inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm"
>
Bulk Score Entry
</button>

{bulkOpen && (

<div className="mt-8 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">

<h2 className="text-base font-semibold mb-4">
Bulk Score Entry
</h2>

<div className="grid grid-cols-5 gap-3">

<select
className="border rounded-lg p-2 text-sm"
onChange={(e)=>setBulkClassId(e.target.value)}
>
<option>Select Class</option>
{classes.map(c=>(
<option key={c.id} value={c.id}>
{c.name}
</option>
))}
</select>

<button
onClick={loadBulkStudents}
className="bg-blue-600 text-white rounded-xl px-4"
>
{bulkLoading ? "Loading..." : "Load Students"}
</button>

<select
className="border rounded-lg p-2 text-sm"
onChange={(e)=>setBulkSubjectId(e.target.value)}
>
<option>Select Subject</option>
{subjects.map(s=>(
<option key={s.id} value={s.id}>
{s.name}
</option>
))}
</select>

<select
className="border rounded-lg p-2 text-sm"
onChange={(e)=>setBulkTermId(e.target.value)}
>
<option>Select Term</option>
{terms.map(t=>(
<option key={t.id} value={t.id}>
{t.name}
</option>
))}
</select>

<select
className="border rounded-lg p-2 text-sm"
onChange={(e)=>setBulkSessionId(e.target.value)}
>
<option>Select Session</option>
{sessions.map(s=>(
<option key={s.id} value={s.id}>
{s.name}
</option>
))}
</select>

</div>

<table className="w-full mt-6">

<thead>
<tr className="border-b">
<th className="p-3 text-left">Student</th>
<th className="p-3">CA</th>
<th className="p-3">Exam</th>
</tr>
</thead>

<tbody>

{bulkStudents.map(s=>(

<tr key={s.id} className="border-b">

<td className="p-3">
{s.first_name} {s.last_name}
</td>

<td>
<input
className="border rounded-lg p-2 w-24"
value={bulkScores[s.id]?.ca || ""}
onChange={(e)=>updateBulkScore(s.id,"ca",e.target.value)}
/>
</td>

<td>
<input
className="border rounded-lg p-2 w-24"
value={bulkScores[s.id]?.exam || ""}
onChange={(e)=>updateBulkScore(s.id,"exam",e.target.value)}
/>
</td>

</tr>

))}

</tbody>

</table>

<button
onClick={saveBulkResults}
disabled={bulkSaving}
className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
>
{bulkSaving ? "Saving..." : "Save Bulk Results"}
</button>

</div>

)}

Results
</h1>

<p className="text-gray-500 mt-1">
Manage student academic performance and grades
</p>

</div>

<button

onClick={()=>setOpen(true)}

className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl shadow"

>

<Plus size={18}/>

Add Result

</button>

</div>

{open && (

<div className="bg-white border border-gray-200 rounded-xl shadow-lg p-4 mb-8">

<div className="flex justify-between mb-5">

<h2 className="text-xl font-semibold">
Create Result
</h2>

<button
onClick={()=>setOpen(false)}
className="text-gray-500 hover:text-red-500"
>

<X/>

</button>

</div>

<div className="grid md:grid-cols-2 gap-4">

<select
className="border rounded-lg p-2 text-sm"
onChange={(e)=>setStudentId(e.target.value)}
>

<option>
Select Student
</option>

{students.map(s=>(

<option key={s.id} value={s.id}>

{s.first_name} {s.last_name}

</option>

))}

</select>

<select
className="border rounded-lg p-2 text-sm"
onChange={(e)=>setClassId(e.target.value)}
>

<option>
Select Class
</option>

{classes.map(c=>(

<option key={c.id} value={c.id}>

{c.name}

</option>

))}

</select>

<select
className="border rounded-lg p-2 text-sm"
onChange={(e)=>setSubjectId(e.target.value)}
>

<option>
Select Subject
</option>

{subjects.map(s=>(

<option key={s.id} value={s.id}>

{s.name}

</option>

))}

</select>

<select
className="border rounded-lg p-2 text-sm"
onChange={(e)=>setTermId(e.target.value)}
>

<option>
Select Term
</option>

{terms.map(t=>(

<option key={t.id} value={t.id}>

{t.name}

</option>

))}

</select>

<select
className="border rounded-lg p-2 text-sm"
onChange={(e)=>setSessionId(e.target.value)}
>

<option>
Select Session
</option>

{sessions.map(s=>(

<option key={s.id} value={s.id}>

{s.name}

</option>

))}

</select>

<input

placeholder="CA Score"

className="border rounded-lg p-2 text-sm"

onChange={(e)=>setCa(e.target.value)}

/>

<input

placeholder="Exam Score"

className="border rounded-lg p-2 text-sm"

onChange={(e)=>setExam(e.target.value)}

/>

</div>

<button

  disabled={saving}

  onClick={createResult}

  className="mt-6 flex items-center gap-2 bg-green-600 text-white px-4 py-3 rounded-xl disabled:opacity-50"

>

  {saving ? (
    <>
      <Loader2
        size={16}
        className="animate-spin"
      />
      Saving...
    </>
  ) : (
    "Save Result"
  )}

</button>

</div>

)}

<div className="bg-white border border-gray-200 rounded-xl shadow overflow-hidden">

<table className="w-full">

<thead className="bg-gray-100">

<tr>

<th className="text-left p-4">
Student
</th>

<th className="text-left p-4">
Class
</th>

<th className="text-left p-4">
Subject
</th>

<th className="text-left p-4">
Total
</th>

<th className="text-left p-4">
Grade
</th>

</tr>

</thead>

<tbody>

{results.map(r=>(

<tr
key={r.id}
className="border-t hover:bg-gray-50"
>

<td className="p-4 font-medium">
{r.student_name}
</td>

<td className="p-4">
{r.class_name}
</td>

<td className="p-4">
{r.subject_name}
</td>

<td className="p-4">
{r.total_score}
</td>

<td className="p-4">

<span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700">

{r.grade ?? "-"}

</span>

</td>

</tr>

))}

</tbody>

</table>

</div>

</div>

);

}