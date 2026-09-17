import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function StaffDocumentsScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>
        Documents
      </Text>

      <Text style={styles.subtitle}>
        Access documents made available to you by your
        school.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Staff Documents
        </Text>

        <Text style={styles.cardText}>
          Document management is not currently present in
          the CoreOne backend. The backend module will need
          to be created before documents can be uploaded,
          assigned, or downloaded.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0F172A",
  },
  subtitle: {
    marginTop: 7,
    fontSize: 14,
    color: "#64748B",
    lineHeight: 21,
  },
  card: {
    marginTop: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  cardText: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 22,
    color: "#64748B",
  },
});
