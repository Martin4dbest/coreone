import React, { useEffect, useState } from "react";
import {
View,
  Text,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";

const { width: screenWidth } = Dimensions.get("window");
const isDesktopWeb = Platform.OS === "web" && screenWidth >= 900;
const desktopMaxWidth = Math.min(
  Math.max(screenWidth - 48, 320),
  1180
);


import { getStudentResults } from "@/services/student";
import { Redirect } from "expo-router";

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

      <Text style={styles.summaryText}>
        Class: {result.student.class}
      </Text>

      <Text style={styles.summaryText}>
        Session: {result.session}
      </Text>

      <Text style={styles.summaryText}>
        Term: {result.term}
      </Text>

      <Text style={styles.summaryText}>
        Position: {result.position}
      </Text>

      <Text style={styles.summaryText}>
        Average: {result.average}
      </Text>

      <Text style={styles.summaryText}>
        Attendance: {result.attendance}%
      </Text>

      <View style={{height:20}} />

      {result.subjects.map((subject:any,index:number)=>(
        <View
          key={index}
          style={styles.card}
        >
          <Text style={styles.subjectTitle}>{subject.name}</Text>

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
    paddingHorizontal: isDesktopWeb ? 32 : 20,
    paddingTop: isDesktopWeb ? 28 : 20,
    paddingBottom: isDesktopWeb ? 40 : 20,
    backgroundColor:"#fff",
    width: isDesktopWeb ? desktopMaxWidth : "100%",
    maxWidth: isDesktopWeb ? 1100 : undefined,
    alignSelf: "center",
  },
  center:{
    flex:1,
    justifyContent:"center",
    alignItems:"center",
  },
  title:{
    fontSize: isDesktopWeb ? 30 : 24,
    fontWeight:"800",
    marginBottom: isDesktopWeb ? 24 : 20,
    color:"#0F172A",
  },
  summaryText:{
    fontSize: isDesktopWeb ? 15 : 14,
    lineHeight: isDesktopWeb ? 22 : 20,
    color:"#475569",
    marginBottom: 4,
  },
  subjectTitle:{
    fontSize: isDesktopWeb ? 18 : 15,
    fontWeight:"800",
    color:"#0F172A",
    marginBottom: 8,
  },
  card:{
    width: "100%",
    maxWidth: isDesktopWeb ? 900 : undefined,
    alignSelf: "center",
    marginBottom: isDesktopWeb ? 16 : 15,
    padding: isDesktopWeb ? 18 : 15,
    borderRadius: isDesktopWeb ? 14 : 10,
    borderWidth:1,
    borderColor:"#E2E8F0",
    backgroundColor:"#FFFFFF",
  },
});
