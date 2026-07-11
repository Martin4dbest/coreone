"use client";

import { useEffect,useState,use } from "react";
import { Power } from "lucide-react";
import api from "@/lib/api";

type Level = {
 id:number;
 name:string;
 school_id:number;
 is_active:boolean;
};

export default function LevelsPage({
 params,
}:{
 params:Promise<{schoolId:string}>
}){

const {schoolId}=use(params);

const [levels,setLevels]=useState<Level[]>([]);


useEffect(()=>{

api.get("/levels")
.then(res=>{
setLevels(
res.data.filter(
(level:Level)=>
level.school_id===Number(schoolId)
)
)
})

},[schoolId]);


async function toggleLevel(id:number,active:boolean){

const action=active?"deactivate":"activate";

const res=await api.patch(
`/levels/${id}/${action}`
);

setLevels(current=>
current.map(level=>
level.id===id?res.data:level
)
)

}


return(
<div className="space-y-5">

<h1 className="text-2xl font-bold">
Levels
</h1>

{
levels.map(level=>(

<div
key={level.id}
className="flex justify-between rounded-xl border p-5"
>

<div>
<h2 className="font-bold">
{level.name}

<button
  onClick={() =>
    toggleLevel(
      level.id,
      level.is_active
    )
  }
  className={
    level.is_active
      ? "ml-3 text-xs text-red-600"
      : "ml-3 text-xs text-green-600"
  }
>
  {level.is_active ? "Deactivate" : "Activate"}
</button>
</h2>

<p>
{level.is_active?"Active":"Inactive"}
</p>

</div>


<button
onClick={()=>toggleLevel(level.id,level.is_active)}
className={
level.is_active
?"rounded-lg bg-red-100 px-3 py-2 text-red-600"
:"rounded-lg bg-green-100 px-3 py-2 text-green-600"
}
>

<Power size={16}/>

</button>


</div>

))
}

</div>
)

}
