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
  Modal,
} from "react-native"
import CheckBox from "expo-checkbox"
import DateTimePicker from "@react-native-community/datetimepicker"
import axios from "axios"
import { API_URL } from "../config/api"
import * as ImagePicker from "expo-image-picker"

const UserIcon = "◯"
const MailIcon = "✉"
const LockIcon = "⬤"
const CalendarIcon = "◻"
const GenderIcon = "⚤"
const ImageIcon = "🖼️"

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [age, setAge] = useState("")
  const [birthday, setBirthday] = useState(new Date())
  const [gender, setGender] = useState("prefer not to say")
  const [profileImage, setProfileImage] = useState(null)
  const [showPicker, setShowPicker] = useState(false)
  const [showGenderModal, setShowGenderModal] = useState(false)
  const [agree, setAgree] = useState(false)
  const [loading, setLoading] = useState(false)

  const genderOptions = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" },
    { value: "prefer not to say", label: "Prefer not to say" },
  ]

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    
    if (status !== "granted") {
      Alert.alert("Permission Required", "Sorry, we need camera roll permissions to upload images.")
      return
    }

    let result = await ImagePicker.launchImagePickerAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    })

    if (!result.canceled) {
      setProfileImage({
        uri: result.assets[0].uri,
        base64: result.assets[0].base64,
        type: result.assets[0].mimeType || "image/jpeg",
        name: `profile_${Date.now()}.jpg`
      })
    }
  }

  const removeImage = () => {
    setProfileImage(null)
  }

  const handleRegister = async () => {
    if (!name || !email || !password || !age || !birthday) {
      return Alert.alert("Error", "Please fill in all required fields")
    }

    if (!agree) {
      return Alert.alert("Terms Required", "You must agree to the Terms and Privacy Policy")
    }

    setLoading(true)
    
    try {
      const formData = new FormData()
      
      formData.append("name", name)
      formData.append("email", email)
      formData.append("password", password)
      formData.append("age", Number(age))
      formData.append("birthday", birthday.toISOString().split("T")[0])
      formData.append("gender", gender)
      
      // Add profile image if selected
      if (profileImage) {
        formData.append("profileImage", {
          uri: profileImage.uri,
          type: profileImage.type,
          name: profileImage.name
        })
      }

      const res = await axios.post(`${API_URL}/auth/register`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      
      Alert.alert("Success", res.data.message)
      navigation.navigate("Login")
    } catch (err) {
      console.error("Registration error:", err.response?.data || err.message)
      Alert.alert(
        "Registration Failed", 
        err.response?.data?.message || "Something went wrong. Please try again."
      )
    } finally {
      setLoading(false)
    }
  }

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || birthday
    setShowPicker(Platform.OS === "ios")
    setBirthday(currentDate)
  }

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
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

            {/* Profile Image Upload */}
            <View style={styles.imageSection}>
              <TouchableOpacity 
                style={styles.imageUploadButton}
                onPress={pickImage}
              >
                {profileImage ? (
                  <Image 
                    source={{ uri: profileImage.uri }} 
                    style={styles.profileImage}
                  />
                ) : (
                  <View style={styles.placeholderImage}>
                    <Text style={styles.placeholderIcon}>{ImageIcon}</Text>
                    <Text style={styles.placeholderText}>Add Profile Photo</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              {profileImage && (
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={removeImage}
                >
                  <Text style={styles.removeImageText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Form Fields */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>{UserIcon}</Text>
              <TextInput
                style={styles.input}
                placeholder="Full Name *"
                placeholderTextColor="#A89F99"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>{MailIcon}</Text>
              <TextInput
                style={styles.input}
                placeholder="Email Address *"
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
                placeholder="Password *"
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
                  placeholder="Age *"
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
                <Text style={styles.dateText} numberOfLines={1}>
                  {formatDate(birthday)}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Gender Selector */}
            <TouchableOpacity
              style={[styles.inputWrapper, styles.genderButton]}
              onPress={() => setShowGenderModal(true)}
            >
              <Text style={styles.inputIcon}>{GenderIcon}</Text>
              <Text style={styles.genderText}>
                {genderOptions.find(g => g.value === gender)?.label || "Select Gender *"}
              </Text>
            </TouchableOpacity>

            {showPicker && (
              <DateTimePicker
                value={birthday}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
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
              <Text style={styles.buttonText}>
                {loading ? "Creating Account..." : "Create Account"}
              </Text>
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

      {/* Gender Selection Modal */}
      <Modal
        visible={showGenderModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowGenderModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Gender</Text>
            
            {genderOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.genderOption,
                  gender === option.value && styles.genderOptionSelected
                ]}
                onPress={() => {
                  setGender(option.value)
                  setShowGenderModal(false)
                }}
              >
                <Text style={[
                  styles.genderOptionText,
                  gender === option.value && styles.genderOptionTextSelected
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowGenderModal(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  imageSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  imageUploadButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FEFDFB",
    borderWidth: 2,
    borderColor: "#E5DDD5",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
  },
  placeholderImage: {
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderIcon: {
    fontSize: 32,
    color: "#9B8B7E",
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 12,
    color: "#9B8B7E",
    textAlign: "center",
    paddingHorizontal: 8,
  },
  removeImageButton: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#FFE5E5",
    borderRadius: 16,
  },
  removeImageText: {
    color: "#D86C6C",
    fontSize: 12,
    fontWeight: "500",
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
  genderText: {
    flex: 1,
    fontSize: 16,
    color: "#2C2C2C",
    fontWeight: "400",
    fontFamily: "System",
  },
  genderButton: {
    justifyContent: "space-between",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FEFDFB",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2C2C2C",
    marginBottom: 20,
    textAlign: "center",
  },
  genderOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "#F9F7F5",
  },
  genderOptionSelected: {
    backgroundColor: "#7A8B7F",
  },
  genderOptionText: {
    fontSize: 16,
    color: "#2C2C2C",
    fontWeight: "500",
    textAlign: "center",
  },
  genderOptionTextSelected: {
    color: "#FEFDFB",
  },
  modalCloseButton: {
    marginTop: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  modalCloseText: {
    fontSize: 16,
    color: "#7A8B7F",
    fontWeight: "600",
  },
})