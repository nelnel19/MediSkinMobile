import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const PrivacyScreen = () => {
  const navigation = useNavigation();

  const PolicySection = ({ icon, title, children }) => (
    <View style={styles.section}>
      <LinearGradient
        colors={['#58656E', '#7A8A94']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.sectionHeader}
      >
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color="#FFF" />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </LinearGradient>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );

  const BulletPoint = ({ text }) => (
    <View style={styles.bulletContainer}>
      <View style={styles.bullet} />
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );

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
              <Text style={styles.headerTitle}>Privacy Policy</Text>
              <Text style={styles.headerSubtitle}>MediSkin</Text>
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
              <View style={styles.heroIcon}>
                <Ionicons name="shield-checkmark" size={32} color="#FFF" />
              </View>
              <Text style={styles.heroTitle}>Privacy Policy</Text>
              <Text style={styles.heroSubtitle}>Your data security is our priority</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Effective Date: [Insert Date]</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Introduction */}
        <View style={styles.introCard}>
          <LinearGradient
            colors={['#9BAAAE', '#7A8A94']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.introGradient}
          >
            <View style={styles.introContent}>
              <Text style={styles.introText}>
                MediSkin values your privacy and is committed to protecting your
                personal and facial data. This Privacy Policy explains how we collect,
                use, and safeguard the information you provide while using the app.
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Sections */}
        <View style={styles.sectionsContainer}>
          <PolicySection icon="folder-open" title="Data We Collect">
            <BulletPoint text="Facial and Skin Data: MediSkin processes images of your face to analyze facial features and skin conditions." />
            <BulletPoint text="Account Information: Name, email, and account preferences if you register or log in." />
            <BulletPoint text="Usage Data: Information about how you use the app, such as features accessed and time spent." />
          </PolicySection>

          <PolicySection icon="analytics" title="How We Use Your Data">
            <BulletPoint text="To analyze your skin and facial features and provide personalized skincare tips." />
            <BulletPoint text="To improve the app and its features." />
            <BulletPoint text="To send important updates or notifications regarding your account or app functionality (if you opt in)." />
          </PolicySection>

          <PolicySection icon="lock-closed" title="Data Storage and Security">
            <BulletPoint text="Facial and skin images are processed locally on your device whenever possible." />
            <BulletPoint text="Any data stored on servers is encrypted and protected with industry-standard security measures." />
            <BulletPoint text="We do not sell or share your personal or facial data with third parties for marketing purposes." />
          </PolicySection>

          <PolicySection icon="share-social" title="Data Sharing">
            <BulletPoint text="MediSkin may share your information only with trusted service providers who help operate the app or to comply with legal obligations." />
            <BulletPoint text="Any sharing is strictly controlled and anonymized whenever possible." />
          </PolicySection>

          <PolicySection icon="hand-right" title="Your Rights">
            <BulletPoint text="You can delete your account and data at any time through the app settings." />
            <BulletPoint text="You can opt out of data collection or notifications whenever possible." />
            <BulletPoint text="You have the right to access, correct, or request deletion of your personal data." />
          </PolicySection>

          <PolicySection icon="people" title="Children's Privacy">
            <Text style={styles.regularText}>
              MediSkin is not intended for children under 13 years old. We do not
              knowingly collect personal data from children.
            </Text>
          </PolicySection>

          <PolicySection icon="refresh" title="Changes to this Privacy Policy">
            <Text style={styles.regularText}>
              We may update this Privacy Policy periodically. Updates will be
              posted in the app, and we encourage you to review the policy
              regularly.
            </Text>
          </PolicySection>

          <PolicySection icon="mail" title="Contact Us">
            <Text style={styles.regularText}>
              If you have any questions or concerns about your privacy or data in
              MediSkin, please contact us at:{" "}
              <Text style={styles.link}>support@mediskin.com</Text>
            </Text>
          </PolicySection>
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
              <Ionicons name="heart" size={20} color="#FFF" />
              <Text style={styles.footerText}>
                Your privacy matters to us
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
  heroIcon: {
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
    marginBottom: 16,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '500',
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
    alignItems: 'center',
  },
  introText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 22,
    textAlign: 'center',
  },
  sectionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    flex: 1,
  },
  sectionContent: {
    padding: 16,
  },
  bulletContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#A36B4F',
    marginTop: 8,
    marginRight: 12,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#58656E',
    fontWeight: '400',
  },
  regularText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#58656E',
    fontWeight: '400',
  },
  link: {
    color: '#A36B4F',
    fontWeight: '600',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  bottomSpacer: {
    height: 32,
  },
});

export default PrivacyScreen;