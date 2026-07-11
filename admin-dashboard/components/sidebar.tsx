"use client";

import Link from "next/link";
import {
LayoutDashboard,
School,
Users,
ShieldCheck,
Settings,
FileText
} from "lucide-react";

import Logo from "./logo";


const menu=[

{
name:"Dashboard",
href:"/dashboard",
icon:LayoutDashboard
},

{
name:"Schools",
href:"/dashboard/schools",
icon:School
},

{
name:"Administrators",
href:"/dashboard/admins",
icon:Users
},

{
name:"Roles & Permissions",
href:"/dashboard/roles",
icon:ShieldCheck
},

{
name:"Reports",
href:"/dashboard/reports",
icon:FileText
},

{
name:"Settings",
href:"/dashboard/settings",
icon:Settings
}

];



export default function Sidebar(){


return (

<aside
className="
w-80
min-h-screen
p-5
"
>


<div
className="
h-full
rounded-3xl
border
bg-white/80
backdrop-blur-xl
shadow-xl
p-6
"
>


<Logo size={55}/>



<div
className="
mt-10
space-y-2
"
>


{
menu.map((item)=>{

const Icon=item.icon;


return (

<Link
key={item.name}
href={item.href}
className="
group
flex
items-center
gap-4
rounded-2xl
px-4
py-3
text-sm
transition-all
hover:bg-primary/10
hover:text-primary
"
>

<Icon
size={20}
className="
group-hover:scale-110
transition
"
/>


<span>
{item.name}
</span>


</Link>

)


})
}


</div>


</div>


</aside>

);

}
