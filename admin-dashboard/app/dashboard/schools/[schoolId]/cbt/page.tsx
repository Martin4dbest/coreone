"use client";

import {useParams} from "next/navigation";
import Link from "next/link";


export default function CBTPage(){

const params=useParams();

const schoolId=params.schoolId;


return (

<div className="space-y-6">

<h1 className="text-3xl font-bold">
CBT Management
</h1>


<div className="grid md:grid-cols-3 gap-5">


<Link
href={`/dashboard/schools/${schoolId}/cbt/exams`}
className="rounded-2xl border bg-white p-6"
>

<h2 className="font-bold">
Exams
</h2>

<p>
Create and manage CBT exams
</p>

</Link>



<Link
href={`/dashboard/schools/${schoolId}/cbt/questions`}
className="rounded-2xl border bg-white p-6"
>

<h2 className="font-bold">
Questions
</h2>

<p>
Manage question bank
</p>

</Link>



</div>


</div>

);

}
