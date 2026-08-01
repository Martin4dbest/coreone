"use client";

import Link from "next/link";
import { useParams } from "next/navigation";


export default function StudentLearningPage(){

const params = useParams();

const tenant = params.tenant as string;


const modules = [

{
title:"CBT Exams",
description:"Take online examinations",
icon:"📝",
link:`/${tenant}/student/learning/cbt`
},

{
title:"Ebooks",
description:"Read digital learning materials",
icon:"📚",
link:`/${tenant}/student/learning/ebooks`
},

{
title:"YouTube Learning",
description:"Watch educational lessons",
icon:"▶️",
link:`/${tenant}/student/learning/youtube`
},

{
title:"Browser Resources",
description:"Explore approved learning websites",
icon:"🌐",
link:`/${tenant}/student/learning/browser`
}

];


return (

<div className="space-y-6">


<div>

<h1 className="text-3xl font-bold">
My Learning
</h1>

<p className="text-slate-500">
Digital classroom resources and assessments
</p>

</div>


<div className="grid md:grid-cols-3 gap-5">

{modules.map(item=>(

<Link
key={item.title}
href={item.link}
className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md"
>

<div className="text-4xl mb-4">
{item.icon}
</div>

<h2 className="text-xl font-bold">
{item.title}
</h2>

<p className="mt-2 text-sm text-slate-500">
{item.description}
</p>

</Link>

))}

</div>


</div>

);

}
