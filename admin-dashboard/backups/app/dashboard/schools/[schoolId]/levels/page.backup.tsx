"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  X,
    Trash2,
Loader2,
} from "lucide-react";

import api from "@/lib/api";


type Level = {
  id: number;
  name: string;
  school_id: number;
  is_active: boolean;
};


export default function LevelsPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {

  const { schoolId } = use(params);

  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(false);

  const [loadingId, setLoadingId] = useState<number | null>(null);

  const [showModal, setShowModal] = useState(false);

  const [name, setName] = useState("");

  const [saving, setSaving] = useState(false);


  async function loadLevels(){

    const res = await api.get("/levels");

    setLevels(
      res.data.filter(
        (level:Level)=>
          level.school_id === Number(schoolId)
      )
    );
  }


  useEffect(()=>{

    loadLevels();

  },[schoolId]);



    async function toggleLevel(
  id: number,
  active: boolean
){

  try {

    const action = active
      ? "deactivate"
      : "activate";


    const response = await api.patch(
      `/levels/${id}/${action}`
    );


    setLevels((current) =>
      current.map((level) =>
        level.id === id
          ? response.data
          : level
      )
    );


  } catch(error){

    console.error(
      "LEVEL STATUS UPDATE FAILED:",
      error
    );

  }

}


async function deleteLevel(id:number){

    const confirmDelete =
      confirm(
        "Delete this level permanently?"
      );


    if(!confirmDelete) return;


    try{

      setLoadingId(id);


      await api.delete(
        `/levels/${id}`
      );


      await loadLevels();


    }catch(error){

      console.error(
        "DELETE LEVEL FAILED",
        error
      );

    }finally{

      setLoadingId(null);

    }

  }



  async function createLevel(){

    if(!name.trim()) return;


    try{

      setSaving(true);


      await api.post(
        "/levels",
        {
          school_id:Number(schoolId),
          name:name.trim(),
        }
      );


      setName("");

      setShowModal(false);


      await loadLevels();


    }catch(error:any){

      if(
        error.response?.status === 400
      ){

        alert(
          "This level already exists for this school."
        );

      }
      else{

        alert(
          "Failed to create level."
        );

      }


    }finally{

      setSaving(false);

    }

  }



return (

<div className="min-h-screen bg-white p-8 text-black">


<Link
href={`/dashboard/schools/${schoolId}/academics`}
className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 mb-6"
>

<ArrowLeft size={18}/>

Back to Academics

</Link>



<div className="flex justify-between items-center mb-8">


<div>

<h1 className="text-3xl font-bold">
Levels
</h1>

<p className="text-gray-500 mt-1">
Manage school academic levels

<div className="flex justify-end mb-6">

<button
onClick={()=>setShowModal(true)}
className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl"
>

<Plus size={18}/>

Create Level

</button>

</div>
</p>

</div>




</div>





<div className="border rounded-2xl overflow-hidden">


<table className="w-full">


<thead className="bg-gray-50">

<tr>

<th className="text-left p-4">
Level
</th>

<th className="text-left p-4">
Status
</th>

<th className="text-left p-4">
Actions
</th>

</tr>

</thead>



<tbody>


{
loading ?

<tr>

<td
colSpan={3}
className="p-10 text-center"
>

<Loader2
className="animate-spin inline"
size={24}
/>

</td>

</tr>


:

levels.map(level=>(


<tr
key={level.id}
className="border-t"
>


<td className="p-4 font-semibold">

{level.name}

</td>



<td className="p-4">


<span
className={
level.is_active
?
"bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm"
:
"bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm"
}
>

{
level.is_active
?
"Active"
:
"Inactive"
}

</span>


</td>



<td className="p-4 flex gap-3">


<button
disabled={loadingId===level.id}
onClick={()=>
toggleLevel(
level.id,
level.is_active
)
}

className="
px-4 py-2 rounded-lg
bg-blue-100 text-blue-700
"
>

{
loadingId===level.id
?
level.is_active
?
"Deactivate"
:
"Activate" 
:
level.is_active
?
"Deactivate"
:
"Activate"
}


</button>



<button

disabled={loadingId===level.id}

onClick={()=>
deleteLevel(level.id)
}

className="
px-4 py-2 rounded-lg
bg-red-100 text-red-700
"

>

<Trash2 size={16}/>

</button>


</td>


</tr>


))

}



</tbody>


</table>


</div>





{
showModal && (


<div className="fixed inset-0 bg-black/40 flex items-center justify-center">


<div className="bg-white rounded-2xl p-6 w-[400px]">


<div className="flex justify-between mb-5">


<h2 className="text-xl font-bold">
Create Level
</h2>


<button
onClick={()=>setShowModal(false)}
>

<X/>

</button>


</div>



<input

value={name}

onChange={
e=>setName(e.target.value)
}

placeholder="Example: JSS1"

className="
w-full border rounded-lg
px-4 py-3 mb-5
"

/>



<div className="flex justify-end gap-3">


<button

onClick={()=>setShowModal(false)}

className="border px-4 py-2 rounded-lg"

>

Cancel

</button>



<button

disabled={saving}

onClick={createLevel}

className="
bg-blue-600 text-white
px-5 py-2 rounded-lg
flex gap-2 items-center
"

>

{
saving &&
<Loader2
  size={16}
  className="animate-spin"
/>
}

Create

</button>


</div>


</div>


</div>


)

}


</div>

);


}
