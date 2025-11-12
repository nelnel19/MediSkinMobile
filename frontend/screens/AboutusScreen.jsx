"use client"

import React from "react"
import { View, Text, ScrollView, Image, StyleSheet, Dimensions, TouchableOpacity, StatusBar } from "react-native"
import { Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useNavigation } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialIcons'

const { width } = Dimensions.get('window')

const teamMembers = [
  {
    name: "Arnel V. Bullo Jr.",
    role: "Full Stack Developer / Project Leader",
    image: require("../assets/image2.jpg"),
    bio: "Arnel is the project leader and Full Stack Developer behind MediSkin. He guided the entire team from planning to deployment, ensuring that every feature worked seamlessly and met the project's goals.",
    icon: "code",
    color: "#A36B4F"
  },
  {
    name: "Jeremiah Estillore",
    role: "Frontend Developer & Documentation",
    image: require("../assets/image1.jpg"),
    bio: "Jeremiah focused on the app's design and user interface, making sure it was clean, responsive, and user-friendly. He also assisted in documentation.",
    icon: "layout",
    color: "#58656E"
  },
  {
    name: "Hannah Mae Bernolia",
    role: "Documentation Leader",
    image: require("../assets/image1.jpg"),
    bio: "Hannah Mae led the documentation team with consistency and structure. She ensured that the research papers, reports, and written outputs were accurate and clear.",
    icon: "file-text",
    color: "#9BAAAE"
  },
  {
    name: "Crisha Arlene Antonio",
    role: "Documentation Leader",
    image: require("../assets/image1.jpg"),
    bio: "Crisha Arlene contributed greatly to writing and editing the project documentation. Her attention to detail and teamwork helped maintain the project's quality.",
    icon: "edit-3",
    color: "#6366F1"
  },
]

const AboutUsScreen = () => {
  const navigation = useNavigation()

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
              <Text style={styles.headerTitle}>About Us</Text>
              <Text style={styles.headerSubtitle}>Meet the MediSkin team</Text>
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
                <View style={styles.heroIcon}>
                  <Feather name="users" size={32} color="#FFF" />
                </View>
              </View>
              <Text style={styles.heroTitle}>About MediSkin</Text>
              <Text style={styles.heroSubtitle}>
                A smart skincare solution that helps users analyze their skin and get personalized tips for better skin health
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Mission & Vision Cards */}
        <View style={styles.cardsSection}>
          <TouchableOpacity style={styles.infoCard} activeOpacity={0.9}>
            <LinearGradient
              colors={['#A36B4F', '#A36B4FDD']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={styles.cardContent}>
                <View style={styles.cardIconWrapper}>
                  <Feather name="target" size={20} color="#FFF" />
                </View>
                <Text style={styles.cardTitle}>Our Mission</Text>
                <Text style={styles.cardText}>
                  Make skincare smarter and more accessible through innovation, helping people understand their skin better.
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.infoCard} activeOpacity={0.9}>
            <LinearGradient
              colors={['#58656E', '#7A8A94']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={styles.cardContent}>
                <View style={styles.cardIconWrapper}>
                  <Feather name="eye" size={20} color="#FFF" />
                </View>
                <Text style={styles.cardTitle}>Our Vision</Text>
                <Text style={styles.cardText}>
                  A future where technology and skincare work hand in hand, allowing everyone to care for their skin confidently.
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Team Section */}
        <View style={styles.teamSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Meet the Team</Text>
            <Text style={styles.sectionSubtitle}>{teamMembers.length} dedicated members</Text>
          </View>

          {/* Team Members */}
          {teamMembers.map((member, index) => (
            <View key={index} style={styles.memberCard}>
              {/* Member Header */}
              <LinearGradient
                colors={[member.color, member.color + 'DD']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.memberHeader}
              >
                <View style={styles.memberTop}>
                  <View style={styles.imageWrapper}>
                    <Image source={member.image} style={styles.memberImage} resizeMode="cover" />
                    <View style={styles.memberBadge}>
                      <Feather name={member.icon} size={14} color="#FFF" />
                    </View>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={styles.memberRole}>{member.role}</Text>
                  </View>
                </View>
              </LinearGradient>

              {/* Member Bio */}
              <View style={styles.memberBioContainer}>
                <Text style={styles.memberBio}>{member.bio}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Quote Section */}
        <View style={styles.quoteCard}>
          <LinearGradient
            colors={['#9BAAAE', '#7A8A94']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.quoteGradient}
          >
            <View style={styles.quoteContent}>
              <Feather name="message-circle" size={24} color="#FFF" style={styles.quoteIcon} />
              <Text style={styles.quoteText}>
                "We believe that healthy skin begins with knowledge, and MediSkin is our way of making that knowledge available to everyone."
              </Text>
              <Text style={styles.quoteAuthor}>— The MediSkin Team</Text>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  )
}

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
    marginBottom: 16,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
  cardsSection: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  infoCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardGradient: {
    padding: 20,
  },
  cardContent: {
    alignItems: 'flex-start',
  },
  cardIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  teamSection: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
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
  memberCard: {
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
  memberHeader: {
    padding: 16,
  },
  memberTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 16,
  },
  memberImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  memberBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  memberRole: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  memberBioContainer: {
    padding: 16,
  },
  memberBio: {
    fontSize: 14,
    color: '#58656E',
    lineHeight: 20,
    fontWeight: '400',
  },
  quoteCard: {
    margin: 20,
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  quoteGradient: {
    padding: 20,
  },
  quoteContent: {
    alignItems: 'center',
  },
  quoteIcon: {
    marginBottom: 12,
    opacity: 0.9,
  },
  quoteText: {
    fontSize: 15,
    color: '#FFF',
    lineHeight: 22,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 12,
  },
  quoteAuthor: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 32,
  },
})

export default AboutUsScreen