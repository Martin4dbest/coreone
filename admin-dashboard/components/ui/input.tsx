import * as React from "react";


export function Input(
  props: React.InputHTMLAttributes<HTMLInputElement>
){

return (

<input
{...props}
className={`
w-full
rounded-lg
border
border-gray-200
px-4
py-3
text-sm
outline-none
focus:border-rose-500
focus:ring-2
focus:ring-rose-100
${props.className || ""}
`}
/>

);

}
