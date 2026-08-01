"use client";

import {useEffect,useState} from "react";
import api from "@/lib/api";


export default function BrowserResourcesPage(){

const [links,setLinks]=useState<any[]>([]);


useEffect(()=>{

async function load(){

try{

const res = await api.get("/browser-links");

setLinks(res.data);

}catch(error){

console.error(error);

}

}

load();

},[]);


return (

<div className="space-y-6">

<h1 className="text-3xl font-bold">
Browser Resources
</h1>

<p className="text-slate-500">
Approved learning websites and resources
</p>


<div className="grid md:grid-cols-3 gap-5">

{links.map(item=>(

<div
key={item.id}
className="rounded-2xl border bg-white p-5"
>

<h2 className="font-bold">
{item.title}
</h2>

<p className="text-sm text-blue-600">
{item.url}
</p>

</div>

))}

</div>


</div>

);

}
