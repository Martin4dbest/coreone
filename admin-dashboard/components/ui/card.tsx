import * as React from "react";


export function Card({
children,
className=""
}:{
children:React.ReactNode;
className?:string;
}){

return (

<div
className={`
rounded-2xl
border
bg-white
shadow-sm
${className}
`}
>

{children}

</div>

);

}



export function CardHeader({
children,
className=""
}:{
children:React.ReactNode;
className?:string;
}){

return (

<div
className={`
p-6
${className}
`}
>

{children}

</div>

);

}




export function CardContent({
children,
className=""
}:{
children:React.ReactNode;
className?:string;
}){

return (

<div
className={`
px-6
pb-6
${className}
`}
>

{children}

</div>

);

}




export function CardTitle({
children
}:{
children:React.ReactNode;
}){

return (

<h2
className="
text-xl
font-bold
text-gray-900
"
>

{children}

</h2>

);

}
