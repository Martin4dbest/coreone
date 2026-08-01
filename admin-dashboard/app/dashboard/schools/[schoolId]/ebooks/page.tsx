"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function EbooksPage() {

const [ebooks,setEbooks] = useState<any[]>([]);

useEffect(()=>{

async function load(){

try{

const res = await api.get("/ebooks");

setEbooks(res.data);

}catch(error){

console.error(error);

}

}

load();

},[]);


return (

<div className="space-y-6">

<h1 className="text-3xl font-bold">
Ebooks Library
</h1>

<p className="text-slate-500">
Manage digital learning materials
</p>


<div className="grid md:grid-cols-3 gap-5">

{ebooks.map((book)=>(

<div
key={book.id}
className="rounded-2xl border bg-white p-5 shadow-sm"
>

<h2 className="font-bold">
{book.title}
</h2>

<p className="text-sm text-slate-500 mt-2">
{book.description}
</p>

</div>

))}

</div>

</div>

);

}
