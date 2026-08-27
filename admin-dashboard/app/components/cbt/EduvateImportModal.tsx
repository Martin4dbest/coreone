"use client";

import { useState } from "react";
import api from "@/lib/api";

interface Props {
  examId: number;
  onSuccess?: () => void;
}

export default function EduvateImportModal({
  examId,
  onSuccess,
}: Props) {

  const [open, setOpen] = useState(false);

  const [subjects, setSubjects] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);

  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);


  // STEP 1: Open modal and load Eduvate subjects
  const loadSubjects = async () => {

    try {

      setLoading(true);
      setOpen(true);

      const res = await api.get(
        "/online-cbt/eduvate/subjects"
      );


      setSubjects(
        res.data.data || []
      );


    } catch (error) {

      console.error(error);
      alert("Unable to load Eduvate subjects");

    } finally {

      setLoading(false);

    }

  };



  // STEP 2: View questions from selected subject
  const viewQuestions = async (
    subjectId:number
  ) => {

    try {

      setLoading(true);

      setSelectedSubject(subjectId);


      const res = await api.get(
        "/online-cbt/eduvate/questions",
        {
          params:{
            subject_id: subjectId,
            limit:40
          }
        }
      );


      setQuestions(
        res.data.data || []
      );


    } catch(error){

      console.error(error);
      alert("Unable to load questions");


    } finally {

      setLoading(false);

    }

  };




  // STEP 3: Import after preview
  const importQuestions = async()=>{

    try{

      setLoading(true);


      await api.post(
        `/cbt/exams/${examId}/import-eduvate`,
        {
          questions
        }
      );


      alert(
        `${questions.length} questions imported successfully`
      );


      setOpen(false);

      setQuestions([]);

      setSelectedSubject(null);

      onSuccess?.();



    }catch(error){

      console.error(error);

      alert("Import failed");


    }finally{

      setLoading(false);

    }

  };




  return (

    <>

      <button
        onClick={loadSubjects}
        className="bg-green-600 text-white px-6 py-3 rounded-lg"
      >
        Import Eduvate Questions
      </button>



      {open && (

        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">


          <div className="bg-white rounded-xl w-[850px] max-h-[85vh] overflow-y-auto p-6">



            <div className="flex justify-between items-center mb-5">

              <h2 className="text-xl font-bold">
                Eduvate Question Bank
              </h2>


              <button
                onClick={()=>{
                  setOpen(false);
                  setSelectedSubject(null);
                  setQuestions([]);
                }}
              >
                ✕
              </button>


            </div>





            {loading && (

              <p className="text-center py-5">
                Loading...
              </p>

            )}







            {/* SUBJECT LIST */}

            {!loading && !selectedSubject && (

              <div>


                <h3 className="font-semibold mb-3">
                  Available Eduvate Subjects
                </h3>



                {subjects.length === 0 && (

                  <p>
                    No subjects found.
                  </p>

                )}



                {subjects.map((subject)=>(


                  <div
                    key={subject.subject_id}
                    className="border rounded-lg p-4 mb-3"
                  >


                    <p className="font-bold">
                      Subject ID: {subject.subject_id}
                    </p>


                    <p className="text-gray-700 mt-1">
                      {subject.preview}
                    </p>


                    <p className="text-sm mt-2">
                      Available Questions: {subject.count}
                    </p>



                    <button
                      onClick={()=>
                        viewQuestions(subject.subject_id)
                      }
                      className="mt-3 bg-blue-600 text-white px-4 py-2 rounded"
                    >
                      View Questions
                    </button>


                  </div>


                ))}


              </div>

            )}







            {/* QUESTION PREVIEW */}

            {!loading && selectedSubject && (

              <div>


                <button
                  className="mb-4 text-blue-600"
                  onClick={()=>{
                    setSelectedSubject(null);
                    setQuestions([]);
                  }}
                >
                  ← Back to Subjects
                </button>




                <h3 className="font-semibold mb-4">
                  Question Preview
                </h3>



                {questions.length === 0 && (

                  <p>
                    No questions found for this subject.
                  </p>

                )}




                {questions.map((q,index)=>(


                  <div
                    key={index}
                    className="border rounded p-4 mb-3"
                  >

                    <p className="font-medium">
                      {index + 1}. {q.question}
                    </p>


                    {q.options && (

                      <ul className="mt-2 text-sm">

                        {Object.entries(q.options).map(
                          ([key,value]:any)=>(
                            <li key={key}>
                              {key}. {value}
                            </li>
                          )
                        )}

                      </ul>

                    )}


                  </div>


                ))}





                {questions.length > 0 && (

                  <button
                    onClick={importQuestions}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg"
                  >
                    Confirm Import ({questions.length})
                  </button>

                )}



              </div>

            )}



          </div>


        </div>

      )}


\
    </>

  );

}
