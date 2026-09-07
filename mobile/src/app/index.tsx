// @ts-nocheck
import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  useWindowDimensions,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function Landing() {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === "web" && width >= 900;
  const isTablet = width >= 600 && width < 900;

  const features = [
    {
      icon: "analytics-outline",
      title: "Student Analytics",
      desc: "Real-time performance tracking & automated gradebooks.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600",
    },
    {
      icon: "document-text-outline",
      title: "Digital Results",
      desc: "Instant report cards, transcripts, and secure archives.",
      image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=600",
    },
    {
      icon: "calendar-outline",
      title: "Smart Attendance",
      desc: "Automated daily logs and integrated leave tracking.",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=600",
    },
    {
      icon: "people-outline",
      title: "Parent Portal",
      desc: "Direct home-school communication and portal updates.",
      image: "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=600",
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.mainWrapper, isDesktopWeb && styles.desktopWrapper]}>
            {/* Header / Navbar */}
            <View style={styles.header}>
              <View style={styles.logoRow}>
                <View style={styles.logoContainer}>
                  <Ionicons name="school-outline" size={24} color="#B91C1C" />
                </View>
                <Text style={styles.brand}>
                  Pre<Text style={styles.brandAccent}>Sense</Text>
                </Text>
              </View>

              {isDesktopWeb && (
                <Pressable
                  style={({ pressed }) => [
                    styles.headerLoginBtn,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => router.push("/login")}
                >
                  <Text style={styles.headerLoginBtnText}>Sign In</Text>
                </Pressable>
              )}
            </View>

            {/* Hero Section */}
            <View style={[styles.heroContainer, isDesktopWeb && styles.heroDesktop]}>
              {/* Desktop Left Column */}
              {isDesktopWeb && (
                <View style={styles.heroLeft}>
                  <View style={styles.heroPill}>
                    <Ionicons name="sparkles" size={14} color="#DC2626" />
                    <Text style={styles.heroPillText}>Next-Gen Education ERP</Text>
                  </View>
                  <Text style={styles.heroTitleDesktop}>
                    Empowering <Text style={styles.brandAccent}>Modern</Text> Learning
                  </Text>
                  <Text style={styles.heroSubtitleDesktop}>
                    Seamlessly track student analytics, issue digital report cards, and record attendance—all within one unified, powerful portal.
                  </Text>

                  <Pressable
                    style={({ pressed }) => [
                      styles.primaryButton,
                      styles.desktopHeroBtn,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={() => router.push("/login")}
                  >
                    <Text style={styles.primaryButtonText}>Sign In to Portal</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                  </Pressable>
                </View>
              )}

              {/* Hero Image Card */}
              <View style={[styles.heroCard, isDesktopWeb && styles.heroCardDesktop]}>
                <Image
                  source={{
                    uri: "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1000",
                  }}
                  style={styles.heroImage}
                  contentFit="cover"
                  transition={200}
                />

                <LinearGradient
                  colors={["transparent", "rgba(15, 23, 42, 0.45)", "rgba(15, 23, 42, 0.92)"]}
                  style={styles.heroGradient}
                >
                  {!isDesktopWeb && (
                    <>
                      <View style={styles.heroPill}>
                        <Ionicons name="sparkles" size={12} color="#DC2626" />
                        <Text style={styles.heroPillText}>Next-Gen Education ERP</Text>
                      </View>
                      <Text style={styles.heroTitle}>Empowering Modern Learning</Text>
                      <Text style={styles.heroSubtitle}>
                        Seamlessly track analytics, results, and attendance in one portal.
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </View>
            </View>

            {/* Section Header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Key Capabilities</Text>
              <Text style={styles.sectionSub}>
                Everything your institution needs to operate efficiently
              </Text>
            </View>

            {/* Feature Grid */}
            <View
              style={[
                styles.featureGrid,
                isDesktopWeb && styles.featureGridDesktop,
                isTablet && styles.featureGridTablet,
              ]}
            >
              {features.map((item, index) => (
                <Pressable
                  key={index}
                  style={({ pressed }) => [
                    styles.featureCard,
                    isDesktopWeb && styles.featureCardDesktop,
                    pressed && styles.cardPressed,
                  ]}
                >
                  <View style={styles.featureImageContainer}>
                    <Image
                      source={{ uri: item.image }}
                      style={styles.featureBgImage}
                      contentFit="cover"
                      transition={200}
                    />
                    <LinearGradient
                      colors={["transparent", "rgba(15, 23, 42, 0.7)"]}
                      style={styles.featureImageGradient}
                    >
                      <View style={styles.iconBadge}>
                        <Ionicons name={item.icon as any} size={16} color="#B91C1C" />
                      </View>
                    </LinearGradient>
                  </View>

                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.featureDesc} numberOfLines={2}>
                      {item.desc}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>

            {/* Mobile Action Button */}
            {!isDesktopWeb && (
              <View style={styles.actionContainer}>
                <Pressable
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => router.push("/login")}
                >
                  <Text style={styles.primaryButtonText}>Sign In to Portal</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </Pressable>
              </View>
            )}

            {/* Footer */}
            <View style={styles.footerContainer}>
              <Text style={styles.footer}>Powered by PreSense Technologies</Text>
            </View>
          </View>
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
    flexGrow: 1,
    paddingBottom: 24,
  },
  mainWrapper: {
    width: "100%",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 8 : 16,
    alignSelf: "center",
  },
  desktopWrapper: {
    maxWidth: 1120,
    paddingHorizontal: 32,
    paddingTop: 24,
  },

  /* Header */
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  brand: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  brandAccent: {
    color: "#B91C1C",
  },
  headerLoginBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  headerLoginBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },

  /* Hero Layout */
  heroContainer: {
    width: "100%",
    marginBottom: 28,
  },
  heroDesktop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 40,
    marginVertical: 12,
  },
  heroLeft: {
    flex: 1.1,
    alignItems: "flex-start",
  },
  heroTitleDesktop: {
    fontSize: 38,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 46,
    marginVertical: 12,
    letterSpacing: -0.5,
  },
  heroSubtitleDesktop: {
    fontSize: 16,
    color: "#475569",
    lineHeight: 24,
    marginBottom: 24,
  },
  desktopHeroBtn: {
    width: 220,
  },

  heroCard: {
    width: "100%",
    height: 200,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
    backgroundColor: "#E2E8F0",
    position: "relative",
  },
  heroCardDesktop: {
    flex: 1,
    height: 320,
  },
  heroImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
  },
  heroGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "flex-end",
    padding: 16,
  },
  heroPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
    marginBottom: 8,
  },
  heroPillText: {
    color: "#0F172A",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 24,
  },
  heroSubtitle: {
    color: "#E2E8F0",
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },

  /* Section Header */
  sectionHeader: {
    width: "100%",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },

  /* Feature Grid */
  featureGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 14,
    marginBottom: 24,
  },
  featureGridTablet: {
    rowGap: 16,
  },
  featureGridDesktop: {
    rowGap: 20,
  },
  featureCard: {
    width: "48%",
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  featureCardDesktop: {
    width: "23.5%",
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  featureImageContainer: {
    width: "100%",
    height: 80,
    position: "relative",
  },
  featureBgImage: {
    width: "100%",
    height: "100%",
  },
  featureImageGradient: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
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
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  featureContent: {
    padding: 12,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  featureDesc: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 3,
    lineHeight: 15,
  },

  /* Action Button */
  actionContainer: {
    width: "100%",
    alignItems: "center",
    marginVertical: 8,
  },
  primaryButton: {
    backgroundColor: "#B91C1C",
    borderRadius: 14,
    height: 48,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#B91C1C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },

  /* Footer */
  footerContainer: {
    marginTop: 16,
    alignItems: "center",
  },
  footer: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "500",
  },
});