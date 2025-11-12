"use client"

import { useEffect, useState, useRef } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Animated, ScrollView, TextInput, Modal, KeyboardAvoidingView, Platform, Image, Dimensions } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import axios from "axios"
import { API_URL } from "../config/api.js"
import { LinearGradient } from 'expo-linear-gradient'

const { width } = Dimensions.get('window')

export default function HomeScreen({ navigation, route }) {
  const [user, setUser] = useState(null)
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current
  const scaleAnim = useRef(new Animated.Value(0.95)).current
  const drawerSlideAnim = useRef(new Animated.Value(-300)).current
  const [drawerVisible, setDrawerVisible] = useState(false)
  
  // Chat state
  const [isChatVisible, setIsChatVisible] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Pulse animation for chat button
  const pulseAnim = useRef(new Animated.Value(1)).current
  // Pulse animation for drawer button
  const drawerPulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    loadUserData()
    
    // Start pulse animation for chat button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start()

    // Start subtle pulse animation for drawer button
    Animated.loop(
      Animated.sequence([
        Animated.timing(drawerPulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(drawerPulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start()
  }, [])

  useEffect(() => {
    if (route.params?.user) {
      setUser(route.params.user)
      AsyncStorage.setItem("user", JSON.stringify(route.params.user))
    }
  }, [route.params?.user])

  const loadUserData = async () => {
    try {
      if (route.params?.user) {
        setUser(route.params.user)
        await AsyncStorage.setItem("user", JSON.stringify(route.params.user))
      } else {
        const storedUser = await AsyncStorage.getItem("user")
        if (storedUser) {
          setUser(JSON.parse(storedUser))
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error)
    }
  }

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  useEffect(() => {
    Animated.spring(drawerSlideAnim, {
      toValue: drawerVisible ? 0 : -300,
      useNativeDriver: true,
      friction: 8,
      tension: 65,
    }).start()
  }, [drawerVisible])

  useEffect(() => {
    if (!isChatVisible) {
      fadeAnim.setValue(1)
      slideAnim.setValue(0)
    }
  }, [isChatVisible])

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("user")
      await AsyncStorage.removeItem("token")
      navigation.replace("Login")
    } catch (error) {
      console.error("Error during logout:", error)
      navigation.replace("Login")
    }
  }

  const handleGoToProfile = () => {
    setDrawerVisible(false)
    navigation.navigate("Profile", { user })
  }

  const handleSkinCare = () => {
    navigation.navigate("Skincare", { user })
  }

  const handleSkinMedication = () => {
    navigation.navigate("SkinMedication", { user })
  }

  const handleGoToMap = () => {
    navigation.navigate("Map", { user })
  }

  const toggleDrawer = () => {
    setDrawerVisible(!drawerVisible)
  }

  const toggleChat = () => {
    setIsChatVisible(!isChatVisible)
    if (!isChatVisible && messages.length === 0) {
      setMessages([
        {
          id: 1,
          text: "Hello! I'm your AI skincare assistant. How can I help you achieve healthier skin today?",
          isUser: false,
          timestamp: new Date()
        }
      ])
    }
  }

  const closeChat = () => {
    setIsChatVisible(false)
    fadeAnim.setValue(1)
    slideAnim.setValue(0)
  }

  const handleGoToHistory = () => {
    navigation.navigate("History", { user })
  }

  // Add this function for Tips navigation
  const handleGoToTips = () => {
    navigation.navigate("Tips", { user })
  }

  // Add this function for About Us navigation
  const handleGoToAbout = () => {
    navigation.navigate("Aboutus", { user })
  }

  // Add this function for Help navigation
  const handleGoToHelp = () => {
    setDrawerVisible(false)
    navigation.navigate("Help", { user })
  }

  const sendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      isUser: true,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)

    try {
      const response = await axios.post(`${API_URL}/api/chat`, {
        message: inputMessage
      }, {
        timeout: 15000
      })

      let replyText = "";
      if (response.data.response) {
        replyText = response.data.response;
      } else if (response.data.reply) {
        replyText = response.data.reply;
      } else {
        throw new Error("Invalid response format from server");
      }

      const botMessage = {
        id: Date.now() + 1,
        text: replyText,
        isUser: false,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Chat error:', error)
      
      let errorText = "Sorry, I'm having trouble connecting. Please try again later."
      
      if (error.code === 'ECONNABORTED') {
        errorText = "Request timed out. Please check your connection and try again."
      } else if (error.response?.data?.error) {
        errorText = error.response.data.error;
      } else if (error.message.includes("Network Error")) {
        errorText = "Network error. Please check your internet connection."
      } else if (error.response?.status === 401) {
        errorText = "API configuration error. Please contact support."
      } else if (error.response?.status === 429) {
        errorText = "Too many requests. Please wait a moment before trying again."
      }
      
      const errorMessage = {
        id: Date.now() + 1,
        text: errorText,
        isUser: false,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getProfileImageSource = () => {
    if (user?.profileImage?.url) {
      return { uri: user.profileImage.url }
    }
    return null
  }

  const getUserInitial = () => {
    return user?.name ? user.name.charAt(0).toUpperCase() : "U"
  }

  if (!user) {
    return (
      <LinearGradient
        colors={['#D8CEB8', '#F5F2ED', '#FFFFFF']}
        style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}
      >
        <Text style={styles.loadingText}>Loading...</Text>
      </LinearGradient>
    )
  }

  return (
    <LinearGradient
      colors={['#D8CEB8', '#F5F2ED', '#FFFFFF']}
      style={styles.container}
    >
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ],
            },
          ]}
        >
          {/* Modern Header - Removed static header */}
          <View style={styles.header}>
            {/* Empty space where menu button was */}
            <View style={styles.headerSpacer} />
            
            <View style={styles.logoContainer}>
              <Image 
                source={require('../assets/logo5.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            {/* Empty space to balance the header */}
            <View style={styles.placeholder} />
          </View>

          {/* Main Action Cards */}
          <View style={styles.mainActionsSection}>
            <TouchableOpacity
              style={styles.mainActionCard}
              onPress={handleSkinCare}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#A36B4F', '#C1896B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.mainActionGradient}
              >
                <View style={styles.mainActionContent}>
                  <View style={styles.mainActionIconBox}>
                    <Text style={styles.mainActionIcon}>◉</Text>
                  </View>
                  <View style={styles.mainActionText}>
                    <Text style={styles.mainActionTitle}>Face Analysis</Text>
                    <Text style={styles.mainActionDesc}>Get personalized recommendations</Text>
                  </View>
                  <View style={styles.mainActionArrow}>
                    <Text style={styles.arrowIcon}>→</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mainActionCard}
              onPress={handleSkinMedication}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#58656E', '#7A8A94']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.mainActionGradient}
              >
                <View style={styles.mainActionContent}>
                  <View style={styles.mainActionIconBox}>
                    <Text style={styles.mainActionIcon}>⬢</Text>
                  </View>
                  <View style={styles.mainActionText}>
                    <Text style={styles.mainActionTitle}>Treatment Plans</Text>
                    <Text style={styles.mainActionDesc}>Medical-grade solutions</Text>
                  </View>
                  <View style={styles.mainActionArrow}>
                    <Text style={styles.arrowIcon}>→</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsSection}>
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#FFFFFF', '#F8F9F7']}
                style={styles.statGradient}
              >
                <Text style={styles.statIcon}>◐</Text>
                <Text style={styles.statNumber}>24</Text>
                <Text style={styles.statLabel}>Reviews</Text>
              </LinearGradient>
            </View>
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#FFFFFF', '#F8F9F7']}
                style={styles.statGradient}
              >
                <Text style={styles.statIcon}>◓</Text>
                <Text style={styles.statNumber}>8</Text>
                <Text style={styles.statLabel}>Active Plans</Text>
              </LinearGradient>
            </View>
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#FFFFFF', '#F8F9F7']}
                style={styles.statGradient}
              >
                <Text style={styles.statIcon}>◆</Text>
                <Text style={styles.statNumber}>98%</Text>
                <Text style={styles.statLabel}>Satisfaction</Text>
              </LinearGradient>
            </View>
          </View>

          {/* Quick Actions Grid */}
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickGrid}>
            <TouchableOpacity 
              style={styles.quickCard}
              onPress={handleGoToHistory}
            >
              <View style={styles.quickIconBox}>
                <Text style={styles.quickIcon}>◧</Text>
              </View>
              <Text style={styles.quickLabel}>History</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickCard}
              onPress={handleGoToMap}
            >
              <View style={styles.quickIconBox}>
                <Text style={styles.quickIcon}>◎</Text>
              </View>
              <Text style={styles.quickLabel}>Find Clinics</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickCard}
              onPress={handleGoToTips}
            >
              <View style={styles.quickIconBox}>
                <Text style={styles.quickIcon}>◈</Text>
              </View>
              <Text style={styles.quickLabel}>Tips</Text>
            </TouchableOpacity>

            {/* Updated About Us button with new minimalist logo */}
            <TouchableOpacity 
              style={styles.quickCard}
              onPress={handleGoToAbout}
            >
              <View style={styles.quickIconBox}>
                <Text style={styles.quickIcon}>ⓘ</Text>
              </View>
              <Text style={styles.quickLabel}>About Us</Text>
            </TouchableOpacity>
          </View>       
        </Animated.View>
      </ScrollView>

      {/* Floating Drawer Button */}
      <Animated.View 
        style={[
          styles.drawerButtonContainer, 
          { transform: [{ scale: drawerPulseAnim }] }
        ]}
      >
        <TouchableOpacity 
          style={styles.floatingDrawerButton}
          onPress={toggleDrawer}
          activeOpacity={0.9}
        >
          <View style={styles.drawerButtonBackground}>
            <View style={styles.menuIconContainerFloating}>
              <View style={styles.menuLineFloating} />
              <View style={styles.menuLineFloating} />
              <View style={styles.menuLineFloating} />
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Navigation Drawer */}
      {drawerVisible && (
        <TouchableOpacity 
          style={styles.drawerOverlay}
          activeOpacity={1}
          onPress={() => setDrawerVisible(false)}
        >
          <Animated.View 
            style={[
              styles.drawerContent,
              { transform: [{ translateX: drawerSlideAnim }] }
            ]}
          >
            <LinearGradient
              colors={['#D8CEB8', '#F5F2ED', '#FFFFFF']}
              style={styles.drawerHeader}
            >
              <View style={styles.drawerProfileSection}>
                <View style={styles.drawerProfileFrame}>
                  {getProfileImageSource() ? (
                    <Image 
                      source={getProfileImageSource()} 
                      style={styles.drawerProfileImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.drawerProfilePlaceholder}>
                      <Text style={styles.drawerProfileInitial}>{getUserInitial()}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.drawerUserName}>{user?.name || "User"}</Text>
                <Text style={styles.drawerUserEmail}>{user?.email || ""}</Text>
              </View>
            </LinearGradient>

            <View style={styles.drawerMenu}>
              <TouchableOpacity 
                style={styles.drawerItem}
                onPress={handleGoToProfile}
              >
                <View style={styles.drawerIconBox}>
                  <Text style={styles.drawerItemIcon}>●</Text>
                </View>
                <Text style={styles.drawerItemText}>Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.drawerItem}>
                <View style={styles.drawerIconBox}>
                  <Text style={styles.drawerItemIcon}>○</Text>
                </View>
                <Text style={styles.drawerItemText}>Settings</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.drawerItem}>
                <View style={styles.drawerIconBox}>
                  <Text style={styles.drawerItemIcon}>■</Text>
                </View>
                <Text style={styles.drawerItemText}>Privacy</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.drawerItem}
                onPress={handleGoToAbout}
              >
                <View style={styles.drawerIconBox}>
                  <Text style={styles.drawerItemIcon}>ⓘ</Text>
                </View>
                <Text style={styles.drawerItemText}>About Us</Text>
              </TouchableOpacity>

              {/* Added Help navigation */}
              <TouchableOpacity 
                style={styles.drawerItem}
                onPress={handleGoToHelp}
              >
                <View style={styles.drawerIconBox}>
                  <Text style={styles.drawerItemIcon}>◇</Text>
                </View>
                <Text style={styles.drawerItemText}>Help</Text>
              </TouchableOpacity>

              <View style={styles.drawerDivider} />

              <TouchableOpacity 
                style={[styles.drawerItem, styles.drawerItemDanger]}
                onPress={handleLogout}
              >
                <View style={styles.drawerIconBox}>
                  <Text style={styles.drawerItemIcon}>▲</Text>
                </View>
                <Text style={[styles.drawerItemText, styles.drawerItemDangerText]}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableOpacity>
      )}

      {/* Floating Chat Button with Pulse */}
      <Animated.View style={[styles.chatButtonContainer, { transform: [{ scale: pulseAnim }] }]}>
        <TouchableOpacity 
          style={styles.floatingChatButton}
          onPress={toggleChat}
          activeOpacity={0.9}
        >
          <View style={styles.chatButtonBackground}>
            <Text style={styles.chatIcon}>💬</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Modern Chat Modal */}
      <Modal
        visible={isChatVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeChat}
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.chatContainer}>
            <LinearGradient
              colors={['#58656E', '#7A8A94']}
              style={styles.chatHeader}
            >
              <View style={styles.chatHeaderInfo}>
                <Text style={styles.chatTitle}>AI Assistant</Text>
                <View style={styles.onlineIndicator}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.chatSubtitle}>Always here to help</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={closeChat}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </LinearGradient>

            <ScrollView 
              style={styles.messagesContainer}
              ref={ref => {
                if (ref) {
                  setTimeout(() => ref.scrollToEnd({ animated: true }), 100)
                }
              }}
            >
              {messages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.messageBubble,
                    message.isUser ? styles.userMessage : styles.botMessage
                  ]}
                >
                  {!message.isUser && (
                    <View style={styles.botAvatar}>
                      <Text style={styles.botAvatarText}>AI</Text>
                    </View>
                  )}
                  <View style={[
                    styles.messageContent,
                    message.isUser && styles.userMessageContent
                  ]}>
                    <Text style={[
                      styles.messageText,
                      message.isUser ? styles.userMessageText : styles.botMessageText
                    ]}>
                      {message.text}
                    </Text>
                    <Text style={[
                      styles.messageTime,
                      message.isUser && styles.userMessageTime
                    ]}>
                      {formatTime(message.timestamp)}
                    </Text>
                  </View>
                </View>
              ))}
              {isLoading && (
                <View style={[styles.messageBubble, styles.botMessage]}>
                  <View style={styles.botAvatar}>
                    <Text style={styles.botAvatarText}>AI</Text>
                  </View>
                  <View style={styles.messageContent}>
                    <View style={styles.typingIndicator}>
                      <View style={styles.typingDot} />
                      <View style={styles.typingDot} />
                      <View style={styles.typingDot} />
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={inputMessage}
                onChangeText={setInputMessage}
                placeholder="Ask about skincare..."
                placeholderTextColor="#999"
                multiline
                maxLength={500}
              />
              <TouchableOpacity 
                style={[
                  styles.sendButton,
                  (!inputMessage.trim() || isLoading) && styles.sendButtonDisabled
                ]}
                onPress={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
              >
                <LinearGradient
                  colors={inputMessage.trim() && !isLoading ? ['#58656E', '#7A8A94'] : ['#E0E0E0', '#E0E0E0']}
                  style={styles.sendButtonGradient}
                >
                  <Text style={styles.sendButtonText}>↑</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  content: {
    padding: 20,
    paddingTop: 80,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#58656E',
    fontFamily: 'System',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerSpacer: {
    width: 44,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 280,
    height: 280,
  },
  placeholder: {
    width: 44,
  },
  
  // Floating Drawer Button
  drawerButtonContainer: {
    position: 'absolute',
    top: 50,
    left: 24,
    zIndex: 999,
  },
  floatingDrawerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  drawerButtonBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(90, 101, 110, 0.9)',
    borderRadius: 28,
    shadowColor: '#58656E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  menuIconContainerFloating: {
    width: 20,
    height: 16,
    justifyContent: 'space-between',
  },
  menuLineFloating: {
    width: '100%',
    height: 2,
    backgroundColor: '#FFF',
    borderRadius: 1,
  },
  
  // Hero Section
  heroSection: {
    marginBottom: 30,
  },
  greeting: {
    fontSize: 16,
    color: '#58656E',
    marginBottom: 8,
    fontWeight: '500',
    fontFamily: 'System',
    textAlign: 'center',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#A36B4F',
    marginBottom: 8,
    letterSpacing: -0.5,
    textAlign: 'center',
    fontFamily: 'System',
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#58656E',
    fontWeight: '400',
    textAlign: 'center',
    fontFamily: 'System',
  },
  
  // Main Actions
  mainActionsSection: {
    marginBottom: 24,
  },
  mainActionCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  mainActionGradient: {
    padding: 20,
  },
  mainActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mainActionIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  mainActionIcon: {
    fontSize: 32,
    color: '#FFF',
    fontWeight: '300',
  },
  mainActionText: {
    flex: 1,
  },
  mainActionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
    fontFamily: 'System',
  },
  mainActionDesc: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'System',
  },
  mainActionArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowIcon: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: '700',
  },
  
  // Stats
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statGradient: {
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 8,
    color: '#A36B4F',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: '#A36B4F',
    marginBottom: 4,
    fontFamily: 'System',
  },
  statLabel: {
    fontSize: 12,
    color: '#58656E',
    fontWeight: '500',
    fontFamily: 'System',
  },
  
  // Quick Actions
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#A36B4F',
    marginBottom: 16,
    letterSpacing: -0.5,
    fontFamily: 'System',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 24,
  },
  quickCard: {
    width: '23%',
    aspectRatio: 1,
    margin: '1%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F3F0',
  },
  quickIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F8F9F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickIcon: {
    fontSize: 24,
    color: '#A36B4F',
  },
  quickLabel: {
    fontSize: 11,
    color: '#58656E',
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'System',
  },
  
  // Tips Card
  tipsCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F3F0',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipsIcon: {
    fontSize: 28,
    marginRight: 10,
    color: '#A36B4F',
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#A36B4F',
    fontFamily: 'System',
  },
  tipsContent: {
    fontSize: 14,
    color: '#58656E',
    lineHeight: 20,
    fontFamily: 'System',
  },
  
  // Drawer
  drawerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(163, 107, 79, 0.3)',
    zIndex: 1000,
  },
  drawerContent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '80%',
    maxWidth: 320,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  drawerHeader: {
    padding: 30,
    paddingTop: 60,
  },
  drawerProfileSection: {
    alignItems: 'center',
  },
  drawerProfileFrame: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  drawerProfileImage: {
    width: '100%',
    height: '100%',
  },
  drawerProfilePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#A36B4F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerProfileInitial: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: 'System',
  },
  drawerUserName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#A36B4F',
    marginBottom: 4,
    fontFamily: 'System',
  },
  drawerUserEmail: {
    fontSize: 14,
    color: '#58656E',
    fontFamily: 'System',
  },
  drawerMenu: {
    padding: 20,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F8F9F7',
  },
  drawerIconBox: {
    width: 24,
    height: 24,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerItemIcon: {
    fontSize: 16,
    color: '#A36B4F',
    fontWeight: '300',
  },
  drawerItemText: {
    fontSize: 16,
    color: '#A36B4F',
    fontWeight: '600',
    fontFamily: 'System',
  },
  drawerDivider: {
    height: 1,
    backgroundColor: '#E8EBE6',
    marginVertical: 16,
  },
  drawerItemDanger: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  drawerItemDangerText: {
    color: '#F44336',
    fontFamily: 'System',
  },
  
  // Floating Chat Button
  chatButtonContainer: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    zIndex: 999,
  },
  floatingChatButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  chatButtonBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(90, 101, 110, 0.9)',
    borderRadius: 28,
    shadowColor: '#58656E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  chatIcon: {
    fontSize: 24,
    color: '#FFF',
  },
  
  // Chat Modal
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(163, 107, 79, 0.3)',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#F8F9F7',
    marginTop: 80,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
    fontFamily: 'System',
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  chatSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    fontFamily: 'System',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: '600',
  },
  messagesContainer: {
    flex: 1,
    padding: 12,
    backgroundColor: '#F8F9F7',
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  userMessage: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  botMessage: {
    alignSelf: 'flex-start',
  },
  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E8EBE6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  botAvatarText: {
    fontSize: 12,
    color: '#A36B4F',
    fontWeight: '600',
  },
  messageContent: {
    maxWidth: '75%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 10,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F3F0',
  },
  userMessageContent: {
    backgroundColor: '#58656E',
    borderColor: '#58656E',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#58656E',
    marginBottom: 4,
    fontFamily: 'System',
  },
  userMessageText: {
    color: '#FFF',
  },
  botMessageText: {
    color: '#58656E',
  },
  messageTime: {
    fontSize: 10,
    color: '#9BAAAE',
    alignSelf: 'flex-end',
    fontFamily: 'System',
  },
  userMessageTime: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9BAAAE',
    marginHorizontal: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E8EBE6',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F8F9F7',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 80,
    fontSize: 14,
    color: '#58656E',
    borderWidth: 1,
    borderColor: '#E8EBE6',
    fontFamily: 'System',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
})