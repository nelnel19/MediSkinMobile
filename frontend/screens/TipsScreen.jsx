"use client"

import React, { useState } from "react"
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar } from "react-native"
import { Sun, Droplets, Sparkles, Heart, Moon, Shield } from "lucide-react-native"
import Icon from 'react-native-vector-icons/MaterialIcons'
import { useNavigation } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'

const TipsScreen = () => {
  const [activeSection, setActiveSection] = useState(null)
  const navigation = useNavigation()

  const skinTypes = [
    {
      id: "normal",
      icon: Sparkles,
      title: "Normal Skin",
      color: "#A36B4F",
      tips: [
        "Maintain your natural balance by cleansing with a gentle, pH-balanced cleanser twice daily.",
        "Use a lightweight, hydrating moisturizer to keep your skin smooth and supple.",
        "Apply sunscreen daily to prevent sun-induced damage and premature aging.",
        "Add an antioxidant serum like Vitamin C in the morning to fight environmental damage.",
        "Exfoliate once or twice weekly to maintain a healthy glow without irritation.",
      ],
    },
    {
      id: "dry",
      icon: Droplets,
      title: "Dry Skin",
      color: "#58656E",
      tips: [
        "Use a creamy or hydrating cleanser that won't strip away natural oils.",
        "Moisturize immediately after washing your face while the skin is still damp.",
        "Look for ingredients such as hyaluronic acid, glycerin, ceramides, and squalane.",
        "Use richer creams or occlusive products (like shea butter or petrolatum) at night.",
        "Avoid long, hot showers and use a humidifier if your environment is dry.",
        "Exfoliate no more than once a week with a mild formula.",
      ],
    },
    {
      id: "oily",
      icon: Sun,
      title: "Oily Skin",
      color: "#9BAAAE",
      tips: [
        "Cleanse twice daily using a foaming or gel-based cleanser to remove excess oil.",
        "Use salicylic acid or niacinamide to help control oil production and minimize pores.",
        "Avoid skipping moisturizer — use a lightweight, oil-free, non-comedogenic one.",
        "Use blotting papers or mattifying powder throughout the day to reduce shine.",
        "Apply a gel-based sunscreen that won't clog pores or feel greasy.",
        "Exfoliate 2–3 times weekly to prevent breakouts and keep pores clear.",
      ],
    },
    {
      id: "combination",
      icon: Shield,
      title: "Combination Skin",
      color: "#3A343C",
      tips: [
        "Use a mild cleanser that controls oil in the T-zone but keeps cheeks hydrated.",
        "You may use two moisturizers — a lighter one on oily areas and a richer one on dry areas.",
        "Try multi-masking: apply clay masks on oily areas and hydrating masks on dry parts.",
        "Avoid heavy products that clog pores on your T-zone.",
        "Exfoliate gently to even skin texture without irritating drier zones.",
      ],
    },
    {
      id: "sensitive",
      icon: Heart,
      title: "Sensitive Skin",
      color: "#6366F1",
      tips: [
        "Stick to a simple routine with fragrance-free and alcohol-free products.",
        "Avoid harsh exfoliants and strong actives unless prescribed.",
        "Use soothing ingredients like aloe vera, green tea, chamomile, or centella asiatica.",
        "Patch test every new product before applying it to your face.",
        "Protect your skin barrier — never over-cleanse or over-exfoliate.",
      ],
    },
    {
      id: "night",
      icon: Moon,
      title: "Night Routine",
      color: "#F59E0B",
      tips: [
        "Nighttime is when your skin repairs itself. Always remove makeup and sunscreen before bed.",
        "Use a richer moisturizer or sleeping mask to aid recovery overnight.",
        "If using active ingredients (like retinol or acids), apply them only at night.",
        "Change your pillowcase weekly — dirt and oils can cause breakouts or irritation.",
      ],
    },
  ]

  const universalTips = [
    "Always wear a broad-spectrum sunscreen (SPF 30 or higher) every morning.",
    "Cleanse your face gently twice a day with lukewarm water.",
    "Moisturize daily, even if you have oily skin.",
    "Exfoliate 1–2 times per week using mild chemical exfoliants.",
    "Get at least 7–9 hours of sleep every night.",
    "Eat a balanced diet rich in antioxidants and vitamins.",
    "Stay hydrated by drinking plenty of water throughout the day.",
    "Avoid smoking and limit alcohol intake.",
    "Patch test new products before full application.",
    "Keep your routine simple and consistent.",
  ]

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
              <Text style={styles.headerTitle}>General Skincare Guide</Text>
              <Text style={styles.headerSubtitle}>Expert tips for healthy skin</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Universal Tips */}
        <View style={styles.card}>
          <LinearGradient
            colors={['#A36B4F', '#A36B4FDD']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardHeaderGradient}
          >
            <View style={styles.cardHeader}>
              <Shield color="#FFF" size={22} />
              <Text style={styles.cardTitleWhite}>Universal Tips for All Skin Types</Text>
            </View>
          </LinearGradient>
          <View style={styles.cardContent}>
            {universalTips.map((tip, index) => (
              <View key={index} style={styles.tipRow}>
                <View style={[styles.bullet, { backgroundColor: "#A36B4F" }]} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Skin Type Cards */}
        {skinTypes.map((type) => {
          const IconComponent = type.icon
          const isActive = activeSection === type.id

          return (
            <TouchableOpacity
              key={type.id}
              onPress={() => setActiveSection(isActive ? null : type.id)}
              style={styles.card}
            >
              <LinearGradient
                colors={[type.color, type.color + 'DD']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardHeaderGradient}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.iconContainer}>
                    <IconComponent color="#FFF" size={22} />
                  </View>
                  <Text style={styles.cardTitleWhite}>{type.title}</Text>
                  <Icon 
                    name={isActive ? "expand-less" : "expand-more"} 
                    size={24} 
                    color="#FFF" 
                  />
                </View>
              </LinearGradient>

              {isActive && (
                <View style={styles.cardContent}>
                  {type.tips.map((tip, index) => (
                    <View key={index} style={styles.tipRow}>
                      <View style={[styles.bullet, { backgroundColor: type.color }]} />
                      <Text style={styles.tipText}>{tip}</Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          )
        })}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Consistency is the secret to beautiful skin. Stick to a steady,
            minimal routine suited to your skin type, wear SPF daily, and your
            skin will reward you with long-term radiance.
          </Text>
        </View>
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
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
  },
  cardHeaderGradient: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitleWhite: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFF',
    flex: 1,
    marginLeft: 8,
  },
  cardContent: {
    padding: 16,
  },
  iconContainer: {
    padding: 6,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 6,
    marginTop: 7,
    marginRight: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#3A343C',
    lineHeight: 20,
    fontWeight: '400',
  },
  footer: {
    backgroundColor: '#A36B4F',
    borderRadius: 16,
    padding: 20,
    marginTop: 10,
    marginBottom: 30,
  },
  footerText: {
    color: '#FFF',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
  },
})

export default TipsScreen