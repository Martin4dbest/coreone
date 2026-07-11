import * as React from "react";


export function Button(
{
children,
className="",
...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>
){

return (

<button
{...props}
className={`
rounded-lg
bg-rose-600
px-6
py-3
text-sm
font-semibold
text-white
shadow-md
transition
hover:bg-rose-700
disabled:opacity-50
${className}
`}
>

{children}

</button>

);

}
