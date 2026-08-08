import React from "react";
import {
  View,
  Text,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function Landing() {
  const features = [
    {
      icon: "analytics-outline",
      title: "Student Analytics",
      desc: "Real-time performance tracking & gradebooks",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600",
    },
    {
      icon: "document-text-outline",
      title: "Digital Results",
      desc: "Instant report cards & transcripts",
      image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=600",
    },
    {
      icon: "calendar-outline",
      title: "Smart Attendance",
      desc: "Automated daily logs & tracking",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=600",
    },
    {
      icon: "people-outline",
      title: "Parent Portal",
      desc: "Direct home-school communication link",
      image: "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=600",
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Brand Header */}
          <View style={styles.header}>
            <View style={styles.logoRow}>
              <View style={styles.logoContainer}>
                <Image
                  source={require("../../assets/images/presense-logo.png")}
                  style={styles.logo}
                />
              </View>
              <View style={styles.brandTitleGroup}>
                <Text style={styles.brand}>PreSense</Text>
               
              </View>
            </View>
          </View>

          {/* Hero Image Banner */}
          <View style={styles.heroCard}>
            <ImageBackground
              source={{
                uri: "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1000",
              }}
              style={styles.heroImage}
              imageStyle={{ borderRadius: 20 }}
            >
              <Image
                source={{
                  uri: "https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg",
                }}
                style={styles.worldMapOverlay}
                resizeMode="contain"
              />

              <LinearGradient
                colors={["transparent", "rgba(15, 23, 42, 0.65)", "rgba(15, 23, 42, 0.95)"]}
                style={styles.heroGradient}
              >
                
              </LinearGradient>
            </ImageBackground>
          </View>

          {/* Educational Features Header */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Key ERP Capabilities</Text>
            <Text style={styles.sectionSub}>Everything your institution needs to thrive</Text>
          </View>

          {/* Visual Feature Grid */}
          <View style={styles.featureGrid}>
            {features.map((item, index) => (
              <View key={index} style={styles.featureCard}>
                <ImageBackground
                  source={{ uri: item.image }}
                  style={styles.featureBgImage}
                  imageStyle={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
                >
                  <LinearGradient
                    colors={["rgba(0,0,0,0.02)", "rgba(0,0,0,0.45)"]}
                    style={styles.featureImageGradient}
                  >
                    <View style={styles.iconBadge}>
                      <Ionicons name={item.icon as any} size={16} color="#B91C1C" />
                    </View>
                  </LinearGradient>
                </ImageBackground>

                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{item.title}</Text>
                  <Text style={styles.featureDesc}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Single Action Button */}
          <View style={styles.actionContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => router.push("/login")}
            >
              <Text style={styles.primaryButtonText}>Sign In to Portal</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>Powered by PreSense Technologies</Text>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16, // Adjusted slightly for breathing room
    paddingBottom: 24,
    alignItems: "center",
  },

  /* Header */
  header: {
    width: "100%",
    paddingTop: 14, // Added top margin to lower header on screen
    marginBottom: 16,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  logo: {
    width: 28,
    height: 28,
    resizeMode: "contain",
  },
  brandTitleGroup: {
    marginLeft: 10,
  },
  brand: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 11,
    color: "#B91C1C",
    fontWeight: "600",
  },

  /* Hero Image Banner */
  heroCard: {
    width: "100%",
    height: 240, // Reduced height slightly to pull everything into perfect mobile view
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 20,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    justifyContent: "flex-end",
  },
  worldMapOverlay: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 140,
    height: 80,
    opacity: 0.25,
    tintColor: "#FFFFFF",
  },
  heroGradient: {
    width: "100%",
    padding: 16,
    paddingTop: 48,
    justifyContent: "flex-end",
  },
  heroPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  heroPillText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "800",
    lineHeight: 24,
  },
  heroSubtitle: {
    color: "#E2E8F0",
    fontSize: 11,
    marginTop: 4,
    lineHeight: 15,
    fontWeight: "400",
  },

  /* Section Header */
  sectionHeader: {
    width: "100%",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  sectionSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },

  /* Feature Grid */
  featureGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 20,
  },
  featureCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  featureBgImage: {
    height: 85,
    width: "100%",
  },
  featureImageGradient: {
    flex: 1,
    padding: 8,
    justifyContent: "flex-end",
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featureContent: {
    padding: 10,
  },
  featureTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
  featureDesc: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 3,
    lineHeight: 14,
  },

  /* Single Primary Action Button */
  actionContainer: {
    width: "100%",
    marginTop: 4,
  },
  primaryButton: {
    width: "100%",
    height: 48,
    backgroundColor: "#B91C1C",
    borderRadius: 24,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    shadowColor: "#B91C1C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },

  /* Footer */
  footer: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "500",
    marginTop: 20,
  },
});