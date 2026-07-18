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
  <div className="p-6">
    <div className="flex justify-between items-center mb-6">
      <Link href={`/dashboard/schools/${schoolId}/academics`} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
        <ArrowLeft className="w-4 h-4" /> Back to Academics
      </Link>
      <button 
        onClick={() => setShowModal(true)} 
        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
      >
        <Plus className="w-4 h-4" /> Add Level
      </button>
    </div>

    {loading ? (
      <div className="flex justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    ) : (
      <div className="space-y-4">
        {levels.map(level => (
          <div key={level.id} className="flex justify-between items-center p-4 border rounded-lg bg-white shadow-sm">
            <div className="flex items-center gap-4">
              <span className="font-medium text-lg">{level.name}</span>
              <span className={
                level.is_active
                  ? "bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm"
                  : "bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm"
              }>
                {level.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={loadingId === level.id}
                onClick={() => toggleLevel(level.id, level.is_active)}
                className="px-4 py-2 rounded-lg bg-blue-100 text-blue-700 disabled:opacity-50"
              >
                {loadingId === level.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : level.is_active ? (
                  "Deactivate"
                ) : (
                  "Activate"
                )}
              </button>
              <button
                disabled={loadingId === level.id}
                onClick={() => deleteLevel(level.id)}
                className="p-2 rounded-lg bg-red-100 text-red-700 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    )}

    {showModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-md relative">
          <button 
            onClick={() => setShowModal(false)} 
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
          
          <h2 className="text-xl font-bold mb-4">Create New Level</h2>
          
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Example: JSS1"
            className="w-full border rounded-lg px-4 py-3 mb-5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowModal(false)}
              className="border px-4 py-2 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              disabled={saving}
              onClick={createLevel}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg flex gap-2 items-center hover:bg-blue-700 disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Create
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
}