import {
View,
Text,
TextInput,
Pressable,
StyleSheet,
Alert,
ActivityIndicator
} from "react-native";

import {
useState
} from "react";

import {
router
} from "expo-router";

import {
LinearGradient
} from "expo-linear-gradient";

import {
useAuth
} from "@/context/AuthContext";


export default function Login(){


const {login}=useAuth();


const [schoolCode,setSchoolCode]=useState("");

const [email,setEmail]=useState("");

const [password,setPassword]=useState("");

const [loading,setLoading]=useState(false);



async function submit(){

try{

setLoading(true);


const data = await login(
schoolCode,
email,
password
);



if(data.user.must_change_password){

router.replace("/change-password");

return;

}



if(data.user.role === "STUDENT"){

router.replace("/student/dashboard");

}


else if(data.user.role === "PARENT"){

router.replace("/parent/dashboard");

}


}

catch(error){

Alert.alert(
"Login Failed",
"Invalid school code or credentials"
);

}

finally{

setLoading(false);

}

}



return (

<LinearGradient

colors={[
"#020617",
"#0f172a",
"#0369a1"
]}

style={styles.container}

>


<Text style={styles.logo}>
PreSense
</Text>


<Text style={styles.title}>
School Login
</Text>


<Text style={styles.subtitle}>
Enter your school details
</Text>



<View style={styles.card}>


<TextInput

placeholder="School Code"

placeholderTextColor="#94a3b8"

style={styles.input}

value={schoolCode}

onChangeText={setSchoolCode}

/>



<TextInput

placeholder="Email"

placeholderTextColor="#94a3b8"

style={styles.input}

value={email}

onChangeText={setEmail}

/>



<TextInput

placeholder="Password"

placeholderTextColor="#94a3b8"

secureTextEntry

style={styles.input}

value={password}

onChangeText={setPassword}

/>



<Pressable

style={styles.button}

onPress={submit}

>

{
loading ?

<ActivityIndicator color="#020617"/>

:

<Text style={styles.buttonText}>
LOGIN
</Text>

}

</Pressable>


</View>


</LinearGradient>

);

}



const styles=StyleSheet.create({

container:{
flex:1,
justifyContent:"center",
padding:25
},


logo:{
fontSize:48,
fontWeight:"900",
color:"#38bdf8",
textAlign:"center"
},


title:{
fontSize:34,
fontWeight:"900",
color:"#fff",
textAlign:"center",
marginTop:20
},


subtitle:{
color:"#cbd5e1",
textAlign:"center",
marginBottom:40,
marginTop:10
},


card:{
backgroundColor:"#0f172acc",
padding:25,
borderRadius:30
},


input:{
height:55,
backgroundColor:"#020617",
borderRadius:18,
paddingHorizontal:20,
color:"#fff",
marginBottom:15
},


button:{
height:55,
backgroundColor:"#38bdf8",
borderRadius:30,
alignItems:"center",
justifyContent:"center",
marginTop:10
},


buttonText:{
fontWeight:"900",
color:"#020617"
}

});
