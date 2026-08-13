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
  Dimensions,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const isDesktopWeb = Platform.OS === "web" && width >= 900;
const desktopContentWidth = Math.min(Math.max(width - 48, 320), 960);

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
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.mainWrapper}>
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
                <Text style={styles.brand}>
                  Pre<Text style={styles.brandAccent}>Sense</Text>
                </Text>
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
              imageStyle={styles.heroImageStyle}
            >
              <Image
                source={{
                  uri: "https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg",
                }}
                style={styles.worldMapOverlay}
                resizeMode="contain"
              />

              <LinearGradient
                colors={["transparent", "rgba(15, 23, 42, 0.6)", "rgba(15, 23, 42, 0.94)"]}
                style={styles.heroGradient}
              >
                <View style={styles.heroPill}>
                  <Ionicons name="sparkles" size={12} color="#FCA5A5" />
                  <Text style={styles.heroPillText}>Next-Gen Education ERP</Text>
                </View>
                <Text style={styles.heroTitle}>Empowering Modern Learning</Text>
                <Text style={styles.heroSubtitle}>
                  Seamlessly track analytics, results, and attendance in one unified portal.
                </Text>
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
                  imageStyle={{ borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
                >
                  <LinearGradient
                    colors={["rgba(0,0,0,0.02)", "rgba(15,23,42,0.65)"]}
                    style={styles.featureImageGradient}
                  >
                    <View style={styles.iconBadge}>
                      <Ionicons name={item.icon as any} size={14} color="#B91C1C" />
                    </View>
                  </LinearGradient>
                </ImageBackground>

                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.featureDesc} numberOfLines={2}>
                    {item.desc}
                  </Text>
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
        </View>
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
  mainWrapper: {
    flex: 1,
    paddingHorizontal: isDesktopWeb ? 0 : 16,
    paddingTop: Platform.OS === "ios" ? 4 : 10,
    paddingBottom: 10,
    justifyContent: "space-between",
    alignItems: "center",
    width: isDesktopWeb ? desktopContentWidth : "100%",
    alignSelf: "center",
  },

  /* Header */
  header: {
    width: "100%",
    marginBottom: 8,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  logo: {
    width: 24,
    height: 24,
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
  brandAccent: {
    color: "#B91C1C",
  },

  /* Hero Image Banner */
  heroCard: {
    width: "100%",
    flex: 1.1,
    minHeight: 140,
    maxHeight: isDesktopWeb ? 260 : 180,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 10,
    position: "relative",
    backgroundColor: "#E2E8F0",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    justifyContent: "flex-end",
  },
  heroImageStyle: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
    resizeMode: "cover",
  },
  worldMapOverlay: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 110,
    height: 60,
    opacity: 0.2,
    tintColor: "#FFFFFF",
  },
  heroGradient: {
    width: "100%",
    padding: 12,
    paddingTop: 20,
    justifyContent: "flex-end",
  },
  heroPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  heroPillText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: isDesktopWeb ? 22 : 16,
    fontWeight: "800",
    lineHeight: isDesktopWeb ? 26 : 20,
  },
  heroSubtitle: {
    color: "#CBD5E1",
    fontSize: isDesktopWeb ? 13 : 11,
    marginTop: 2,
    lineHeight: isDesktopWeb ? 17 : 14,
    fontWeight: "400",
  },

  /* Section Header */
  sectionHeader: {
    width: "100%",
    alignSelf: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: isDesktopWeb ? 18 : 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  sectionSub: {
    fontSize: isDesktopWeb ? 12 : 10,
    color: "#64748B",
    marginTop: 1,
  },

  /* Feature Grid */
  featureGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 8,
    marginBottom: 10,
    alignSelf: "center",
  },
  featureCard: {
    width: "48.5%",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  featureBgImage: {
    width: "100%",
    height: isDesktopWeb ? 70 : 55,
  },
  featureImageGradient: {
    flex: 1,
    padding: 6,
    justifyContent: "flex-end",
  },
  iconBadge: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 1,
  },
  featureContent: {
    padding: 8,
  },
  featureTitle: {
    fontSize: isDesktopWeb ? 13 : 11,
    fontWeight: "700",
    color: "#0F172A",
  },
  featureDesc: {
    fontSize: isDesktopWeb ? 11 : 9.5,
    color: "#64748B",
    marginTop: 1,
    lineHeight: 12,
  },

  /* Single Primary Action Button */
  actionContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 4,
  },
  primaryButton: {
    backgroundColor: "#B91C1C",
    borderRadius: 12,
    minHeight: 44,
    width: isDesktopWeb ? 280 : "100%",
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#B91C1C",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: isDesktopWeb ? 15 : 13,
    fontWeight: "700",
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },

  /* Footer */
  footer: {
    width: "100%",
    textAlign: "center",
    fontSize: 10,
    color: "#94A3B8",
    marginTop: 2,
    alignSelf: "center",
    fontWeight: "500",
  },
});