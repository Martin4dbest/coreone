import React from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1000";

const FEATURES = [
  {
    title: "Student Analytics",
    description: "Real-time performance tracking & automated gradebooks.",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600",
    icon: "analytics-outline" as const,
  },
  {
    title: "Digital Results",
    description: "Instant report cards, transcripts, and secure archives.",
    image:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=600",
    icon: "document-text-outline" as const,
  },
  {
    title: "Smart Attendance",
    description: "Automated daily logs and integrated leave tracking.",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=600",
    icon: "calendar-outline" as const,
  },
  {
    title: "Parent Portal",
    description: "Direct home-school communication and portal updates.",
    image:
      "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=600",
    icon: "people-outline" as const,
  },
];

export default function HomeScreen() {
  const isDesktop = Platform.OS === "web" && width >= 900;
  const isTablet =
    Platform.OS === "web" && width >= 600 && width < 900;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* =========================================================
            HEADER
        ========================================================= */}

        <View
          style={[
            styles.header,
            isTablet && styles.headerTablet,
            isDesktop && styles.headerDesktop,
          ]}
        >
          <Pressable
            style={styles.brand}
            onPress={() => router.push("/")}
          >
            <Image
              source={require("../../assets/images/coreone-logo1.jpeg")}
              style={styles.logo}
              resizeMode="contain"
            />

            <Text style={styles.brandName}>CoreOne</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.signInButton,
              pressed && styles.pressed,
            ]}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.signInText}>Sign In</Text>

            <Ionicons
              name="arrow-forward"
              size={15}
              color="#FFFFFF"
            />
          </Pressable>
        </View>

        {/* =========================================================
            HERO
        ========================================================= */}

        <View
          style={[
            styles.hero,
            isTablet && styles.heroTablet,
            isDesktop && styles.heroDesktop,
          ]}
        >
          <View
            style={[
              styles.heroCopy,
              isTablet && styles.heroCopyTablet,
              isDesktop && styles.heroCopyDesktop,
            ]}
          >
            <View style={styles.eyebrow}>
              <View style={styles.eyebrowDot} />

              <Text style={styles.eyebrowText}>
                NEXT-GENERATION EDUCATION ERP
              </Text>
            </View>

            <Text
              style={[
                styles.heroTitle,
                isTablet && styles.heroTitleTablet,
                isDesktop && styles.heroTitleDesktop,
              ]}
            >
              Next-Gen{"\n"}
              <Text style={styles.redText}>Education ERP</Text>
            </Text>

            <Text
              style={[
                styles.heroSubtitle,
                isTablet && styles.heroSubtitleTablet,
                isDesktop && styles.heroSubtitleDesktop,
              ]}
            >
              Empowering Modern Learning
            </Text>

            <Text
              style={[
                styles.heroDescription,
                isTablet && styles.heroDescriptionTablet,
                isDesktop && styles.heroDescriptionDesktop,
              ]}
            >
              Seamlessly track student analytics, issue digital
              report cards, and record attendance—all within one
              unified, powerful portal.
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.heroButton,
                pressed && styles.pressed,
              ]}
              onPress={() => router.push("/login")}
            >
              <Text style={styles.heroButtonText}>
                Sign In to Portal
              </Text>

              <View style={styles.heroButtonIcon}>
                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color="#FFFFFF"
                />
              </View>
            </Pressable>

            <View style={styles.heroTrust}>
              <View style={styles.trustLine} />

              <Text style={styles.trustText}>
                ONE PLATFORM. EVERY SCHOOL.
              </Text>

              <View style={styles.trustLine} />
            </View>
          </View>

          {/* HERO VISUAL */}

          <View
            style={[
              styles.heroVisual,
              isTablet && styles.heroVisualTablet,
              isDesktop && styles.heroVisualDesktop,
            ]}
          >
            <View style={styles.heroImageCard}>
              <Image
                source={{ uri: HERO_IMAGE }}
                style={styles.heroImage}
                resizeMode="cover"
              />

              <LinearGradient
                colors={[
                  "transparent",
                  "rgba(16,28,50,0.04)",
                  "rgba(16,28,50,0.48)",
                ]}
                style={styles.heroImageGradient}
              />

              <View style={styles.heroImageBadge}>
                <View style={styles.heroBadgeIcon}>
                  <Ionicons
                    name="school-outline"
                    size={17}
                    color="#FFFFFF"
                  />
                </View>

                <View>
                  <Text style={styles.heroBadgeTitle}>
                    Unified Education
                  </Text>

                  <Text style={styles.heroBadgeSubtitle}>
                    Management Platform
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.floatingCard}>
              <View style={styles.floatingIcon}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={17}
                  color="#E5395F"
                />
              </View>

              <View style={styles.floatingCopy}>
                <Text style={styles.floatingTitle}>
                  Everything Connected
                </Text>

                <Text style={styles.floatingSubtitle}>
                  Students • Teachers • Parents
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* =========================================================
            CAPABILITIES
        ========================================================= */}

        <View
          style={[
            styles.capabilities,
            isDesktop && styles.capabilitiesDesktop,
          ]}
        >
          <View style={styles.sectionHeading}>
            <View style={styles.sectionLabel}>
              <View style={styles.sectionLabelLine} />

              <Text style={styles.sectionLabelText}>
                KEY CAPABILITIES
              </Text>
            </View>

            <Text
              style={[
                styles.sectionTitle,
                isTablet && styles.sectionTitleTablet,
                isDesktop && styles.sectionTitleDesktop,
              ]}
            >
              Everything your institution needs{" "}
              <Text style={styles.redText}>
                to operate efficiently
              </Text>
            </Text>

            <Text
              style={[
                styles.sectionDescription,
                isDesktop && styles.sectionDescriptionDesktop,
              ]}
            >
              Everything you need to manage learning,
              administration, communication and student
              performance in one connected platform.
            </Text>
          </View>

          <View
            style={[
              styles.featureGrid,
              isTablet && styles.featureGridTablet,
              isDesktop && styles.featureGridDesktop,
            ]}
          >
            {FEATURES.map((feature) => (
              <View
                key={feature.title}
                style={[
                  styles.featureCard,
                  isTablet && styles.featureCardTablet,
                  isDesktop && styles.featureCardDesktop,
                ]}
              >
                <View style={styles.featureImageContainer}>
                  <Image
                    source={{ uri: feature.image }}
                    style={styles.featureImage}
                    resizeMode="cover"
                  />

                  <View style={styles.featureOverlay} />

                  <View style={styles.featureIcon}>
                    <Ionicons
                      name={feature.icon}
                      size={19}
                      color="#FFFFFF"
                    />
                  </View>
                </View>

                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>
                    {feature.title}
                  </Text>

                  <Text style={styles.featureDescription}>
                    {feature.description}
                  </Text>

                  <View style={styles.featureArrow}>
                    <Ionicons
                      name="arrow-forward"
                      size={14}
                      color="#E5395F"
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* =========================================================
            CTA
        ========================================================= */}

        <View
          style={[
            styles.ctaSection,
            isDesktop && styles.ctaSectionDesktop,
          ]}
        >
          <LinearGradient
            colors={["#101C32", "#182943"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.cta,
              isDesktop && styles.ctaDesktop,
            ]}
          >
            <View style={styles.ctaCircleOne} />
            <View style={styles.ctaCircleTwo} />

            <View style={styles.ctaContent}>
              <Text style={styles.ctaEyebrow}>
                COREONE EDUCATION PLATFORM
              </Text>

              <Text
                style={[
                  styles.ctaTitle,
                  isTablet && styles.ctaTitleTablet,
                  isDesktop && styles.ctaTitleDesktop,
                ]}
              >
                Modernise the way{"\n"}your school operates.
              </Text>

              <Text style={styles.ctaDescription}>
                Give your school one connected platform for
                learning, administration, communication and
                student management.
              </Text>

              <Pressable
                style={({ pressed }) => [
                  styles.ctaButton,
                  pressed && styles.pressed,
                ]}
                onPress={() => router.push("/login")}
              >
                <Text style={styles.ctaButtonText}>
                  Sign In to Portal
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color="#101C32"
                />
              </Pressable>
            </View>
          </LinearGradient>
        </View>

        {/* =========================================================
            FOOTER
        ========================================================= */}

        <View style={styles.footer}>
          <Image
            source={require("../../assets/images/coreone-logo1.jpeg")}
            style={styles.footerLogo}
            resizeMode="contain"
          />

          <Text style={styles.footerBrand}>CoreOne</Text>

          <Text style={styles.footerTagline}>
            Modern education management, unified.
          </Text>

          <Text style={styles.footerCopyright}>
            © {new Date().getFullYear()} CoreOne. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  /* =========================================================
     GLOBAL
  ========================================================= */

  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  scroll: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  scrollContent: {
    paddingBottom: 0,
  },

  pressed: {
    opacity: 0.82,
  },

  /* =========================================================
     HEADER
  ========================================================= */

  header: {
    minHeight: 70,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEF1F5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerTablet: {
    paddingHorizontal: 32,
  },

  headerDesktop: {
    width: "100%",
    maxWidth: 1180,
    minHeight: 76,
    alignSelf: "center",
    paddingHorizontal: 0,
    borderBottomWidth: 0,
    backgroundColor: "#F8FAFC",
  },

  brand: {
    flexDirection: "row",
    alignItems: "center",
  },

  logo: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },

  brandName: {
    marginLeft: 9,
    color: "#101C32",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
  },

  signInButton: {
    minHeight: 39,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#101C32",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  signInText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  /* =========================================================
     HERO
  ========================================================= */

  hero: {
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 60,
  },

  heroTablet: {
    paddingHorizontal: 32,
    paddingTop: 50,
  },

  heroDesktop: {
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
    paddingHorizontal: 0,
    paddingTop: 66,
    paddingBottom: 92,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 65,
  },

  heroCopy: {
    width: "100%",
  },

  heroCopyTablet: {
    maxWidth: 650,
    alignSelf: "center",
  },

  heroCopyDesktop: {
    flex: 1,
    maxWidth: 525,
  },

  eyebrow: {
    alignSelf: "flex-start",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 25,
    backgroundColor: "#FFF0F3",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  eyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 10,
    backgroundColor: "#E5395F",
    marginRight: 7,
  },

  eyebrowText: {
    color: "#C82D4D",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },

  heroTitle: {
    color: "#101C32",
    fontSize: 36,
    lineHeight: 41,
    fontWeight: "900",
    letterSpacing: -1.2,
  },

  heroTitleTablet: {
    fontSize: 42,
    lineHeight: 47,
  },

  heroTitleDesktop: {
    fontSize: 51,
    lineHeight: 56,
    letterSpacing: -1.9,
  },

  redText: {
    color: "#E5395F",
  },

  heroSubtitle: {
    marginTop: 12,
    color: "#26364E",
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
  },

  heroSubtitleTablet: {
    fontSize: 20,
    lineHeight: 26,
  },

  heroSubtitleDesktop: {
    fontSize: 21,
    lineHeight: 27,
  },

  heroDescription: {
    marginTop: 12,
    maxWidth: 490,
    color: "#667085",
    fontSize: 14,
    lineHeight: 22,
  },

  heroDescriptionTablet: {
    fontSize: 15,
    lineHeight: 24,
  },

  heroDescriptionDesktop: {
    fontSize: 14.5,
    lineHeight: 24,
  },

  heroButton: {
    marginTop: 23,
    alignSelf: "flex-start",
    minHeight: 47,
    paddingLeft: 18,
    paddingRight: 6,
    borderRadius: 13,
    backgroundColor: "#E5395F",
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    shadowColor: "#E5395F",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 4,
  },

  heroButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  heroButtonIcon: {
    width: 35,
    height: 35,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },

  heroTrust: {
    marginTop: 21,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  trustLine: {
    width: 22,
    height: 1,
    backgroundColor: "#D5DAE2",
  },

  trustText: {
    color: "#98A2B3",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.8,
  },

  /* =========================================================
     HERO VISUAL
  ========================================================= */

  heroVisual: {
    width: "100%",
    marginTop: 43,
    paddingBottom: 19,
    position: "relative",
  },

  heroVisualTablet: {
    maxWidth: 650,
    alignSelf: "center",
  },

  heroVisualDesktop: {
    flex: 1,
    maxWidth: 535,
    marginTop: 0,
  },

  heroImageCard: {
    width: "100%",
    height: width < 500 ? 290 : 360,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#DDE3EB",
    shadowColor: "#101C32",
    shadowOpacity: 0.1,
    shadowRadius: 25,
    shadowOffset: {
      width: 0,
      height: 15,
    },
    elevation: 7,
  },

  heroImage: {
    width: "100%",
    height: "100%",
  },

  heroImageGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "55%",
  },

  heroImageBadge: {
    position: "absolute",
    left: 15,
    bottom: 15,
    paddingHorizontal: 11,
    paddingVertical: 10,
    borderRadius: 13,
    backgroundColor: "rgba(16,28,50,0.92)",
    flexDirection: "row",
    alignItems: "center",
  },

  heroBadgeIcon: {
    width: 31,
    height: 31,
    borderRadius: 9,
    backgroundColor: "#E5395F",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  heroBadgeTitle: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },

  heroBadgeSubtitle: {
    marginTop: 2,
    color: "#C8D0DC",
    fontSize: 8,
  },

  floatingCard: {
    position: "absolute",
    right: 0,
    bottom: 0,
    maxWidth: 220,
    paddingHorizontal: 11,
    paddingVertical: 10,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#101C32",
    shadowOpacity: 0.1,
    shadowRadius: 17,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 6,
  },

  floatingIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#FFF0F3",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  floatingCopy: {
    flexShrink: 1,
  },

  floatingTitle: {
    color: "#101C32",
    fontSize: 10,
    fontWeight: "800",
  },

  floatingSubtitle: {
    marginTop: 2,
    color: "#98A2B3",
    fontSize: 8,
  },

  /* =========================================================
     CAPABILITIES
  ========================================================= */

  capabilities: {
    paddingHorizontal: 20,
    paddingTop: 65,
    paddingBottom: 72,
    backgroundColor: "#FFFFFF",
  },

  capabilitiesDesktop: {
    paddingHorizontal: 0,
  },

  sectionHeading: {
    width: "100%",
    maxWidth: 650,
    alignSelf: "center",
    alignItems: "center",
  },

  sectionLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 13,
  },

  sectionLabelLine: {
    width: 22,
    height: 2,
    backgroundColor: "#E5395F",
  },

  sectionLabelText: {
    color: "#E5395F",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.1,
  },

  sectionTitle: {
    textAlign: "center",
    color: "#101C32",
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "900",
    letterSpacing: -0.7,
  },

  sectionTitleTablet: {
    fontSize: 30,
    lineHeight: 36,
  },

  sectionTitleDesktop: {
    fontSize: 35,
    lineHeight: 41,
    letterSpacing: -1,
  },

  sectionDescription: {
    marginTop: 12,
    maxWidth: 570,
    textAlign: "center",
    color: "#667085",
    fontSize: 13,
    lineHeight: 21,
  },

  sectionDescriptionDesktop: {
    fontSize: 14,
    lineHeight: 22,
  },

  featureGrid: {
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
    marginTop: 37,
  },

  featureGridTablet: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  featureGridDesktop: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  featureCard: {
    width: "100%",
    marginBottom: 21,
    borderRadius: 19,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E9EDF2",
    shadowColor: "#101C32",
    shadowOpacity: 0.05,
    shadowRadius: 15,
    shadowOffset: {
      width: 0,
      height: 7,
    },
    elevation: 2,
  },

  featureCardTablet: {
    width: "48%",
  },

  featureCardDesktop: {
    width: "48%",
    marginBottom: 28,
  },

  featureImageContainer: {
    width: "100%",
    height: 185,
    position: "relative",
    backgroundColor: "#E8EDF3",
  },

  featureImage: {
    width: "100%",
    height: "100%",
  },

  featureOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(16,28,50,0.12)",
  },

  featureIcon: {
    position: "absolute",
    left: 14,
    bottom: 14,
    width: 39,
    height: 39,
    borderRadius: 11,
    backgroundColor: "#101C32",
    alignItems: "center",
    justifyContent: "center",
  },

  featureContent: {
    minHeight: 125,
    padding: 17,
    position: "relative",
  },

  featureTitle: {
    color: "#101C32",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
  },

  featureDescription: {
    marginTop: 7,
    paddingRight: 34,
    color: "#667085",
    fontSize: 12.5,
    lineHeight: 20,
  },

  featureArrow: {
    position: "absolute",
    right: 16,
    bottom: 17,
    width: 31,
    height: 31,
    borderRadius: 9,
    backgroundColor: "#FFF0F3",
    alignItems: "center",
    justifyContent: "center",
  },

  /* =========================================================
     CTA
  ========================================================= */

  ctaSection: {
    paddingHorizontal: 20,
    paddingVertical: 58,
    backgroundColor: "#F8FAFC",
  },

  ctaSectionDesktop: {
    paddingHorizontal: 0,
  },

  cta: {
    width: "100%",
    maxWidth: 1180,
    minHeight: 300,
    alignSelf: "center",
    borderRadius: 25,
    overflow: "hidden",
    position: "relative",
    justifyContent: "center",
  },

  ctaDesktop: {
    minHeight: 330,
  },

  ctaContent: {
    maxWidth: 650,
    paddingHorizontal: 25,
    paddingVertical: 37,
    zIndex: 2,
  },

  ctaEyebrow: {
    color: "#F58AA1",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  ctaTitle: {
    marginTop: 11,
    color: "#FFFFFF",
    fontSize: 27,
    lineHeight: 33,
    fontWeight: "900",
    letterSpacing: -0.8,
  },

  ctaTitleTablet: {
    fontSize: 31,
    lineHeight: 37,
  },

  ctaTitleDesktop: {
    fontSize: 38,
    lineHeight: 44,
  },

  ctaDescription: {
    marginTop: 12,
    maxWidth: 520,
    color: "#B9C3D2",
    fontSize: 13,
    lineHeight: 21,
  },

  ctaButton: {
    marginTop: 21,
    alignSelf: "flex-start",
    minHeight: 45,
    paddingHorizontal: 16,
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  ctaButtonText: {
    color: "#101C32",
    fontSize: 13,
    fontWeight: "800",
  },

  ctaCircleOne: {
    position: "absolute",
    width: 290,
    height: 290,
    borderRadius: 200,
    right: -90,
    top: -110,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  ctaCircleTwo: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 200,
    right: 45,
    bottom: -115,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  /* =========================================================
     FOOTER
  ========================================================= */

  footer: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 38,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },

  footerLogo: {
    width: 35,
    height: 35,
    borderRadius: 8,
  },

  footerBrand: {
    marginTop: 8,
    color: "#101C32",
    fontSize: 17,
    fontWeight: "800",
  },

  footerTagline: {
    marginTop: 8,
    color: "#667085",
    fontSize: 12,
  },

  footerCopyright: {
    marginTop: 13,
    color: "#98A2B3",
    fontSize: 10,
  },
});