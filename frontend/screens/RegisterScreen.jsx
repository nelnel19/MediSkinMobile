"use client"

import { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Platform,
  ScrollView,
  SafeAreaView,
  Image,
} from "react-native"
import CheckBox from "expo-checkbox"
import DateTimePicker from "@react-native-community/datetimepicker"
import axios from "axios"
import { API_URL } from "../config/api"

const UserIcon = "◯"
const MailIcon = "✉"
const LockIcon = "⬤"
const CalendarIcon = "◻"

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [age, setAge] = useState("")
  const [birthday, setBirthday] = useState(new Date())
  const [showPicker, setShowPicker] = useState(false)
  const [agree, setAgree] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleRegister = async () => {
    if (!name || !email || !password || !age || !birthday) return Alert.alert("Error", "Please fill in all fields")

    if (!agree) return Alert.alert("Terms Required", "You must agree to the Terms and Privacy Policy")

    setLoading(true)
    try {
      const res = await axios.post(`${API_URL}/auth/register`, {
        name,
        email,
        password,
        age: Number(age),
        birthday: birthday.toISOString().split("T")[0],
      })
      Alert.alert("Success", res.data.message)
      navigation.navigate("Login")
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || birthday
    setShowPicker(Platform.OS === "ios")
    setBirthday(currentDate)
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
            <Text style={styles.tagline}>Join Our Beauty Community</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Create Your Account</Text>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>{UserIcon}</Text>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#A89F99"
                value={name}
                onChangeText={setName}
              />
            </View>

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
                secureTextEntry={true}
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <View style={styles.rowContainer}>
              <View style={[styles.inputWrapper, styles.halfWidth]}>
                <Text style={styles.inputIcon}>№</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Age"
                  placeholderTextColor="#A89F99"
                  keyboardType="numeric"
                  value={age}
                  onChangeText={setAge}
                />
              </View>

              <TouchableOpacity
                style={[styles.inputWrapper, styles.halfWidth, styles.dateButton]}
                onPress={() => setShowPicker(true)}
              >
                <Text style={styles.inputIcon}>{CalendarIcon}</Text>
                <Text style={styles.dateText}>{birthday.toISOString().split("T")[0]}</Text>
              </TouchableOpacity>
            </View>

            {showPicker && (
              <DateTimePicker
                value={birthday}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}

            <View style={styles.checkboxContainer}>
              <CheckBox
                value={agree}
                onValueChange={setAgree}
                color={agree ? "#7A8B7F" : "#E5DDD5"}
                style={styles.checkbox}
              />
              <Text style={styles.checkboxText}>
                I agree to the <Text style={styles.link}>Terms of Service</Text> and{" "}
                <Text style={styles.link}>Privacy Policy</Text>
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.buttonText}>{loading ? "Creating Account..." : "Create Account"}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerSection}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.loginLink}>Sign In</Text>
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
  },
  container: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 20,
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
    marginBottom: 28,
    marginTop: 10,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "300",
    color: "#2C2C2C",
    marginBottom: 20,
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
    marginBottom: 12,
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
  dateText: {
    flex: 1,
    fontSize: 16,
    color: "#2C2C2C",
    fontWeight: "400",
    fontFamily: "System",
  },
  rowContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  halfWidth: {
    flex: 1,
    marginBottom: 0,
  },
  dateButton: {
    justifyContent: "center",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
    marginTop: 8,
  },
  checkbox: {
    marginRight: 12,
    marginTop: 2,
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    color: "#2C2C2C",
    lineHeight: 20,
    fontFamily: "System",
    fontWeight: "400",
  },
  link: {
    color: "#7A8B7F",
    fontWeight: "600",
    fontFamily: "System",
  },
  button: {
    backgroundColor: "#7A8B7F",
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
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
  footerSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 32,
  },
  footerText: {
    color: "#8B8B8B",
    fontSize: 15,
    fontFamily: "System",
    fontWeight: "400",
  },
  loginLink: {
    color: "#7A8B7F",
    fontWeight: "600",
    fontSize: 15,
    fontFamily: "System",
  },
})