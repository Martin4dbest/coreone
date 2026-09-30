// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
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
import { useAuth } from "@/context/AuthContext";

export default function Landing() {
  const { tenant } = useAuth();
  const { width } = useWindowDimensions();

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const formattedDate = currentTime.toLocaleDateString([], {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const isDesktopWeb = Platform.OS === "web" && width >= 900;
  const isTablet = width >= 600 && width < 900;
  const isSmallPhone = width < 380;

  const primaryColor =
    tenant?.primary_color ||
    tenant?.school_branding?.primary_color ||
    "#2563EB";

  const secondaryColor =
    tenant?.secondary_color ||
    tenant?.school_branding?.secondary_color ||
    "#0F172A";

  const accentColor =
    tenant?.accent_color ||
    tenant?.school_branding?.accent_color ||
    primaryColor;

  const schoolName =
    tenant?.name ||
    tenant?.school_name ||
    tenant?.school_branding?.school_name ||
    "CoreOne";

  const schoolLogo =
    tenant?.logo_url ||
    tenant?.logo ||
    tenant?.school_logo ||
    tenant?.brand_logo ||
    tenant?.school_branding?.logo_url ||
    tenant?.school_branding?.logo ||
    tenant?.attributes?.logo ||
    null;

  const features = useMemo(
    () => [
      {
        icon: "analytics-outline",
        title: "Student Analytics",
        desc: "Track academic performance, grades, and student progress.",
      },
      {
        icon: "document-text-outline",
        title: "Digital Results",
        desc: "Create and access secure report cards and academic records.",
      },
      {
        icon: "calendar-outline",
        title: "Smart Attendance",
        desc: "Record attendance and monitor daily school activities.",
      },
      {
        icon: "people-outline",
        title: "Parent Portal",
        desc: "Keep parents connected with their children's school journey.",
      },
    ],
    []
  );

  const openLogin = () => {
    router.push("/login");
  };

  return (
    <View style={[styles.container, { backgroundColor: "#F8FAFC" }]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F8FAFC"
      />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isDesktopWeb && styles.scrollContentDesktop,
          ]}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          <View
            style={[
              styles.mainWrapper,
              isDesktopWeb && styles.desktopWrapper,
            ]}
          >
            {/* HEADER */}
            <View style={styles.header}>
              <View style={styles.logoRow}>
                <View
                  style={[
                    styles.logoContainer,
                    {
                      backgroundColor: `${primaryColor}16`,
                      borderColor: `${primaryColor}30`,
                    },
                  ]}
                >
                  {schoolLogo ? (
                    <Image
                      source={{ uri: schoolLogo }}
                      style={styles.schoolLogo}
                      contentFit="contain"
                    />
                  ) : (
                    <Ionicons
                      name="school-outline"
                      size={25}
                      color={primaryColor}
                    />
                  )}
                </View>

                <View style={styles.brandTextContainer}>
                  <Text
                    style={[
                      styles.brand,
                      {
                        color: secondaryColor,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {schoolName}
                  </Text>

                  <Text style={styles.brandCaption}>
                    Powered by CoreOne
                  </Text>
                </View>
              </View>

              {isDesktopWeb && (
                <Pressable
                  style={({ pressed }) => [
                    styles.headerLoginBtn,
                    {
                      borderColor: primaryColor,
                    },
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={openLogin}
                >
                  <Text
                    style={[
                      styles.headerLoginBtnText,
                      { color: primaryColor },
                    ]}
                  >
                    Sign In
                  </Text>

                  <Ionicons
                    name="arrow-forward"
                    size={17}
                    color={primaryColor}
                  />
                </Pressable>
              )}
            </View>

            {/* LIVE DATE & TIME */}
            <View
              style={[
                styles.dateTimeCard,
                {
                  backgroundColor: `${primaryColor}0D`,
                  borderColor: `${primaryColor}22`,
                },
              ]}
            >
              <View
                style={[
                  styles.clockIcon,
                  {
                    backgroundColor: primaryColor,
                  },
                ]}
              >
                <Ionicons
                  name="time-outline"
                  size={19}
                  color="#FFFFFF"
                />
              </View>

              <View style={styles.dateTimeText}>
                <Text
                  style={[
                    styles.liveTime,
                    { color: secondaryColor },
                  ]}
                >
                  {formattedTime}
                </Text>

                <Text style={styles.liveDate}>
                  {formattedDate}
                </Text>
              </View>

              <View
                style={[
                  styles.liveIndicator,
                  { backgroundColor: primaryColor },
                ]}
              >
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>

            {/* HERO */}
            <View
              style={[
                styles.heroContainer,
                isDesktopWeb && styles.heroDesktop,
              ]}
            >
              {isDesktopWeb && (
                <View style={styles.heroLeft}>
                  <View
                    style={[
                      styles.heroPill,
                      {
                        backgroundColor: `${primaryColor}12`,
                        borderColor: `${primaryColor}25`,
                      },
                    ]}
                  >
                    <Ionicons
                      name="sparkles"
                      size={15}
                      color={primaryColor}
                    />

                    <Text
                      style={[
                        styles.heroPillText,
                        { color: primaryColor },
                      ]}
                    >
                      Smart School Management
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.heroTitleDesktop,
                      { color: secondaryColor },
                    ]}
                  >
                    Everything your school needs,
                    <Text style={{ color: primaryColor }}>
                      {" "}in one place.
                    </Text>
                  </Text>

                  <Text style={styles.heroSubtitleDesktop}>
                    Manage students, results, attendance, communication,
                    fees, and everyday school operations through one
                    connected platform.
                  </Text>

                  <Pressable
                    style={({ pressed }) => [
                      styles.primaryButton,
                      {
                        backgroundColor: primaryColor,
                      },
                      styles.desktopHeroBtn,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={openLogin}
                  >
                    <Text style={styles.primaryButtonText}>
                      Sign In to Portal
                    </Text>

                    <Ionicons
                      name="arrow-forward"
                      size={19}
                      color="#FFFFFF"
                    />
                  </Pressable>
                </View>
              )}

              {/* MOBILE HERO */}
              {!isDesktopWeb && (
                <View style={styles.mobileHeroText}>
                  <View
                    style={[
                      styles.heroPill,
                      {
                        backgroundColor: `${primaryColor}12`,
                        borderColor: `${primaryColor}25`,
                      },
                    ]}
                  >
                    <Ionicons
                      name="sparkles"
                      size={14}
                      color={primaryColor}
                    />

                    <Text
                      style={[
                        styles.heroPillText,
                        { color: primaryColor },
                      ]}
                    >
                      Smart School Management
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.mobileHeroTitle,
                      {
                        color: secondaryColor,
                      },
                    ]}
                  >
                    Your school,
                    <Text style={{ color: primaryColor }}>
                      {" "}connected.
                    </Text>
                  </Text>

                  <Text style={styles.mobileHeroSubtitle}>
                    Manage learning, students, results, attendance and
                    communication from one simple platform.
                  </Text>
                </View>
              )}

              {/* HERO VISUAL */}
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
                  transition={250}
                />

                <LinearGradient
                  colors={[
                    "transparent",
                    `${secondaryColor}45`,
                    `${secondaryColor}D9`,
                  ]}
                  style={styles.heroGradient}
                >
                  <View style={styles.heroVisualBottom}>
                    <View
                      style={[
                        styles.heroVisualIcon,
                        {
                          backgroundColor: primaryColor,
                        },
                      ]}
                    >
                      <Ionicons
                        name="school"
                        size={20}
                        color="#FFFFFF"
                      />
                    </View>

                    <View style={styles.heroVisualText}>
                      <Text style={styles.heroVisualTitle}>
                        {schoolName}
                      </Text>

                      <Text style={styles.heroVisualSubtitle}>
                        One platform for your school
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </View>

            {/* MOBILE LOGIN */}
            {!isDesktopWeb && (
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  styles.mobileLoginButton,
                  {
                    backgroundColor: primaryColor,
                    shadowColor: primaryColor,
                  },
                  pressed && styles.buttonPressed,
                ]}
                onPress={openLogin}
              >
                <Text style={styles.primaryButtonText}>
                  Sign In to Portal
                </Text>

                <View style={styles.loginArrow}>
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color={primaryColor}
                  />
                </View>
              </Pressable>
            )}

            {/* CAPABILITIES */}
            <View style={styles.sectionHeader}>
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color: secondaryColor,
                  },
                ]}
              >
                Key Capabilities
              </Text>

              <Text style={styles.sectionSub}>
                Tools that help your institution run smarter every day.
              </Text>
            </View>

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
                    isTablet && styles.featureCardTablet,
                    pressed && styles.cardPressed,
                  ]}
                >
                  <View
                    style={[
                      styles.featureIcon,
                      {
                        backgroundColor: `${primaryColor}12`,
                      },
                    ]}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={22}
                      color={primaryColor}
                    />
                  </View>

                  <View style={styles.featureContent}>
                    <Text
                      style={[
                        styles.featureTitle,
                        {
                          color: secondaryColor,
                        },
                      ]}
                    >
                      {item.title}
                    </Text>

                    <Text style={styles.featureDesc}>
                      {item.desc}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.featureArrow,
                      {
                        backgroundColor: `${primaryColor}10`,
                      },
                    ]}
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={15}
                      color={primaryColor}
                    />
                  </View>
                </Pressable>
              ))}
            </View>

            {/* BOTTOM CTA */}
            {!isDesktopWeb && (
              <View
                style={[
                  styles.bottomCard,
                  {
                    backgroundColor: secondaryColor,
                  },
                ]}
              >
                <View style={styles.bottomCardIcon}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={24}
                    color={primaryColor}
                  />
                </View>

                <View style={styles.bottomCardContent}>
                  <Text style={styles.bottomCardTitle}>
                    Secure school access
                  </Text>

                  <Text style={styles.bottomCardText}>
                    Sign in to access your school's CoreOne portal.
                  </Text>
                </View>
              </View>
            )}

            {/* FOOTER */}
            <View style={styles.footerContainer}>
              <View
                style={[
                  styles.footerLine,
                  {
                    backgroundColor: `${primaryColor}20`,
                  },
                ]}
              />

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
  container: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 28,
  },

  scrollContentDesktop: {
    paddingBottom: 50,
  },

  mainWrapper: {
    width: "100%",
    paddingHorizontal: 18,
  },

  desktopWrapper: {
    maxWidth: 1180,
    alignSelf: "center",
    width: "100%",
    paddingHorizontal: 30,
  },

  /* HEADER */

  header: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },

  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },

  logoContainer: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  schoolLogo: {
    width: 34,
    height: 34,
  },

  brandTextContainer: {
    marginLeft: 11,
    flexShrink: 1,
  },

  brand: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
    maxWidth: 230,
  },

  brandCaption: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 2,
    fontWeight: "600",
  },

  headerLoginBtn: {
    minHeight: 42,
    paddingHorizontal: 17,
    borderWidth: 1.5,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  headerLoginBtnText: {
    fontSize: 14,
    fontWeight: "800",
  },

  /* LIVE DATE & TIME */

  dateTimeCard: {
    width: "100%",
    minHeight: 66,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  clockIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  dateTimeText: {
    flex: 1,
    marginLeft: 11,
    minWidth: 0,
  },

  liveTime: {
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 0.2,
  },

  liveDate: {
    color: "#64748B",
    fontSize: 10.5,
    fontWeight: "600",
    marginTop: 2,
  },

  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 100,
    gap: 5,
  },

  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 5,
    backgroundColor: "#FFFFFF",
  },

  liveText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  /* HERO */

  heroContainer: {
    width: "100%",
    marginTop: 10,
  },

  heroDesktop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 55,
    marginTop: 38,
  },

  heroLeft: {
    flex: 1,
    paddingVertical: 20,
  },

  mobileHeroText: {
    paddingTop: 14,
    paddingBottom: 18,
  },

  heroPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 100,
    borderWidth: 1,
    gap: 6,
  },

  heroPillText: {
    fontSize: 11,
    fontWeight: "800",
  },

  mobileHeroTitle: {
    fontSize: 36,
    lineHeight: 41,
    fontWeight: "900",
    letterSpacing: -1.1,
    marginTop: 15,
    maxWidth: 390,
  },

  mobileHeroSubtitle: {
    color: "#64748B",
    fontSize: 15,
    lineHeight: 23,
    marginTop: 11,
    maxWidth: 500,
  },

  heroTitleDesktop: {
    fontSize: 51,
    lineHeight: 57,
    fontWeight: "900",
    letterSpacing: -1.7,
    marginTop: 20,
    maxWidth: 580,
  },

  heroSubtitleDesktop: {
    color: "#64748B",
    fontSize: 17,
    lineHeight: 27,
    marginTop: 18,
    maxWidth: 560,
  },

  heroCard: {
    width: "100%",
    height: 280,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 5,
  },

  heroCardDesktop: {
    flex: 1,
    height: 430,
    maxWidth: 560,
    borderRadius: 30,
  },

  heroImage: {
    width: "100%",
    height: "100%",
  },

  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    padding: 20,
  },

  heroVisualBottom: {
    flexDirection: "row",
    alignItems: "center",
  },

  heroVisualIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  heroVisualText: {
    marginLeft: 11,
    flex: 1,
  },

  heroVisualTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  heroVisualSubtitle: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    marginTop: 2,
  },

  /* BUTTONS */

  primaryButton: {
    minHeight: 56,
    borderRadius: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  desktopHeroBtn: {
    alignSelf: "flex-start",
    marginTop: 28,
    paddingHorizontal: 24,
    minHeight: 54,
  },

  mobileLoginButton: {
    width: "100%",
    marginTop: 20,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 5,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  loginArrow: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  buttonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },

  /* SECTION */

  sectionHeader: {
    marginTop: 42,
    marginBottom: 17,
  },

  sectionTitle: {
    fontSize: 23,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  sectionSub: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 5,
    maxWidth: 520,
  },

  /* FEATURES */

  featureGrid: {
    width: "100%",
    gap: 12,
  },

  featureGridTablet: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  featureGridDesktop: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },

  featureCard: {
    width: "100%",
    minHeight: 106,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 1,
  },

  featureCardTablet: {
    width: "48.5%",
    flexGrow: 1,
  },

  featureCardDesktop: {
    flex: 1,
    minWidth: 220,
    minHeight: 125,
    maxWidth: 285,
  },

  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  featureContent: {
    flex: 1,
    minWidth: 0,
    marginLeft: 13,
    paddingRight: 7,
  },

  featureTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 4,
  },

  featureDesc: {
    color: "#64748B",
    fontSize: 11.5,
    lineHeight: 17,
  },

  featureArrow: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  cardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.985 }],
  },

  /* BOTTOM CARD */

  bottomCard: {
    marginTop: 30,
    borderRadius: 20,
    padding: 17,
    flexDirection: "row",
    alignItems: "center",
  },

  bottomCardIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },

  bottomCardContent: {
    flex: 1,
    marginLeft: 12,
  },

  bottomCardTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  bottomCardText: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 3,
  },

  /* FOOTER */

  footerContainer: {
    alignItems: "center",
    marginTop: 35,
  },

  footerLine: {
    width: 50,
    height: 3,
    borderRadius: 100,
    marginBottom: 12,
  },

  footer: {
    color: "#94A3B8",
    fontSize: 10.5,
    fontWeight: "600",
    textAlign: "center",
  },
});
