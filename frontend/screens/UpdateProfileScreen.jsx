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
  Dimensions,
  StatusBar 
} from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as ImagePicker from 'expo-image-picker'
import DateTimePicker from "@react-native-community/datetimepicker"
import { API_URL } from "../config/api"
import Icon from 'react-native-vector-icons/MaterialIcons'

// Color Theme
const COLORS = {
  charcoal: '#3A343C',
  slate: '#58656E',
  dustyBlue: '#9BAAAE',
  terracotta: '#A36B4F',
  sand: '#D8CEB8',
  white: '#FFFFFF',
  lightGray: '#F5F3F0',
};

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
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.sand} />
      
      {/* Floating Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={24} color={COLORS.charcoal} />
        </TouchableOpacity>
        
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Profile</Text>
          <Text style={styles.headerSubtitle}>Manage your account information</Text>
        </View>
        
        {!isEditing && (
          <TouchableOpacity 
            style={styles.editButton}
            onPress={handleEdit}
            activeOpacity={0.7}
          >
            <Icon name="edit" size={24} color={COLORS.charcoal} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
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
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>
                      {name ? name.charAt(0).toUpperCase() : "U"}
                    </Text>
                  </View>
                )}
              </View>
              {isEditing && (
                <View style={styles.cameraBadge}>
                  <Icon name="photo-camera" size={18} color={COLORS.white} />
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
                <Icon name="photo-library" size={20} color={COLORS.terracotta} />
                <Text style={styles.imageButtonText}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.imageButton}
                onPress={takePhoto}
                activeOpacity={0.8}
              >
                <Icon name="photo-camera" size={20} color={COLORS.terracotta} />
                <Text style={styles.imageButtonText}>Camera</Text>
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
            <Icon name="person" size={24} color={COLORS.terracotta} />
            <Text style={styles.sectionTitle}>Personal Information</Text>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Full Name</Text>
            <View style={[styles.fieldInputWrapper, !isEditing && styles.fieldInputDisabled]}>
              <TextInput
                style={styles.fieldInput}
                placeholder="Enter your full name"
                placeholderTextColor={COLORS.slate}
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
                placeholderTextColor={COLORS.slate}
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
                  placeholderTextColor={COLORS.slate}
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
            <Icon name="calendar-today" size={24} color={COLORS.terracotta} />
            <Text style={styles.sectionTitle}>Additional Details</Text>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Age</Text>
            <View style={[styles.fieldInputWrapper, !isEditing && styles.fieldInputDisabled]}>
              <TextInput
                style={styles.fieldInput}
                placeholder="Enter your age"
                placeholderTextColor={COLORS.slate}
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
                <Text style={styles.saveButtonText}>
                  {uploading ? "Saving..." : "Save Changes"}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={handleCancel}
              activeOpacity={0.8}
              disabled={uploading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.sand,
  },
  header: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
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
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.charcoal,
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.slate,
    fontWeight: '400',
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 140,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  
  // Avatar Section
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 32,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.dustyBlue,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatarRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    padding: 4,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.dustyBlue,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 56,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 56,
    backgroundColor: COLORS.terracotta,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.white,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.terracotta,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarName: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.charcoal,
    marginBottom: 4,
  },
  avatarEmail: {
    fontSize: 14,
    color: COLORS.slate,
    marginBottom: 20,
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.dustyBlue,
    gap: 8,
  },
  imageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.terracotta,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.dustyBlue,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.terracotta,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.terracotta,
  },
  
  // Section
  section: {
    marginBottom: 20,
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.dustyBlue,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.charcoal,
    marginLeft: 12,
  },
  
  // Field
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.slate,
    marginBottom: 8,
  },
  fieldInputWrapper: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: COLORS.dustyBlue,
  },
  fieldInput: {
    fontSize: 16,
    color: COLORS.charcoal,
    fontWeight: '500',
    paddingVertical: 12,
  },
  fieldInputDisabled: {
    backgroundColor: COLORS.lightGray,
    opacity: 0.7,
  },
  dateText: {
    fontSize: 16,
    color: COLORS.charcoal,
    fontWeight: '500',
    paddingVertical: 12,
  },
  dateTextDisabled: {
    color: COLORS.slate,
  },
  fieldHint: {
    fontSize: 12,
    color: COLORS.slate,
    marginTop: 8,
    fontStyle: 'italic',
  },
  
  // Action Buttons
  actionButtons: {
    marginTop: 8,
    gap: 12,
  },
  saveButton: {
    backgroundColor: COLORS.terracotta,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.terracotta,
    shadowColor: COLORS.terracotta,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.dustyBlue,
  },
  cancelButtonText: {
    color: COLORS.terracotta,
    fontWeight: '600',
    fontSize: 16,
  },
})