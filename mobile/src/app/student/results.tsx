// @ts-nocheck

import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import { getStudentResults } from "@/services/student";

export default function StudentResults() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadResults = async () => {
    try {
      setError("");

      const data = await getStudentResults();

      setResults(data);
    } catch (err: any) {
      console.log(
        "Student results error:",
        err?.response?.data || err.message
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to load results"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  useEffect(() => {
    loadResults();
  }, []);


  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadResults();
  }, []);


  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>
            Loading results...
          </Text>
        </View>
      </SafeAreaView>
    );
  }


  if (error || !results) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={50}
            color="#D4AF37"
          />

          <Text style={styles.errorText}>
            {error || "No results found"}
          </Text>

          <Pressable
            style={styles.retryButton}
            onPress={loadResults}
          >
            <Text style={styles.retryText}>
              Retry
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }


  const primary =
    results.school?.primary_color || "#0F172A";

  const accent =
    results.school?.accent_color || "#D4AF37";


  return (
    <SafeAreaView style={styles.container}>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >

        {/* SCHOOL HEADER */}

        <View
          style={[
            styles.schoolCard,
            {
              borderColor: accent,
            },
          ]}
        >

          {results.school?.logo ? (
            <Image
              source={{
                uri: results.school.logo,
              }}
              style={styles.logo}
              contentFit="contain"
            />
          ) : (
            <View
              style={[
                styles.logoFallback,
                {
                  backgroundColor: primary,
                },
              ]}
            >
              <Text style={styles.logoText}>
                {results.school?.name?.charAt(0)}
              </Text>
            </View>
          )}


          <View style={styles.schoolInfo}>
            <Text style={styles.schoolName}>
              {results.school?.name}
            </Text>

            <Text style={styles.motto}>
              {results.school?.motto}
            </Text>

            <Text style={styles.session}>
              {results.session} • {results.term}
            </Text>
          </View>

        </View>



        {/* STUDENT PROFILE */}

        <View
          style={[
            styles.studentCard,
            {
              backgroundColor: primary,
            },
          ]}
        >

          <Text style={styles.studentName}>
            {results.student?.name}
          </Text>


          <View style={styles.row}>

            <Text style={styles.whiteText}>
              Class: {results.student?.class}
            </Text>

            <Text style={styles.whiteText}>
              Position: {results.position || "-"}
            </Text>

          </View>


          <View style={styles.row}>

            <Text style={styles.whiteText}>
              Average: {results.average}%
            </Text>

            <Text style={styles.whiteText}>
              Attendance: {results.attendance}%
            </Text>

          </View>

        </View>



        {/* SUMMARY */}

        <View style={styles.summaryCard}>

          <Text style={styles.sectionTitle}>
            Performance Summary
          </Text>


          <Text style={styles.remark}>
            {results.remark}
          </Text>


          <Text style={styles.total}>
            Total Score: {results.total}
          </Text>

        </View>



        {/* SUBJECT RESULTS */}

        <Text style={styles.sectionTitle}>
          Subjects
        </Text>


        {results.subjects?.map(
          (subject: any, index: number) => (

          <View
            key={index}
            style={styles.subjectCard}
          >

            <View style={styles.subjectHeader}>

              <Text style={styles.subjectName}>
                {subject.name}
              </Text>


              <Text style={styles.grade}>
                {subject.grade}
              </Text>

            </View>


            <View style={styles.row}>
              <Text>
                CA: {subject.ca}
              </Text>

              <Text>
                Exam: {subject.exam}
              </Text>

              <Text>
                Total: {subject.total}
              </Text>
            </View>


            <Text style={styles.remarkText}>
              {subject.remark}
            </Text>


          </View>

        ))}



        {/* COMMENTS */}

        <View style={styles.commentCard}>

          <Text style={styles.sectionTitle}>
            Comments
          </Text>


          <Text>
            Teacher:
          </Text>

          <Text style={styles.comment}>
            {results.comments?.teacher ||
              "No comment"}
          </Text>


          <Text>
            Principal:
          </Text>

          <Text style={styles.comment}>
            {results.comments?.principal ||
              "No comment"}
          </Text>


        </View>


      </ScrollView>

    </SafeAreaView>
  );
}



const styles = StyleSheet.create({

  container:{
    flex:1,
    backgroundColor:"#F8FAFC",
  },


  content:{
    padding:20,
  },


  loadingContainer:{
    flex:1,
    justifyContent:"center",
    alignItems:"center",
  },


  loadingText:{
    marginTop:12,
    color:"#64748B",
  },


  errorText:{
    marginTop:15,
    color:"#64748B",
    textAlign:"center",
  },


  retryButton:{
    marginTop:20,
    paddingHorizontal:25,
    paddingVertical:10,
    borderRadius:10,
    backgroundColor:"#0F172A",
  },


  retryText:{
    color:"#FFFFFF",
    fontWeight:"700",
  },


  schoolCard:{
    flexDirection:"row",
    alignItems:"center",
    backgroundColor:"#FFFFFF",
    padding:15,
    borderRadius:16,
    borderWidth:1,
    marginBottom:15,
  },


  logo:{
    width:55,
    height:55,
    borderRadius:10,
  },


  logoFallback:{
    width:55,
    height:55,
    borderRadius:10,
    alignItems:"center",
    justifyContent:"center",
  },


  logoText:{
    color:"#FFFFFF",
    fontSize:22,
    fontWeight:"800",
  },


  schoolInfo:{
    marginLeft:12,
    flex:1,
  },


  schoolName:{
    fontSize:16,
    fontWeight:"800",
  },


  motto:{
    color:"#64748B",
    fontSize:12,
  },


  session:{
    marginTop:5,
    fontSize:12,
    fontWeight:"600",
  },


  studentCard:{
    padding:20,
    borderRadius:18,
    marginBottom:15,
  },


  studentName:{
    color:"#FFFFFF",
    fontSize:20,
    fontWeight:"800",
    marginBottom:15,
  },


  row:{
    flexDirection:"row",
    justifyContent:"space-between",
    marginTop:8,
  },


  whiteText:{
    color:"#FFFFFF",
    fontSize:13,
  },


  summaryCard:{
    backgroundColor:"#FFFFFF",
    padding:18,
    borderRadius:16,
    marginBottom:15,
  },


  sectionTitle:{
    fontSize:17,
    fontWeight:"800",
    marginBottom:10,
  },


  remark:{
    fontWeight:"700",
  },


  total:{
    marginTop:8,
    fontWeight:"700",
  },


  subjectCard:{
    backgroundColor:"#FFFFFF",
    padding:15,
    borderRadius:15,
    marginBottom:12,
  },


  subjectHeader:{
    flexDirection:"row",
    justifyContent:"space-between",
  },


  subjectName:{
    fontWeight:"800",
    fontSize:15,
  },


  grade:{
    fontWeight:"900",
    fontSize:16,
  },


  remarkText:{
    marginTop:8,
    color:"#64748B",
  },


  commentCard:{
    backgroundColor:"#FFFFFF",
    padding:18,
    borderRadius:16,
    marginTop:10,
  },


  comment:{
    marginBottom:10,
    color:"#64748B",
  },


});
