"use client";

import Link from "next/link";
import { useParams } from "next/navigation";


export default function TeacherLearningPage(){

const params = useParams();

const tenant = params.tenant as string;


const modules = [

{
title:"Attendance",
description:"Manage attendance for assigned classes",
icon:"📅",
link:`/${tenant}/teacher/attendance`
},

{
title:"CBT",
description:"Create and manage exams for assigned subjects",
icon:"📝",
link:`/${tenant}/teacher/learning/cbt`
},

{
title:"Ebooks",
description:"Access digital learning materials",
icon:"📚",
link:`/${tenant}/teacher/learning/ebooks`
},

{
title:"YouTube Learning",
description:"Educational videos and lessons",
icon:"▶️",
link:`/${tenant}/teacher/learning/youtube`
},

{
title:"Browser Resources",
description:"Approved teaching resources",
icon:"🌐",
link:`/${tenant}/teacher/learning/browser`
}

];


return (

<div className="space-y-6">


<div>

<h1 className="text-3xl font-bold">
Teacher Learning Hub
</h1>

<p className="text-slate-500">
Teaching tools, resources and assessments
</p>

</div>



<div className="grid md:grid-cols-3 gap-5">


{
modules.map(item=>(

<Link
key={item.title}
href={item.link}
className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md"
>

<div className="text-4xl mb-4">
{item.icon}
</div>

<h2 className="font-bold text-xl">
{item.title}
</h2>

<p className="mt-2 text-sm text-slate-500">
{item.description}
</p>


</Link>

))
}


</div>


</div>

);

}
