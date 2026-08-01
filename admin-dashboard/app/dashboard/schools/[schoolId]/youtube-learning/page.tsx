"use client";

import { useEffect,useState } from "react";
import api from "@/lib/api";


export default function YoutubeLearningPage(){

const [videos,setVideos]=useState<any[]>([]);


useEffect(()=>{

async function load(){

try{

const res = await api.get("/youtube-learning");

setVideos(res.data);

}catch(error){

console.error(error);

}

}

load();

},[]);


return (

<div className="space-y-6">

<h1 className="text-3xl font-bold">
YouTube Learning
</h1>


<p className="text-slate-500">
Educational videos management
</p>


<div className="grid md:grid-cols-3 gap-5">


{videos.map(video=>(

<div
key={video.id}
className="rounded-2xl border bg-white p-5"
>

<h2 className="font-bold">
{video.title}
</h2>


</div>

))}


</div>


</div>

);

}
