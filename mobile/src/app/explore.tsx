import { 
View,
Text,
StyleSheet
} from "react-native";


export default function Explore(){

return (

<View style={styles.container}>

<Text style={styles.title}>
PreSense
</Text>

<Text style={styles.text}>
Smart School Platform
</Text>

</View>

);

}


const styles = StyleSheet.create({

container:{
flex:1,
alignItems:"center",
justifyContent:"center",
backgroundColor:"#020617"
},

title:{
fontSize:36,
fontWeight:"900",
color:"#38bdf8"
},

text:{
marginTop:10,
fontSize:18,
color:"#94a3b8"
}

});
