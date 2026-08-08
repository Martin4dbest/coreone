import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from "react-native";

import { getStudentResults } from "@/services/student";

export default function StudentResults() {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const data = await getStudentResults();
      setResult(data);
    } catch (e: any) {
      console.log(e?.response?.data);
      setError(
        e?.response?.data?.detail ||
        "Unable to load result."
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading Result...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        {result.student.name}
      </Text>

      <Text>
        Class: {result.student.class}
      </Text>

      <Text>
        Session: {result.session}
      </Text>

      <Text>
        Term: {result.term}
      </Text>

      <Text>
        Position: {result.position}
      </Text>

      <Text>
        Average: {result.average}
      </Text>

      <Text>
        Attendance: {result.attendance}%
      </Text>

      <View style={{height:20}} />

      {result.subjects.map((subject:any,index:number)=>(
        <View
          key={index}
          style={styles.card}
        >
          <Text>{subject.name}</Text>

          <Text>
            CA: {subject.ca}
          </Text>

          <Text>
            Exam: {subject.exam}
          </Text>

          <Text>
            Total: {subject.total}
          </Text>

          <Text>
            Grade: {subject.grade}
          </Text>

          <Text>
            Remark: {subject.remark}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:{
    flex:1,
    padding:20,
    backgroundColor:"#fff",
  },
  center:{
    flex:1,
    justifyContent:"center",
    alignItems:"center",
  },
  title:{
    fontSize:24,
    fontWeight:"700",
    marginBottom:20,
  },
  card:{
    marginBottom:15,
    padding:15,
    borderRadius:10,
    borderWidth:1,
    borderColor:"#ddd",
  },
});
