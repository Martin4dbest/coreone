import React,{useEffect,useState} from "react";
import {View,Text,ActivityIndicator,StyleSheet,ScrollView} from "react-native";
import {useLocalSearchParams} from "expo-router";
import {getCBTResult} from "@/services/cbt";

export default function CBTResult(){

const {attemptId}=useLocalSearchParams();

const [data,setData]=useState<any>();
const [loading,setLoading]=useState(true);

useEffect(()=>{

(async()=>{

try{

const r=await getCBTResult(Number(attemptId));
setData(r);

}finally{

setLoading(false);

}

})();

},[]);

if(loading){

return(

<View style={styles.center}>

<ActivityIndicator size="large"/>

<Text>Loading Result...</Text>

</View>

);

}

return(

<ScrollView contentContainerStyle={styles.container}>

<Text style={styles.title}>
{data.exam_title}
</Text>

<Text style={styles.score}>
Score: {data.score}/{data.total_marks}
</Text>

<Text style={styles.percent}>
Percentage: {data.percentage.toFixed(1)}%
</Text>

<Text style={[
styles.status,
{
color:data.passed?"green":"red"
}
]}>
{data.passed?"PASS":"FAIL"}
</Text>

<Text style={styles.heading}>
Questions
</Text>

{data.questions.map((q:any)=>(

<View key={q.question_id} style={styles.card}>

<Text style={styles.question}>
{q.question}
</Text>

<Text>
Your Answer: {q.selected_answer}
</Text>

<Text>
Correct Answer: {q.correct_answer}
</Text>

<Text>
Marks: {q.marks_awarded}/{q.marks}
</Text>

</View>

))}

</ScrollView>

);

}

const styles=StyleSheet.create({

container:{
padding:20
},

center:{
flex:1,
justifyContent:"center",
alignItems:"center"
},

title:{
fontSize:24,
fontWeight:"700",
marginBottom:20
},

score:{
fontSize:20,
marginBottom:10
},

percent:{
fontSize:18,
marginBottom:10
},

status:{
fontSize:22,
fontWeight:"700",
marginBottom:25
},

heading:{
fontSize:20,
fontWeight:"700",
marginBottom:15
},

card:{
backgroundColor:"#fff",
padding:15,
marginBottom:12,
borderRadius:12
},

question:{
fontWeight:"700",
marginBottom:10
}

});
