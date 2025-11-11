"use client"

import { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ScrollView, SafeAreaView, Image } from "react-native"
import axios from "axios"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { API_URL } from "../config/api"

const MailIcon = "✉"
const LockIcon = "⬤"

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert("Error", "Please fill in all fields")

    setLoading(true)
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password })
      const user = res.data.user

      // Store both user object and email separately
      await AsyncStorage.setItem("user", JSON.stringify(user))
      await AsyncStorage.setItem("user_email", user.email) // Add this line

      Alert.alert("Welcome", `Hello, ${user.name}!`)
      navigation.replace("Home", { user })
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <View style={styles.headerSection}>
            <Image 
              source={require("../assets/logo1.png")} 
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.tagline}>Natural Beauty Starts Here</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Welcome</Text>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>{MailIcon}</Text>
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#A89F99"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>{LockIcon}</Text>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#A89F99"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.buttonText}>{loading ? "Signing In..." : "Sign In"}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.forgotContainer}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerSection}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.registerLink}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9F7F5",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
    justifyContent: "center",
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  tagline: {
    fontSize: 16,
    color: "#7A8B7F",
    fontWeight: "500",
    letterSpacing: 0.3,
    fontFamily: "System",
    fontStyle: "italic",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5DDD5",
    marginBottom: 32,
    marginTop: 10,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "300",
    color: "#2C2C2C",
    marginBottom: 24,
    letterSpacing: 0.8,
    textAlign: "center",
    fontFamily: "System",
    textTransform: "uppercase",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEFDFB",
    borderWidth: 1,
    borderColor: "#E5DDD5",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 56,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 14,
    color: "#9B8B7E",
    fontWeight: "300",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#2C2C2C",
    fontWeight: "400",
    fontFamily: "System",
  },
  button: {
    backgroundColor: "#7A8B7F",
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FEFDFB",
    fontWeight: "500",
    fontSize: 18,
    letterSpacing: 1,
    fontFamily: "System",
    textTransform: "uppercase",
  },
  forgotContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  forgotText: {
    color: "#9B8B7E",
    fontSize: 15,
    fontWeight: "500",
    fontFamily: "System",
  },
  footerSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 32,
  },
  footerText: {
    color: "#8B8B8B",
    fontSize: 15,
    fontFamily: "System",
    fontWeight: "400",
  },
  registerLink: {
    color: "#7A8B7F",
    fontWeight: "600",
    fontSize: 15,
    fontFamily: "System",
  },
})