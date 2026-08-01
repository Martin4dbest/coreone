"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function AdminEbooksPage(){

const [ebooks,setEbooks] = useState<any[]>([]);
const [loading,setLoading] = useState(true);


useEffect(()=>{

async function load(){

try{

const res = await api.get("/ebooks");

setEbooks(res.data || []);

}
catch(error){

console.error(
"Failed loading ebooks",
error
);

}
finally{

setLoading(false);

}

}

load();

},[]);



return (

<div className="space-y-6">

<div>

<h1 className="text-3xl font-bold">
Ebooks Management
</h1>

<p className="text-slate-500 mt-2">
Upload and manage digital learning materials.
</p>

</div>


{loading && (
<p>
Loading ebooks...
</p>
)}


<div className="grid md:grid-cols-3 gap-5">

{ebooks.map((ebook)=>(

<div
key={ebook.id}
className="rounded-2xl border bg-white p-5 shadow-sm"
>

<h2 className="font-bold">
{ebook.title}
</h2>

<p className="text-sm text-slate-500 mt-2">
{ebook.description}
</p>

</div>

))}


</div>


</div>

);

}
