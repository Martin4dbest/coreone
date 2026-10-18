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

const COREONE_GOLD = "#C58A00";
const COREONE_DARK = "#0F172A";
const COREONE_SLATE = "#475569";
const PAGE_BACKGROUND = "#F8FAFC";

export default function Landing() {
  const { width } = useWindowDimensions();

  const isDesktopWeb = Platform.OS === "web" && width >= 900;
  const isTablet = width >= 600 && width < 900;

  const features = [
    {
      icon: "analytics-outline",
      title: "Student Analytics",
      desc: "Real-time performance tracking & automated gradebooks.",
      image:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600",
    },
    {
      icon: "document-text-outline",
      title: "Digital Results",
      desc: "Instant report cards, transcripts, and secure archives.",
      image:
        "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=600",
    },
    {
      icon: "calendar-outline",
      title: "Smart Attendance",
      desc: "Automated daily logs and integrated leave tracking.",
      image:
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=600",
    },
    {
      icon: "people-outline",
      title: "Parent Portal",
      desc: "Direct home-school communication and portal updates.",
      image:
        "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=600",
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={PAGE_BACKGROUND}
      />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.mainWrapper,
              isDesktopWeb && styles.desktopWrapper,
            ]}
          >
            {/* ===================================================== */}
            {/* HEADER */}
            {/* ===================================================== */}

            <View style={styles.header}>
              <View style={styles.logoRow}>
                <View style={styles.logoContainer}>
                  <Image
                    source={require("../../assets/images/presense-logo.png")}
                    style={styles.logo}
                    contentFit="contain"
                  />
                </View>

                <Text style={styles.brand}>
                  Core
                  <Text style={styles.brandAccent}>One</Text>
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
                  <Text style={styles.headerLoginBtnText}>
                    Sign In
                  </Text>
                </Pressable>
              )}
            </View>

            {/* ===================================================== */}
            {/* HERO */}
            {/* ===================================================== */}

            <View
              style={[
                styles.heroContainer,
                isDesktopWeb && styles.heroDesktop,
              ]}
            >
              {/* Desktop text */}
              {isDesktopWeb && (
                <View style={styles.heroLeft}>
                  <View style={styles.heroPill}>
                    <Ionicons
                      name="sparkles-outline"
                      size={11}
                      color={COREONE_GOLD}
                    />

                    <Text style={styles.heroPillText}>
                      Next-Gen Education ERP
                    </Text>
                  </View>

                  <Text style={styles.heroTitleDesktop}>
                    Empowering{" "}
                    <Text style={styles.brandAccent}>
                      Modern
                    </Text>{" "}
                    Learning
                  </Text>

                  <Text style={styles.heroSubtitleDesktop}>
                    Seamlessly track student analytics, issue digital
                    report cards, and record attendance—all within one
                    unified, powerful portal.
                  </Text>

                  <Pressable
                    style={({ pressed }) => [
                      styles.primaryButton,
                      styles.desktopHeroBtn,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={() => router.push("/login")}
                  >
                    <Text style={styles.primaryButtonText}>
                      Sign In to Portal
                    </Text>

                    <Ionicons
                      name="arrow-forward"
                      size={18}
                      color={COREONE_DARK}
                    />
                  </Pressable>
                </View>
              )}

              {/* Hero image */}
              <View
                style={[
                  styles.heroCard,
                  isDesktopWeb && styles.heroCardDesktop,
                ]}
              >
                <Image
                  source={{
                    uri: "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1000",
                  }}
                  style={styles.heroImage}
                  contentFit="cover"
                  transition={200}
                />

                <LinearGradient
                  colors={[
                    "transparent",
                    "rgba(15, 23, 42, 0.45)",
                    "rgba(15, 23, 42, 0.92)",
                  ]}
                  style={styles.heroGradient}
                >
                  {!isDesktopWeb && (
                    <>
                      <View style={styles.heroPill}>
                        <Ionicons
                          name="sparkles-outline"
                          size={10}
                          color={COREONE_GOLD}
                        />

                        <Text style={styles.heroPillText}>
                          Next-Gen Education ERP
                        </Text>
                      </View>

                      <Text style={styles.heroTitle}>
                        Empowering{" "}
                        <Text style={styles.brandAccent}>
                          Modern
                        </Text>{" "}
                        Learning
                      </Text>

                      <Text style={styles.heroSubtitle}>
                        Seamlessly track analytics, results, and
                        attendance in one portal.
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </View>
            </View>

            {/* ===================================================== */}
            {/* SECTION HEADER */}
            {/* ===================================================== */}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Key Capabilities
              </Text>

              <Text style={styles.sectionSub}>
                Everything your institution needs to operate
                efficiently
              </Text>
            </View>

            {/* ===================================================== */}
            {/* FEATURE GRID */}
            {/* ===================================================== */}

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
                      colors={[
                        "transparent",
                        "rgba(15, 23, 42, 0.72)",
                      ]}
                      style={styles.featureImageGradient}
                    >
                      <View style={styles.iconBadge}>
                        <Ionicons
                          name={item.icon as any}
                          size={16}
                          color={COREONE_GOLD}
                        />
                      </View>
                    </LinearGradient>
                  </View>

                  <View style={styles.featureContent}>
                    <Text
                      style={styles.featureTitle}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>

                    <Text
                      style={styles.featureDesc}
                      numberOfLines={2}
                    >
                      {item.desc}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>

            {/* ===================================================== */}
            {/* MOBILE BUTTON */}
            {/* ===================================================== */}

            {!isDesktopWeb && (
              <View style={styles.actionContainer}>
                <Pressable
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => router.push("/login")}
                >
                  <Text style={styles.primaryButtonText}>
                    Sign In to Portal
                  </Text>

                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color={COREONE_DARK}
                  />
                </Pressable>
              </View>
            )}

            {/* ===================================================== */}
            {/* FOOTER */}
            {/* ===================================================== */}

            <View style={styles.footerContainer}>
              <Text style={styles.footer}>
                Powered by CoreOne Technologies
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  /* ========================================================= */
  /* GLOBAL */
  /* ========================================================= */

  container: {
    flex: 1,
    backgroundColor: PAGE_BACKGROUND,
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
    paddingBottom: 20,
    alignSelf: "center",
  },

  desktopWrapper: {
    maxWidth: 1120,
    paddingHorizontal: 32,
    paddingTop: 24,
  },

  /* ========================================================= */
  /* HEADER */
  /* ========================================================= */

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
  },

  logoContainer: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",

    borderWidth: 1,
    borderColor: "#E2E8F0",

    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,

    elevation: 2,
  },

  logo: {
    width: 34,
    height: 34,
  },

  brand: {
    marginLeft: 12,
    fontSize: 22,
    fontWeight: "800",
    color: COREONE_DARK,
    letterSpacing: -0.5,
  },

  brandAccent: {
    color: COREONE_GOLD,
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
    color: COREONE_DARK,
  },

  /* ========================================================= */
  /* HERO */
  /* ========================================================= */

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
    flex: 1,
    alignItems: "flex-start",
  },

  /*
   * VERY SMALL ERP LABEL
   */

  heroPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",

    paddingHorizontal: 8,
    paddingVertical: 4,

    borderRadius: 999,

    backgroundColor: "rgba(197, 138, 0, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(197, 138, 0, 0.22)",

    marginBottom: 10,
  },

  heroPillText: {
    marginLeft: 4,
    fontSize: 9,
    lineHeight: 11,
    fontWeight: "600",
    color: COREONE_GOLD,
    letterSpacing: 0,
  },

  heroTitleDesktop: {
    fontSize: 38,
    fontWeight: "800",
    color: COREONE_DARK,
    lineHeight: 46,
    letterSpacing: -1,
    marginBottom: 12,
  },

  heroSubtitleDesktop: {
    maxWidth: 520,
    fontSize: 15,
    lineHeight: 24,
    color: COREONE_SLATE,
    marginBottom: 22,
  },

  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 34,
    letterSpacing: -0.6,
    marginBottom: 8,
  },

  heroSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: "#E2E8F0",
    maxWidth: 440,
  },

  heroCard: {
    width: "100%",
    height: 290,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",

    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.10,
    shadowRadius: 18,

    elevation: 5,
  },

  heroCardDesktop: {
    flex: 1,
    minHeight: 360,
    height: 360,
  },

  heroImage: {
    width: "100%",
    height: "100%",
  },

  heroGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,

    justifyContent: "flex-end",

    padding: 22,
  },

  /* ========================================================= */
  /* BUTTONS */
  /* ========================================================= */

  primaryButton: {
    minHeight: 48,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 20,

    borderRadius: 12,

    backgroundColor: COREONE_GOLD,

    shadowColor: COREONE_GOLD,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.18,
    shadowRadius: 8,

    elevation: 3,
  },

  desktopHeroBtn: {
    minWidth: 190,
    alignSelf: "flex-start",
  },

  primaryButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: COREONE_DARK,
    marginRight: 8,
  },

  buttonPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },

  /* ========================================================= */
  /* SECTION */
  /* ========================================================= */

  sectionHeader: {
    width: "100%",
    alignItems: "center",
    marginBottom: 18,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COREONE_DARK,
    textAlign: "center",
    marginBottom: 5,
  },

  sectionSub: {
    fontSize: 13,
    lineHeight: 19,
    color: COREONE_SLATE,
    textAlign: "center",
    maxWidth: 520,
  },

  /* ========================================================= */
  /* FEATURE GRID */
  /* ========================================================= */

  featureGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  featureGridTablet: {
    justifyContent: "space-between",
  },

  featureGridDesktop: {
    gap: 18,
  },

  featureCard: {
    width: "48.5%",

    backgroundColor: "#FFFFFF",

    borderRadius: 14,
    overflow: "hidden",

    borderWidth: 1,
    borderColor: "#E2E8F0",

    marginBottom: 14,

    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.045,
    shadowRadius: 7,

    elevation: 2,
  },

  featureCardDesktop: {
    flex: 1,
    width: "auto",
    minWidth: 220,
    marginBottom: 0,
  },

  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },

  featureImageContainer: {
    width: "100%",
    height: 130,
    position: "relative",
    overflow: "hidden",
  },

  featureBgImage: {
    width: "100%",
    height: "100%",
  },

  featureImageGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,

    justifyContent: "flex-end",
    alignItems: "flex-start",

    padding: 12,
  },

  iconBadge: {
    width: 34,
    height: 34,

    borderRadius: 10,

    backgroundColor: "rgba(255, 255, 255, 0.96)",

    justifyContent: "center",
    alignItems: "center",

    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },

  featureContent: {
    padding: 14,
  },

  featureTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COREONE_DARK,
    marginBottom: 5,
  },

  featureDesc: {
    fontSize: 12,
    lineHeight: 18,
    color: COREONE_SLATE,
  },

  /* ========================================================= */
  /* ACTION */
  /* ========================================================= */

  actionContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 22,
  },

  /* ========================================================= */
  /* FOOTER */
  /* ========================================================= */

  footerContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 24,
  },

  footer: {
    fontSize: 11,
    color: "#94A3B8",
    textAlign: "center",
  },
});