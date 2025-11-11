"use client"

import { useState, useEffect } from "react"
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  StyleSheet, 
  ScrollView, 
  Image,
  Platform,
  Dimensions 
} from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as ImagePicker from 'expo-image-picker'
import DateTimePicker from "@react-native-community/datetimepicker"
import { API_URL } from "../config/api"
import { LinearGradient } from 'expo-linear-gradient'

const { width } = Dimensions.get('window')

export default function UpdateProfileScreen({ navigation }) {
  const [user, setUser] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  
  // Form fields
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [age, setAge] = useState("")
  const [birthday, setBirthday] = useState(new Date())
  const [profileImage, setProfileImage] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  
  // Original values for comparison
  const [originalData, setOriginalData] = useState({})
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    fetchUser()
  }, [])

  useEffect(() => {
    checkForChanges()
  }, [name, email, password, age, birthday, profileImage])

  const fetchUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user")
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
        
        let userBirthday = new Date()
        if (parsedUser.birthday) {
          userBirthday = new Date(parsedUser.birthday)
          if (isNaN(userBirthday.getTime())) {
            userBirthday = new Date()
          }
        }
        
        const userData = {
          name: parsedUser.name || "",
          email: parsedUser.email || "",
          age: parsedUser.age ? String(parsedUser.age) : "",
          birthday: userBirthday,
          profileImage: parsedUser.profileImage || null
        }
        
        setName(userData.name)
        setEmail(userData.email)
        setAge(userData.age)
        setBirthday(userData.birthday)
        setProfileImage(userData.profileImage)
        setOriginalData(userData)
      }
    } catch (err) {
      console.error("Failed to load user:", err)
    }
  }

  const checkForChanges = () => {
    const changed = 
      name !== originalData.name ||
      email !== originalData.email ||
      (password !== "" && password.length > 0) ||
      age !== originalData.age ||
      birthday.getTime() !== originalData.birthday?.getTime() ||
      profileImage !== originalData.profileImage
    
    setHasChanges(changed)
  }

  const pickImage = async () => {
    if (!isEditing) return

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Sorry, we need camera roll permissions to make this work!')
      return
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    })

    if (!result.canceled && result.assets && result.assets[0]) {
      setProfileImage(result.assets[0])
    }
  }

  const takePhoto = async () => {
    if (!isEditing) return

    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Sorry, we need camera permissions to make this work!')
      return
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    })

    if (!result.canceled && result.assets && result.assets[0]) {
      setProfileImage(result.assets[0])
    }
  }

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false)
    }
    
    if (selectedDate) {
      setBirthday(selectedDate)
    }
  }

  const showDatepicker = () => {
    if (isEditing) {
      setShowDatePicker(true)
    }
  }

  const formatDate = (date) => {
    return date.toISOString().split("T")[0]
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setName(originalData.name)
    setEmail(originalData.email)
    setPassword("")
    setAge(originalData.age)
    setBirthday(originalData.birthday)
    setProfileImage(originalData.profileImage)
    setHasChanges(false)
    setShowDatePicker(false)
  }

  const handleBack = () => {
    navigation.navigate("Home")
  }

  const handleUpdate = async () => {
    if (!user) return Alert.alert("Error", "No user found.")

    try {
      setUploading(true)

      const formData = new FormData()
      formData.append('name', name)
      formData.append('email', email)
      formData.append('age', age)
      formData.append('birthday', formatDate(birthday))
      
      if (password) {
        formData.append('password', password)
      }

      if (profileImage && profileImage.uri) {
        formData.append('profileImage', {
          uri: profileImage.uri,
          type: 'image/jpeg',
          name: 'profile.jpg'
        })
      }

      const res = await fetch(`${API_URL}/auth/update/${user._id}`, {
        method: "PUT",
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      })

      const data = await res.json()

      if (res.ok) {
        await AsyncStorage.setItem("user", JSON.stringify(data.user))
        Alert.alert("Success", "Profile updated successfully!")
        setPassword("")
        setIsEditing(false)
        
        await fetchUser()
        setHasChanges(false)
        setShowDatePicker(false)
      } else {
        Alert.alert("Error", data.message || "Update failed")
      }
    } catch (err) {
      Alert.alert("Error", err.message)
    } finally {
      setUploading(false)
    }
  }

  const getImageSource = () => {
    if (profileImage && profileImage.uri) {
      return { uri: profileImage.uri }
    } else if (profileImage && profileImage.url) {
      return { uri: profileImage.url }
    }
    return null
  }

  return (
    <View style={styles.container}>
      {/* Gradient Background */}
      <LinearGradient
        colors={['#E8F5E8', '#F0F8F0', '#FFFFFF']}
        style={styles.gradientBackground}
      />

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Modern Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#A67B5B', '#C19A6B']}
                style={styles.backButtonGradient}
              >
                <Text style={styles.backIcon}>←</Text>
                <Text style={styles.backButtonText}>Back</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            {!isEditing && (
              <TouchableOpacity 
                style={styles.editButton}
                onPress={handleEdit}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#A67B5B', '#C19A6B']}
                  style={styles.editButtonGradient}
                >
                  <Text style={styles.editIcon}>✎</Text>
                  <Text style={styles.editButtonText}>Edit</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.headerTitle}>Profile</Text>
          <Text style={styles.headerSubtitle}>Manage your account information</Text>
        </View>

        <View style={styles.content}>
          {/* Profile Avatar Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity 
              onPress={isEditing ? pickImage : null}
              activeOpacity={isEditing ? 0.7 : 1}
            >
              <View style={styles.avatarContainer}>
                <View style={styles.avatarRing}>
                  {getImageSource() ? (
                    <Image 
                      source={getImageSource()} 
                      style={styles.avatarImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <LinearGradient
                      colors={['#A67B5B', '#C19A6B']}
                      style={styles.avatarPlaceholder}
                    >
                      <Text style={styles.avatarText}>
                        {name ? name.charAt(0).toUpperCase() : "U"}
                      </Text>
                    </LinearGradient>
                  )}
                </View>
                {isEditing && (
                  <View style={styles.cameraBadge}>
                    <LinearGradient
                      colors={['#A67B5B', '#C19A6B']}
                      style={styles.cameraBadgeGradient}
                    >
                      <Text style={styles.cameraIcon}>◉</Text>
                    </LinearGradient>
                  </View>
                )}
              </View>
            </TouchableOpacity>
            
            <Text style={styles.avatarName}>{name || "User"}</Text>
            <Text style={styles.avatarEmail}>{email || "user@mediskin.com"}</Text>
            
            {isEditing && (
              <View style={styles.imageButtons}>
                <TouchableOpacity 
                  style={styles.imageButton}
                  onPress={pickImage}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#F8F9F7', '#FFFFFF']}
                    style={styles.imageButtonGradient}
                  >
                    <Text style={styles.imageButtonIcon}>◫</Text>
                    <Text style={styles.imageButtonText}>Gallery</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.imageButton}
                  onPress={takePhoto}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#F8F9F7', '#FFFFFF']}
                    style={styles.imageButtonGradient}
                  >
                    <Text style={styles.imageButtonIcon}>◉</Text>
                    <Text style={styles.imageButtonText}>Camera</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
            
            {!isEditing && (
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Active Account</Text>
              </View>
            )}
          </View>

          {/* Personal Information Card */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconBox}>
                <LinearGradient
                  colors={['#F8F9F7', '#FFFFFF']}
                  style={styles.sectionIconGradient}
                >
                  <Text style={styles.sectionIcon}>◉</Text>
                </LinearGradient>
              </View>
              <Text style={styles.sectionTitle}>Personal Information</Text>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <View style={[styles.fieldInputWrapper, !isEditing && styles.fieldInputDisabled]}>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Enter your full name"
                  placeholderTextColor="#999"
                  value={name}
                  onChangeText={setName}
                  editable={isEditing}
                />
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              <View style={[styles.fieldInputWrapper, !isEditing && styles.fieldInputDisabled]}>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Enter your email"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  editable={isEditing}
                  autoCapitalize="none"
                />
              </View>
            </View>

            {isEditing && (
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>New Password</Text>
                <View style={styles.fieldInputWrapper}>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="Leave blank to keep current"
                    placeholderTextColor="#999"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>
                <Text style={styles.fieldHint}>Only fill if you want to change password</Text>
              </View>
            )}
          </View>

          {/* Additional Details Card */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconBox}>
                <LinearGradient
                  colors={['#F8F9F7', '#FFFFFF']}
                  style={styles.sectionIconGradient}
                >
                  <Text style={styles.sectionIcon}>◧</Text>
                </LinearGradient>
              </View>
              <Text style={styles.sectionTitle}>Additional Details</Text>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Age</Text>
              <View style={[styles.fieldInputWrapper, !isEditing && styles.fieldInputDisabled]}>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Enter your age"
                  placeholderTextColor="#999"
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                  editable={isEditing}
                />
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Birthday</Text>
              <TouchableOpacity
                style={[styles.fieldInputWrapper, !isEditing && styles.fieldInputDisabled]}
                onPress={showDatepicker}
                disabled={!isEditing}
                activeOpacity={isEditing ? 0.7 : 1}
              >
                <Text style={[styles.dateText, !isEditing && styles.dateTextDisabled]}>
                  {formatDate(birthday)}
                </Text>
              </TouchableOpacity>
              
              {showDatePicker && (
                <DateTimePicker
                  value={birthday}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                />
              )}
            </View>
          </View>

          {/* Action Buttons */}
          {isEditing && (
            <View style={styles.actionButtons}>
              {hasChanges && (
                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={handleUpdate}
                  activeOpacity={0.9}
                  disabled={uploading}
                >
                  <LinearGradient
                    colors={uploading ? ['#9E9E9E', '#9E9E9E'] : ['#A67B5B', '#C19A6B']}
                    style={styles.saveButtonGradient}
                  >
                    <Text style={styles.saveButtonText}>
                      {uploading ? "Saving..." : "Save Changes"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={handleCancel}
                activeOpacity={0.8}
                disabled={uploading}
              >
                <LinearGradient
                  colors={['#F8F9F7', '#FFFFFF']}
                  style={styles.cancelButtonGradient}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  
  // Header
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#A67B5B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  backButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  backIcon: {
    fontSize: 20,
    color: '#FFF',
    marginRight: 4,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  editButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#A67B5B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  editButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  editIcon: {
    fontSize: 18,
    color: '#FFF',
    marginRight: 6,
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#A67B5B',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#4E5450',
    fontWeight: '400',
  },
  
  // Content
  content: {
    paddingHorizontal: 20,
  },
  
  // Avatar Section
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 32,
    backgroundColor: '#FFF',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F3F0',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatarRing: {
    width: 130,
    height: 130,
    borderRadius: 65,
    padding: 4,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F1F3F0',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 61,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 61,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFF',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#A67B5B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  cameraBadgeGradient: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    fontSize: 20,
    color: '#FFF',
  },
  avatarName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#A67B5B',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  avatarEmail: {
    fontSize: 15,
    color: '#4E5450',
    marginBottom: 20,
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  imageButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  imageButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  imageButtonIcon: {
    fontSize: 18,
    color: '#A67B5B',
  },
  imageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A67B5B',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9F7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F3F0',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#A67B5B',
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A67B5B',
  },
  
  // Section
  section: {
    marginBottom: 20,
    backgroundColor: '#FFF',
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F3F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionIconBox: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionIconGradient: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionIcon: {
    fontSize: 20,
    color: '#A67B5B',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#A67B5B',
    letterSpacing: -0.5,
    marginLeft: 12,
  },
  
  // Field
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4E5450',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  fieldInputWrapper: {
    backgroundColor: '#F8F9F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E8EBE6',
  },
  fieldInput: {
    fontSize: 16,
    color: '#A67B5B',
    fontWeight: '500',
    paddingVertical: 10,
  },
  fieldInputDisabled: {
    backgroundColor: '#FAFAFA',
    opacity: 0.7,
  },
  dateText: {
    fontSize: 16,
    color: '#A67B5B',
    fontWeight: '500',
    paddingVertical: 14,
  },
  dateTextDisabled: {
    color: '#999',
  },
  fieldHint: {
    fontSize: 12,
    color: '#4E5450',
    marginTop: 8,
    fontStyle: 'italic',
  },
  
  // Action Buttons
  actionButtons: {
    marginTop: 8,
    gap: 12,
  },
  saveButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#A67B5B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  saveButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: 0.3,
  },
  cancelButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cancelButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8EBE6',
  },
  cancelButtonText: {
    color: '#A67B5B',
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: 0.3,
  },
})