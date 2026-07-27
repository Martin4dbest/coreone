import {
View,
Text,
StyleSheet
} from "react-native";


export default function TeacherDashboard(){

return (

<View style={styles.container}>

<Text style={styles.title}>
Teacher Dashboard
</Text>

<Text style={styles.subtitle}>
PreSense School Platform
</Text>

</View>

);

}


const styles = StyleSheet.create({

container:{
flex:1,
backgroundColor:"#020617",
justifyContent:"center",
alignItems:"center"
},

title:{
fontSize:32,
fontWeight:"900",
color:"#fff"
},

subtitle:{
marginTop:10,
color:"#38bdf8"
}

});
