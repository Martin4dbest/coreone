import * as React from "react";


export function Label({
children,
...props
}: React.LabelHTMLAttributes<HTMLLabelElement>){

return (

<label
{...props}
className="
block
mb-2
text-sm
font-medium
text-gray-700
"
>

{children}

</label>

);

}
