import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

// Color Theme - Same as SkincareScreen
const COLORS = {
  primary: '#3A343C',       // Charcoal
  secondary: '#58656E',     // Slate
  tertiary: '#9BAAAE',      // Dusty Blue
  accent: '#A36B4F',        // Terracotta
  background: '#F5F3F0',    // Light Gray
  surface: '#FFFFFF',       // White
  error: '#D32F2F',         // Red
  success: '#388E3C',       // Green
  warning: '#F57C00',       // Orange
  info: '#1976D2',          // Blue for medium confidence
};

// 🔴 CHANGE THIS TO YOUR PC IP
const API_URL = "http://172.34.45.34:8000";

export default function SkinDiseaseScreen({ navigation }) {
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savingToHistory, setSavingToHistory] = useState(false);
  const [showRetakeModal, setShowRetakeModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorDetails, setErrorDetails] = useState("");
  const [historySaved, setHistorySaved] = useState(false);

  // Get user ID from storage (actual email)
  const getUserId = async () => {
    try {
      // Try to get user_id first (most direct)
      const userId = await AsyncStorage.getItem('user_id');
      if (userId) {
        return userId;
      }
      
      // Fallback to user_email
      const userEmail = await AsyncStorage.getItem('user_email');
      if (userEmail) {
        return userEmail;
      }
      
      // Fallback to user object
      const userString = await AsyncStorage.getItem('user');
      if (userString) {
        const user = JSON.parse(userString);
        return user.email;
      }
      
      // No user found
      return null;
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  };

  // Check if user is logged in
  const checkLoginStatus = async () => {
    const userId = await getUserId();
    return userId !== null;
  };

  // Convert image to base64
  const convertImageToBase64 = async (uri) => {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return `data:image/jpeg;base64,${base64}`;
    } catch (error) {
      console.error('Error converting image to base64:', error);
      return null;
    }
  };

  // Medications List Component
  const MedicationsList = ({ medications, generalAdvice }) => {
    const [expandedCategory, setExpandedCategory] = useState(null);
    
    return (
      <View style={styles.medicationsSection}>
        <View style={styles.medicationsHeader}>
          <Icon name="medical-services" size={22} color={COLORS.accent} />
          <Text style={styles.medicationsTitle}>Recommended Treatments</Text>
        </View>
        
        {medications && medications.map((medication, index) => (
          <View key={index} style={styles.medicationCategory}>
            <TouchableOpacity
              style={styles.categoryHeader}
              onPress={() => setExpandedCategory(expandedCategory === index ? null : index)}
            >
              <View style={styles.categoryTitleContainer}>
                <Icon name="category" size={18} color={COLORS.primary} />
                <Text style={styles.categoryTitle}>{medication.category}</Text>
              </View>
              <Icon 
                name={expandedCategory === index ? "expand-less" : "expand-more"} 
                size={24} 
                color={COLORS.secondary} 
              />
            </TouchableOpacity>
            
            {expandedCategory === index && (
              <View style={styles.categoryContent}>
                <Text style={styles.categoryDescription}>{medication.description}</Text>
                <View style={styles.medicationItems}>
                  {medication.items.map((item, itemIndex) => (
                    <View key={itemIndex} style={styles.medicationItem}>
                      <Icon name="check-circle" size={16} color={COLORS.success} />
                      <Text style={styles.medicationItemText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        ))}
        
        {generalAdvice && generalAdvice.length > 0 && (
          <View style={styles.generalAdviceSection}>
            <View style={styles.generalAdviceHeader}>
              <Icon name="tips-and-updates" size={20} color={COLORS.accent} />
              <Text style={styles.generalAdviceTitle}>Self-Care Tips</Text>
            </View>
            {generalAdvice.map((advice, index) => (
              <View key={index} style={styles.adviceItem}>
                <Icon name="fiber-manual-record" size={8} color={COLORS.accent} />
                <Text style={styles.adviceText}>{advice}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  // Disease Card Component with confidence warnings and medications
  const DiseaseCard = ({ disease, confidence, description, warning, medicationInfo }) => {
    let severityColor = COLORS.success;
    let confidenceLevel = "High";
    
    if (confidence >= 70) {
      severityColor = COLORS.success;
      confidenceLevel = "High";
    } else if (confidence >= 45) {
      severityColor = COLORS.info;
      confidenceLevel = "Medium";
    } else {
      severityColor = COLORS.error;
      confidenceLevel = "Low";
    }
    
    return (
      <View style={styles.diseaseCard}>
        <View style={styles.diseaseHeader}>
          <Icon name={confidence >= 70 ? "verified" : "warning"} size={24} color={severityColor} />
          <View style={styles.diseaseTitleContainer}>
            <Text style={styles.diseaseTitle}>{disease.replace(/_/g, ' ')}</Text>
            <View style={[styles.confidenceBadge, { backgroundColor: `${severityColor}20` }]}>
              <Text style={[styles.confidenceText, { color: severityColor }]}>
                {confidence}% confidence ({confidenceLevel})
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.confidenceBar}>
          <View style={[
            styles.confidenceFill,
            { 
              width: `${confidence}%`,
              backgroundColor: severityColor
            }
          ]} />
          <View style={[styles.thresholdMarker, { left: '45%' }]}>
            <Text style={styles.thresholdText}>45%</Text>
          </View>
          <View style={[styles.thresholdMarker, { left: '70%' }]}>
            <Text style={styles.thresholdText}>70%</Text>
          </View>
        </View>
        
        {warning && (
          <View style={styles.warningBox}>
            <Icon name="warning" size={16} color={COLORS.warning} />
            <Text style={styles.warningText}>{warning}</Text>
          </View>
        )}
        
        {description && (
          <View style={styles.descriptionBox}>
            <View style={styles.descriptionHeader}>
              <Icon name="info" size={18} color={COLORS.primary} />
              <Text style={styles.descriptionTitle}>Description</Text>
            </View>
            <Text style={styles.descriptionText}>{description}</Text>
          </View>
        )}
        
        {/* Medications Section */}
        {medicationInfo && medicationInfo.has_medications && (
          <MedicationsList 
            medications={medicationInfo.medications}
            generalAdvice={medicationInfo.general_advice}
          />
        )}
      </View>
    );
  };

  // Request permissions
  const requestPermissions = async () => {
    const galleryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!galleryPermission.granted || !cameraPermission.granted) {
      Alert.alert(
        "Permissions Required",
        "You need to grant camera and gallery permissions to use this feature."
      );
      return false;
    }
    return true;
  };

  const pickImageFromGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true, // Get base64 for saving to history
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
        setImageBase64(result.assets[0].base64 ? `data:image/jpeg;base64,${result.assets[0].base64}` : null);
        setResult(null);
        setHistorySaved(false);
        setShowRetakeModal(false);
      }
    } catch (error) {
      console.error("Image selection error:", error);
      Alert.alert("Error", "Could not select image. Please try again.");
    }
  };

  const takePhotoWithCamera = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true, // Get base64 for saving to history
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
        setImageBase64(result.assets[0].base64 ? `data:image/jpeg;base64,${result.assets[0].base64}` : null);
        setResult(null);
        setHistorySaved(false);
        setShowRetakeModal(false);
      }
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert("Error", "Could not take photo. Please try again.");
    }
  };

  const analyzeSkin = async () => {
    if (!image) {
      Alert.alert("No Image", "Please select or take a photo first");
      return;
    }

    setLoading(true);
    setShowRetakeModal(false);
    setErrorDetails("");
    setHistorySaved(false);

    const formData = new FormData();
    formData.append("file", {
      uri: image,
      name: "skin_analysis.jpg",
      type: "image/jpeg",
    });

    try {
      // Use the new endpoint that doesn't save to history
      const response = await fetch(`${API_URL}/predict-skin-only`, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const responseData = await response.json();

      if (!response.ok) {
        if (responseData.detail) {
          if (typeof responseData.detail === 'object') {
            if (responseData.detail.error === "LOW_CONFIDENCE") {
              setErrorMessage(responseData.detail.message || "Low confidence prediction");
              setErrorDetails(responseData.detail.details || "This might not be skin or doesn't match trained conditions.");
            } else {
              setErrorMessage(responseData.detail.message || "Analysis failed");
              setErrorDetails(responseData.detail.details || "");
            }
          } else {
            setErrorMessage(responseData.detail);
            setErrorDetails("");
          }
        } else {
          setErrorMessage("Analysis failed. Please try again.");
          setErrorDetails("");
        }
        setShowRetakeModal(true);
        return;
      }

      // Successful response
      if (responseData.disease && responseData.confidence) {
        setResult(responseData);
        
        if (responseData.warning) {
          Alert.alert(
            "Medium Confidence",
            responseData.warning,
            [{ text: "OK" }]
          );
        }
      } else {
        setErrorMessage("Invalid response from server. Please try again.");
        setShowRetakeModal(true);
      }
      
    } catch (error) {
      console.error("Analysis error:", error);
      
      if (error.message.includes("Network request failed") || 
          error.message.includes("fetch")) {
        Alert.alert(
          "Connection Error",
          "Could not connect to the server. Please check your internet connection and make sure the backend is running."
        );
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.");
        setErrorDetails(error.message);
        setShowRetakeModal(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const saveToHistory = async () => {
    if (!result || !imageBase64) {
      Alert.alert("Error", "No analysis to save");
      return;
    }

    setSavingToHistory(true);

    try {
      const userId = await getUserId();
      
      // Check if user is logged in
      if (!userId) {
        Alert.alert(
          "Login Required",
          "Please log in to save analysis to your history",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Login", onPress: () => navigation.navigate("Login") }
          ]
        );
        setSavingToHistory(false);
        return;
      }
      
      const formData = new FormData();
      formData.append("user_id", userId); // This will now be the actual email
      formData.append("image_data", imageBase64);
      formData.append("prediction_result", JSON.stringify(result));

      const response = await fetch(`${API_URL}/save-analysis-to-history`, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.detail || "Failed to save to history");
      }

      if (responseData.success) {
        setHistorySaved(true);
        Alert.alert(
          "Success",
          "Analysis saved to your history",
          [{ text: "OK" }]
        );
      } else {
        throw new Error("Failed to save to history");
      }
      
    } catch (error) {
      console.error("Save to history error:", error);
      Alert.alert(
        "Error",
        "Failed to save to history. Please try again."
      );
    } finally {
      setSavingToHistory(false);
    }
  };

  const clearImage = () => {
    setImage(null);
    setImageBase64(null);
    setResult(null);
    setHistorySaved(false);
    setShowRetakeModal(false);
    setErrorDetails("");
  };

  // View History
  const viewHistory = async () => {
    const isLoggedIn = await checkLoginStatus();
    if (!isLoggedIn) {
      Alert.alert(
        "Login Required",
        "Please log in to view your history",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Login", onPress: () => navigation.navigate("Login") }
        ]
      );
      return;
    }
    navigation.navigate('History');
  };

  // Retake Photo Modal - Enhanced with error details
  const RetakePhotoModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showRetakeModal}
      onRequestClose={() => setShowRetakeModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Icon name="error-outline" size={40} color={COLORS.error} />
            <Text style={styles.modalTitle}>Analysis Failed</Text>
          </View>
          
          <Text style={styles.modalMessage}>{errorMessage}</Text>
          
          {errorDetails ? (
            <View style={styles.errorDetailsBox}>
              <Icon name="info" size={16} color={COLORS.secondary} />
              <Text style={styles.errorDetailsText}>{errorDetails}</Text>
            </View>
          ) : null}
          
          <View style={styles.modalTips}>
            <Text style={styles.tipsTitle}>This usually means:</Text>
            <View style={styles.tipItem}>
              <Icon name="close" size={14} color={COLORS.error} />
              <Text style={styles.tipText}>The photo is not of skin</Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name="close" size={14} color={COLORS.error} />
              <Text style={styles.tipText}>It's an object or clothing</Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name="close" size={14} color={COLORS.error} />
              <Text style={styles.tipText}>The skin condition is not in our trained data</Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name="close" size={14} color={COLORS.error} />
              <Text style={styles.tipText}>The image is blurry or unclear</Text>
            </View>
          </View>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.modalSecondaryButton}
              onPress={() => {
                setShowRetakeModal(false);
                clearImage();
              }}
            >
              <Icon name="close" size={20} color={COLORS.secondary} />
              <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalPrimaryButton}
              onPress={() => {
                setShowRetakeModal(false);
                takePhotoWithCamera();
              }}
            >
              <Icon name="camera-alt" size={20} color={COLORS.surface} />
              <Text style={styles.modalPrimaryButtonText}>Retake Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Retake Photo Modal */}
      <RetakePhotoModal />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Skin Disease Detection</Text>
        </View>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={viewHistory}
        >
          <Icon name="history" size={24} color={COLORS.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Preview */}
        <View style={styles.imageSection}>
          {image ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: image }} style={styles.preview} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={clearImage}
              >
                <Icon name="close" size={20} color={COLORS.surface} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <Icon name="add-a-photo" size={48} color={COLORS.secondary} />
              <Text style={styles.placeholderText}>No image selected</Text>
              <Text style={styles.placeholderSubtext}>
                Take clear photo of skin area only
              </Text>
            </View>
          )}
        </View>

        {/* Upload Buttons */}
        <View style={styles.uploadSection}>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={takePhotoWithCamera}
          >
            <Icon name="photo-camera" size={24} color={COLORS.accent} />
            <Text style={styles.uploadButtonText}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.uploadButton}
            onPress={pickImageFromGallery}
          >
            <Icon name="photo-library" size={24} color={COLORS.accent} />
            <Text style={styles.uploadButtonText}>Gallery</Text>
          </TouchableOpacity>
        </View>

        {/* Analyze Button */}
        {image && !result && (
          <TouchableOpacity
            style={[styles.analyzeButton, loading && styles.analyzeButtonDisabled]}
            onPress={analyzeSkin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.surface} size="small" />
            ) : (
              <>
                <Icon name="search" size={20} color={COLORS.surface} style={styles.analyzeIcon} />
                <Text style={styles.analyzeButtonText}>
                  {loading ? "Analyzing..." : "Analyze Skin"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.accent} />
            <Text style={styles.loadingText}>Analyzing image...</Text>
          </View>
        )}

        {/* Results Section */}
        {result && (
          <View style={styles.resultsSection}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>Analysis Result</Text>
              <View style={[
                styles.resultBadge, 
                result.confidence >= 70 ? styles.highConfidenceBadge : 
                result.confidence >= 45 ? styles.mediumConfidenceBadge : styles.lowConfidenceBadge
              ]}>
                <Icon 
                  name={result.confidence >= 70 ? "verified" : "warning"} 
                  size={14} 
                  color={result.confidence >= 70 ? COLORS.success : COLORS.warning} 
                />
                <Text style={[
                  styles.resultBadgeText,
                  result.confidence >= 70 ? styles.highConfidenceText : 
                  result.confidence >= 45 ? styles.mediumConfidenceText : styles.lowConfidenceText
                ]}>
                  {result.confidence >= 70 ? "High Confidence" : "Medium Confidence"}
                </Text>
              </View>
            </View>

            {/* Disease Card with Medications */}
            <DiseaseCard 
              disease={result.disease}
              confidence={result.confidence}
              description={result.description}
              warning={result.warning}
              medicationInfo={result.medication_info}
            />

            {/* Save to History Button */}
            {!historySaved ? (
              <TouchableOpacity
                style={styles.saveHistoryButton}
                onPress={saveToHistory}
                disabled={savingToHistory}
              >
                {savingToHistory ? (
                  <ActivityIndicator color={COLORS.surface} size="small" />
                ) : (
                  <>
                    <Icon name="save" size={20} color={COLORS.surface} />
                    <Text style={styles.saveHistoryButtonText}>Save to History</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.historySavedIndicator}>
                <Icon name="check-circle" size={20} color={COLORS.success} />
                <Text style={styles.historySavedText}>
                  Saved to history
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={clearImage}
              >
                <Icon name="refresh" size={18} color={COLORS.accent} />
                <Text style={styles.secondaryButtonText}>New Analysis</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={viewHistory}
              >
                <Icon name="history" size={18} color={COLORS.surface} />
                <Text style={styles.primaryButtonText}>View History</Text>
              </TouchableOpacity>
            </View>

            {/* Disclaimer */}
            <View style={styles.disclaimerBox}>
              <Icon name="medical-services" size={18} color={COLORS.secondary} />
              <Text style={styles.disclaimerText}>
                Disclaimer: This is a predictive analysis only. Always consult a healthcare professional.
              </Text>
            </View>
          </View>
        )}

        {/* Instructions */}
        {!image && !result && !loading && (
          <View style={styles.instructionsCard}>
            <Text style={styles.instructionsTitle}>Important Notes:</Text>
            <View style={styles.instructionItem}>
              <Icon name="check-circle" size={16} color={COLORS.success} />
              <Text style={styles.instructionText}>Only trained for specific skin conditions</Text>
            </View>
            <View style={styles.instructionItem}>
              <Icon name="check-circle" size={16} color={COLORS.success} />
              <Text style={styles.instructionText}>Rejects objects, clothes, non-skin images</Text>
            </View>
            <View style={styles.instructionItem}>
              <Icon name="verified" size={16} color={COLORS.success} />
              <Text style={styles.instructionText}>70%+ = High confidence</Text>
            </View>
            <View style={styles.instructionItem}>
              <Icon name="verified" size={16} color={COLORS.success} />
              <Text style={styles.instructionText}>Includes treatment recommendations for each condition</Text>
            </View>
            <View style={styles.instructionItem}>
              <Icon name="save" size={16} color={COLORS.accent} />
              <Text style={styles.instructionText}>Click "Save to History" to store your analysis</Text>
            </View>
            <View style={styles.instructionItem}>
              <Icon name="login" size={16} color={COLORS.accent} />
              <Text style={styles.instructionText}>Login required to save and view history</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  // Header Styles
  header: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 1000,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.primary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.secondary,
    fontWeight: "400",
  },
  historyButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'rgba(163, 107, 79, 0.1)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 120,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  // Image Preview
  imageSection: {
    marginBottom: 24,
  },
  imageContainer: {
    position: "relative",
    alignItems: "center",
  },
  preview: {
    width: "100%",
    height: 300,
    borderRadius: 16,
    backgroundColor: COLORS.background,
  },
  removeImageButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(58, 52, 60, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderContainer: {
    height: 200,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(88, 101, 110, 0.2)',
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
    marginTop: 12,
    marginBottom: 4,
  },
  placeholderSubtext: {
    fontSize: 13,
    color: COLORS.secondary,
    textAlign: 'center',
  },
  // Upload Buttons
  uploadSection: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  uploadButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: 'rgba(88, 101, 110, 0.2)',
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
    marginTop: 8,
  },
  // Analyze Button
  analyzeButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  analyzeButtonDisabled: {
    opacity: 0.7,
  },
  analyzeIcon: {
    marginRight: 10,
  },
  analyzeButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.secondary,
  },
  loadingSubtext: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.secondary,
    fontStyle: 'italic',
  },
  // Results Section
  resultsSection: {
    marginTop: 8,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.primary,
  },
  resultBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  highConfidenceBadge: {
    backgroundColor: 'rgba(56, 142, 60, 0.1)',
  },
  mediumConfidenceBadge: {
    backgroundColor: 'rgba(25, 118, 210, 0.1)',
  },
  lowConfidenceBadge: {
    backgroundColor: 'rgba(211, 47, 47, 0.1)',
  },
  resultBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  highConfidenceText: {
    color: COLORS.success,
  },
  mediumConfidenceText: {
    color: COLORS.info,
  },
  lowConfidenceText: {
    color: COLORS.error,
  },
  // Disease Card
  diseaseCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(88, 101, 110, 0.1)',
  },
  diseaseHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  diseaseTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  diseaseTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.primary,
    marginBottom: 4,
  },
  confidenceBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: "600",
  },
  confidenceBar: {
    height: 10,
    backgroundColor: 'rgba(88, 101, 110, 0.1)',
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 12,
    position: 'relative',
  },
  confidenceFill: {
    height: "100%",
    borderRadius: 5,
  },
  thresholdMarker: {
    position: 'absolute',
    top: -20,
    width: 30,
    alignItems: 'center',
  },
  thresholdText: {
    fontSize: 10,
    color: COLORS.secondary,
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: 'rgba(245, 124, 0, 0.1)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  warningText: {
    fontSize: 13,
    color: COLORS.warning,
    marginLeft: 6,
    flex: 1,
    fontStyle: 'italic',
  },
  descriptionBox: {
    backgroundColor: 'rgba(58, 52, 60, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  descriptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  descriptionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
    marginLeft: 6,
  },
  descriptionText: {
    fontSize: 13,
    color: COLORS.secondary,
    lineHeight: 18,
  },
  // Medications Section Styles
  medicationsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(88, 101, 110, 0.2)',
  },
  medicationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  medicationsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 8,
  },
  medicationCategory: {
    backgroundColor: 'rgba(58, 52, 60, 0.03)',
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: 'rgba(58, 52, 60, 0.05)',
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 10,
    flex: 1,
  },
  categoryContent: {
    padding: 14,
  },
  categoryDescription: {
    fontSize: 13,
    color: COLORS.secondary,
    marginBottom: 10,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  medicationItems: {
    marginTop: 8,
  },
  medicationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingLeft: 4,
  },
  medicationItemText: {
    fontSize: 14,
    color: COLORS.primary,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  generalAdviceSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(163, 107, 79, 0.08)',
    borderRadius: 12,
  },
  generalAdviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  generalAdviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.accent,
    marginLeft: 8,
  },
  adviceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    paddingRight: 8,
  },
  adviceText: {
    fontSize: 13,
    color: COLORS.primary,
    marginLeft: 10,
    flex: 1,
    lineHeight: 18,
  },
  // Save to History Button
  saveHistoryButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  saveHistoryButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  // History Saved Indicator
  historySavedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56, 142, 60, 0.1)',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  historySavedText: {
    fontSize: 16,
    color: COLORS.success,
    marginLeft: 8,
    fontWeight: '500',
  },
  // Action Buttons
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: 'rgba(88, 101, 110, 0.2)',
  },
  secondaryButtonText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  // Disclaimer
  disclaimerBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: 'rgba(58, 52, 60, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(88, 101, 110, 0.1)',
  },
  disclaimerText: {
    fontSize: 12,
    color: COLORS.secondary,
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  // Instructions Card
  instructionsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(88, 101, 110, 0.1)',
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.primary,
    marginBottom: 12,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: COLORS.secondary,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  boldText: {
    fontWeight: "600",
    color: COLORS.primary,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 12,
  },
  modalMessage: {
    fontSize: 15,
    color: COLORS.secondary,
    lineHeight: 22,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorDetailsBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: 'rgba(58, 52, 60, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorDetailsText: {
    fontSize: 13,
    color: COLORS.secondary,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  modalTips: {
    backgroundColor: 'rgba(58, 52, 60, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: COLORS.secondary,
    marginLeft: 8,
    flex: 1,
  },
  confidenceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(25, 118, 210, 0.1)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
  },
  confidenceInfoText: {
    fontSize: 14,
    color: COLORS.info,
    marginLeft: 8,
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalPrimaryButton: {
    flex: 1,
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryButtonText: {
    color: COLORS.surface,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalSecondaryButton: {
    flex: 1,
    backgroundColor: 'rgba(58, 52, 60, 0.1)',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSecondaryButtonText: {
    color: COLORS.secondary,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
});