import {
View,
Text,
Pressable,
StyleSheet
} from "react-native";

import {
router
} from "expo-router";


export default function Home(){

return (

<View style={styles.container}>


<Text style={styles.logo}>
PreSense
</Text>


<Text style={styles.tagline}>
Your School. Your Future. Connected.
</Text>


<Pressable

style={styles.button}

onPress={()=>router.push("/login")}

>

<Text style={styles.buttonText}>
Get Started
</Text>

</Pressable>


</View>

);

}


const styles = StyleSheet.create({

container:{
flex:1,
justifyContent:"center",
alignItems:"center",
padding:30,
backgroundColor:"#020617"
},

logo:{
fontSize:48,
fontWeight:"900",
color:"#38bdf8"
},

tagline:{
fontSize:18,
color:"#94a3b8",
marginTop:15,
textAlign:"center"
},

button:{
marginTop:40,
backgroundColor:"#38bdf8",
paddingHorizontal:50,
paddingVertical:16,
borderRadius:30
},

buttonText:{
fontWeight:"900",
color:"#020617"
}

});
