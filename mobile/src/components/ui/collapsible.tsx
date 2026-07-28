import {
PropsWithChildren,
useState
} from "react";

import {
Pressable,
View,
Text
} from "react-native";


export default function Collapsible(
{
children,
title
}: PropsWithChildren<{
title:string
}>
){

const [open,setOpen]=useState(false);


return (

<View>

<Pressable
onPress={()=>setOpen(!open)}
>

<Text>
{title}
</Text>

</Pressable>


{
open &&
children
}

</View>

);

}
