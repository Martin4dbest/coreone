import Image from "next/image";

export default function Logo({
size=60
}:{
size?:number
}){

return (

<div className="flex items-center gap-3">

<div
className="
relative
rounded-2xl
overflow-hidden
bg-white
shadow-sm
"
style={{
width:size,
height:size
}}
>

<Image
src="/logo.png"
alt="PreSense"
fill
sizes={`${size}px`}
className="object-contain"
/>

</div>

<div>

<h1
className="
text-xl
font-bold
tracking-tight
"
>
PreSense
</h1>

<p
className="
text-xs
text-muted-foreground
"
>
Smart School Platform
</p>

</div>

</div>

);

}