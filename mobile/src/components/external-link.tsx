import { Link } from "expo-router";
import { ComponentProps } from "react";


type Props =
ComponentProps<typeof Link>;


export default function ExternalLink(
props: Props
){

return (
<Link
{...props}
/>
);

}
