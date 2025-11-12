import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, StatusBar } from "react-native";
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const InstructionScreen = () => {
  const navigation = useNavigation();
  
  const features = [
    {
      icon: "scan",
      title: "Facial Analysis",
      color: "#A36B4F",
      description: "MediSkin scans your face using your device's camera and detects key facial features, including skin tone and undertone, areas of dryness or oiliness, acne, dark spots, and fine lines."
    },
    {
      icon: "activity",
      title: "Skin Condition Assessment",
      color: "#58656E",
      description: "The app evaluates your skin for common conditions like acne, dark circles, hyperpigmentation, and sensitivity with scientifically-backed analysis."
    },
    {
      icon: "heart",
      title: "Personalized Skincare Tips",
      color: "#9BAAAE",
      description: "Get tailored skincare recommendations, including daily routines, best products for your skin type, and tips for hydration, sun protection, and cleansing."
    },
    {
      icon: "package",
      title: "Skin Medication Suggestions",
      color: "#6366F1",
      description: "Receive appropriate skin medication suggestions to treat specific issues like acne or pigmentation. Always consult a dermatologist before starting treatment."
    }
  ];

  const steps = [
    { icon: "sun", text: "Find a well-lit area and ensure your face is visible to the camera" },
    { icon: "smartphone", text: "Open MediSkin and navigate to the 'Scan' section" },
    { icon: "user", text: "Follow the on-screen instructions to position your face" },
    { icon: "clock", text: "Wait a few seconds for the analysis to complete" },
    { icon: "file-text", text: "Review your results, read the tips, and check recommended medications" },
    { icon: "save", text: "Save your results to track improvements over time" }
  ];

  const tips = [
    { icon: "droplet", text: "Remove makeup before scanning for a more accurate analysis" },
    { icon: "camera", text: "Ensure the camera is clean and the lighting is bright but not harsh" },
    { icon: "trending-up", text: "Take regular scans to monitor changes in your skin over time" },
    { icon: "check-circle", text: "Follow the skincare tips consistently for better results" }
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#D8CEB8" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={24} color="#3A343C" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Help & Instructions</Text>
              <Text style={styles.headerSubtitle}>Your personal skin analysis assistant</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={['#A36B4F', '#C1896B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroContent}>
              <View style={styles.heroIconContainer}>
                <Feather name="help-circle" size={32} color="#FFF" />
              </View>
              <Text style={styles.heroTitle}>Help & Instructions</Text>
              <Text style={styles.heroSubtitle}>
                Your personal skin and facial analysis assistant powered by advanced technology
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Introduction Card */}
        <View style={styles.introCard}>
          <LinearGradient
            colors={['#58656E', '#7A8A94']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.introGradient}
          >
            <View style={styles.introContent}>
              <View style={styles.introIconWrapper}>
                <Feather name="info" size={20} color="#FFF" />
              </View>
              <Text style={styles.introText}>
                MediSkin uses advanced technology to analyze your face for facial details and skin conditions, then provides customized skincare tips and medication recommendations to help you maintain healthy, glowing skin.
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* How It Works Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>How MediSkin Works</Text>
          <Text style={styles.sectionSubtitle}>Advanced features for better skin health</Text>
        </View>

        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <TouchableOpacity key={index} style={styles.featureCard} activeOpacity={0.9}>
              <LinearGradient
                colors={[feature.color, feature.color + 'DD']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.featureGradient}
              >
                <View style={styles.featureContent}>
                  <View style={styles.featureIconContainer}>
                    <Feather name={feature.icon} size={24} color="#FFF" />
                  </View>
                  <View style={styles.featureText}>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDescription}>{feature.description}</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Using MediSkin Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Using MediSkin Effectively</Text>
          <Text style={styles.sectionSubtitle}>Follow these steps for best results</Text>
        </View>

        <View style={styles.stepsContainer}>
          {steps.map((step, index) => (
            <View key={index} style={styles.stepCard}>
              <View style={styles.stepLeft}>
                <LinearGradient
                  colors={['#A36B4F', '#C1896B']}
                  style={styles.stepNumber}
                >
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </LinearGradient>
                <View style={styles.stepIconWrapper}>
                  <Feather name={step.icon} size={18} color="#A36B4F" />
                </View>
              </View>
              <Text style={styles.stepText}>{step.text}</Text>
            </View>
          ))}
        </View>

        {/* Tips Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tips for Best Results</Text>
          <Text style={styles.sectionSubtitle}>Get the most out of MediSkin</Text>
        </View>

        <View style={styles.tipsContainer}>
          {tips.map((tip, index) => (
            <View key={index} style={styles.tipCard}>
              <LinearGradient
                colors={['#9BAAAE', '#7A8A94']}
                style={styles.tipIconContainer}
              >
                <Feather name={tip.icon} size={20} color="#FFF" />
              </LinearGradient>
              <Text style={styles.tipText}>{tip.text}</Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footerCard}>
          <LinearGradient
            colors={['#A36B4F', '#C1896B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.footerGradient}
          >
            <View style={styles.footerContent}>
              <Feather name="star" size={24} color="#FFF" style={styles.footerIcon} />
              <Text style={styles.footerText}>
                MediSkin is designed to make skincare simple, informative, and personalized. Whether you want to improve skin health or treat specific concerns, MediSkin gives you the tools and guidance you need, all from the convenience of your phone.
              </Text>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F2ED',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#D8CEB8',
    borderBottomWidth: 1,
    borderBottomColor: '#9BAAAE',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '600',
    color: '#3A343C',
    letterSpacing: -1,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#58656E',
    fontWeight: '400',
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    margin: 20,
    marginTop: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  heroGradient: {
    padding: 24,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  introCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  introGradient: {
    padding: 20,
  },
  introContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  introIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  introText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3A343C',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#58656E',
    fontWeight: '400',
  },
  featuresContainer: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  featureCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  featureGradient: {
    padding: 20,
  },
  featureContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  stepsContainer: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  stepCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  stepLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  stepIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#58656E',
    lineHeight: 20,
    fontWeight: '400',
  },
  tipsContainer: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  tipCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  tipIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#58656E',
    lineHeight: 20,
    fontWeight: '400',
  },
  footerCard: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  footerGradient: {
    padding: 20,
  },
  footerContent: {
    alignItems: 'center',
  },
  footerIcon: {
    marginBottom: 12,
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 22,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 32,
  },
});

export default InstructionScreen;