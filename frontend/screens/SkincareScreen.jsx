import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar,
  Dimensions,
  Modal,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_URL } from "../config/api";
import Icon from 'react-native-vector-icons/MaterialIcons';

// Color Theme - Minimalist
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
};

// Key for storing user email
const USER_EMAIL_KEY = "user_email";
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function SkincareScreen({ navigation }) {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showRetakeModal, setShowRetakeModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [flashOn, setFlashOn] = useState(false);
  const [cameraType, setCameraType] = useState('front'); // 'front' or 'back'
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const distanceIntervalRef = useRef(null);

  useEffect(() => {
    loadUserEmail();
    return () => {
      if (distanceIntervalRef.current) {
        clearInterval(distanceIntervalRef.current);
      }
    };
  }, []);

  const loadUserEmail = async () => {
    try {
      const email = await AsyncStorage.getItem(USER_EMAIL_KEY);
      if (email) {
        setUserEmail(email);
      }
    } catch (error) {
      console.error("Error loading user email:", error);
    }
  };

  // Save analysis to history - SIMPLIFIED
  const saveToHistory = async () => {
    try {
      if (!result || !image || !userEmail) {
        Alert.alert("Error", "Cannot save analysis. Missing data.");
        return;
      }

      setSaving(true);

      const saveData = {
        userEmail,
        imageUrl: image,
        analysisResult: result
      };

      const saveResponse = await axios.post(
        `${API_URL}/api/history/save-analysis`,
        saveData
      );

      if (saveResponse.data.success) {
        if (saveResponse.data.isDuplicate) {
          Alert.alert(
            "Already Saved",
            "This analysis has already been saved to your history.",
            [{ text: "OK" }]
          );
        } else {
          Alert.alert(
            "Saved Successfully",
            "Your analysis has been saved to history.",
            [
              { 
                text: "View History", 
                onPress: () => navigation.navigate('History')
              },
              { text: "OK" }
            ]
          );
        }
      } else {
        Alert.alert("Error", "Failed to save analysis to history.");
      }

    } catch (error) {
      console.error("Save to history error:", error);
      
      if (error.response?.data?.isDuplicate) {
        Alert.alert(
          "Already Saved",
          "This analysis has already been saved to your history.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert(
          "Error", 
          "Failed to save analysis. Please try again."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  // View history
  const viewHistory = () => {
    navigation.navigate('History');
  };

  // Camera Grid Overlay Component
  const CameraGridOverlay = () => {
    return (
      <View style={styles.gridOverlay}>
        {/* Face Oval Guide */}
        <View style={styles.faceOval}>
          <View style={styles.faceOvalInner} />
          <View style={styles.faceOvalOuter} />
        </View>
        
        {/* Center Crosshair */}
        <View style={[styles.gridLine, styles.verticalCenter]} />
        <View style={[styles.gridLine, styles.horizontalCenter]} />
        
        {/* Rule of Thirds Grid */}
        <View style={[styles.gridLine, styles.verticalThird1]} />
        <View style={[styles.gridLine, styles.verticalThird2]} />
        <View style={[styles.gridLine, styles.horizontalThird1]} />
        <View style={[styles.gridLine, styles.horizontalThird2]} />
        
        {/* Eye Position Markers */}
        <View style={[styles.eyeMarker, styles.eyeLeft]} />
        <View style={[styles.eyeMarker, styles.eyeRight]} />
        
        {/* Mouth Position Marker */}
        <View style={styles.mouthMarker} />
        
        {/* Corner Guides */}
        <View style={[styles.cornerGuide, styles.topLeft]} />
        <View style={[styles.cornerGuide, styles.topRight]} />
        <View style={[styles.cornerGuide, styles.bottomLeft]} />
        <View style={[styles.cornerGuide, styles.bottomRight]} />
        
        {/* Distance Indicator */}
        <View style={styles.distanceIndicator}>
          <Icon name="straighten" size={20} color={COLORS.surface} />
          <Text style={styles.distanceText}>30-50 cm from camera</Text>
        </View>
        
        {/* Position Guide */}
        <View style={styles.positionGuide}>
          <Icon name="face" size={24} color={COLORS.surface} />
          <Text style={styles.positionText}>Align face within oval</Text>
        </View>
        
        {/* Eye Level Guide */}
        <View style={styles.eyeLevelGuide}>
          <Text style={styles.eyeLevelText}>Eye level</Text>
          <View style={styles.eyeLevelLine} />
        </View>
      </View>
    );
  };

  // Camera Screen Component
  const CameraScreen = () => {
    const takePicture = async () => {
      if (isTakingPhoto) return;
      
      setIsTakingPhoto(true);
      try {
        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
          exif: false,
        });

        if (!result.canceled) {
          setImage(result.assets[0].uri);
          setShowCamera(false);
        }
      } catch (error) {
        console.error("Camera error:", error);
        Alert.alert("Error", "Could not take photo. Please try again.");
      } finally {
        setIsTakingPhoto(false);
      }
    };

    const flipCamera = () => {
      setCameraType(cameraType === 'front' ? 'back' : 'front');
      Alert.alert("Camera Flipped", `Switched to ${cameraType === 'front' ? 'back' : 'front'} camera`);
    };

    const toggleFlash = () => {
      setFlashOn(!flashOn);
      Alert.alert("Flash", flashOn ? "Flash turned off" : "Flash turned on");
    };

    return (
      <View style={styles.cameraContainer}>
        {/* Camera Preview Background */}
        <View style={styles.cameraPreview}>
          {/* Camera Placeholder with Grid */}
          <View style={styles.cameraPlaceholder}>
            {/* Grid Overlay */}
            <CameraGridOverlay />
            
            {/* Camera Type Indicator */}
            <View style={styles.cameraTypeIndicator}>
              <Icon 
                name={cameraType === 'front' ? 'self-improvement' : 'photo-camera'} 
                size={24} 
                color={COLORS.surface} 
              />
              <Text style={styles.cameraTypeText}>
                {cameraType === 'front' ? 'Front Camera' : 'Back Camera'}
              </Text>
            </View>
            
            {/* Flash Indicator */}
            {flashOn && (
              <View style={styles.flashIndicator}>
                <Icon name="flash-on" size={24} color={COLORS.warning} />
                <Text style={styles.flashIndicatorText}>Flash ON</Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Camera Controls Overlay */}
        <View style={styles.cameraControlsOverlay}>
          {/* Top Controls */}
          <View style={styles.topControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => setShowCamera(false)}
            >
              <Icon name="close" size={28} color={COLORS.surface} />
            </TouchableOpacity>
            
            <View style={styles.centerControls}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={toggleFlash}
              >
                <Icon 
                  name={flashOn ? "flash-on" : "flash-off"} 
                  size={28} 
                  color={COLORS.surface} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.controlButton}
                onPress={flipCamera}
              >
                <Icon name="flip-camera-android" size={28} color={COLORS.surface} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.controlSpacer} />
          </View>
          
          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            {/* Instructions */}
            <View style={styles.instructions}>
              <View style={styles.instructionRow}>
                <View style={styles.instructionItem}>
                  <Icon name="check-circle" size={14} color={COLORS.success} />
                  <Text style={styles.instructionText}>Position face within oval</Text>
                </View>
                <View style={styles.instructionItem}>
                  <Icon name="check-circle" size={14} color={COLORS.success} />
                  <Text style={styles.instructionText}>Align eyes with markers</Text>
                </View>
              </View>
              <View style={styles.instructionRow}>
                <View style={styles.instructionItem}>
                  <Icon name="check-circle" size={14} color={COLORS.success} />
                  <Text style={styles.instructionText}>Ensure good lighting</Text>
                </View>
                <View style={styles.instructionItem}>
                  <Icon name="check-circle" size={14} color={COLORS.success} />
                  <Text style={styles.instructionText}>Look directly at camera</Text>
                </View>
              </View>
            </View>
            
            {/* Capture Button */}
            <View style={styles.captureSection}>
              <TouchableOpacity
                style={[styles.captureButton, isTakingPhoto && styles.captureButtonDisabled]}
                onPress={takePicture}
                disabled={isTakingPhoto}
              >
                <View style={styles.captureButtonInner}>
                  {isTakingPhoto ? (
                    <ActivityIndicator color={COLORS.surface} size="small" />
                  ) : (
                    <Icon name="camera" size={36} color={COLORS.surface} />
                  )}
                </View>
              </TouchableOpacity>
              
              <Text style={styles.captureHint}>
                {isTakingPhoto ? "Processing..." : "Tap to capture"}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Retake Photo Modal
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
            <Text style={styles.modalTitle}>No Face Detected</Text>
          </View>
          
          <Text style={styles.modalMessage}>{errorMessage}</Text>
          
          <View style={styles.modalTips}>
            <Text style={styles.tipsTitle}>Tips for better photos:</Text>
            <View style={styles.tipItem}>
              <Icon name="check" size={16} color={COLORS.success} />
              <Text style={styles.tipText}>Ensure your face is clearly visible</Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name="check" size={16} color={COLORS.success} />
              <Text style={styles.tipText}>Face the camera directly</Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name="check" size={16} color={COLORS.success} />
              <Text style={styles.tipText}>Use good lighting</Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name="check" size={16} color={COLORS.success} />
              <Text style={styles.tipText}>Remove glasses if possible</Text>
            </View>
          </View>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.modalSecondaryButton}
              onPress={() => {
                setShowRetakeModal(false);
                resetAnalysis();
              }}
            >
              <Icon name="close" size={20} color={COLORS.secondary} />
              <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalPrimaryButton}
              onPress={() => {
                setShowRetakeModal(false);
                setShowCamera(true);
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

  // Enhanced image selection
  const pickImage = async (fromCamera = false) => {
    try {
      if (fromCamera) {
        setShowCamera(true);
        return;
      }

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permission Required", "Please allow gallery access.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        exif: false,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
        setResult(null);
        setShowRetakeModal(false);
      }
    } catch (error) {
      console.error("Image selection error:", error);
      Alert.alert("Error", "Could not select image. Please try again.");
    }
  };

  // Enhanced analyze function with face detection
  const analyzeImage = async () => {
    if (!image) {
      Alert.alert("No Image", "Please select or capture a photo first.");
      return;
    }

    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append("file", {
        uri: image,
        name: `face_${Date.now()}.jpg`,
        type: "image/jpeg",
      });

      console.log("Starting skin analysis...");

      const endpoints = [
        `${API_URL}/api/face/analyze/skin`,
        `${API_URL}/api/face/analyze/basic`,
        `${API_URL}/api/face/analyze/test`
      ];
      
      let result = null;
      let lastError = null;
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint}`);
          const res = await axios.post(endpoint, formData, {
            headers: { 
              "Content-Type": "multipart/form-data",
            },
            timeout: 20000,
          });
          
          console.log("Success from:", endpoint);
          result = res.data;
          
          // Check if face was detected
          if (res.data.error === "NO_FACE_DETECTED") {
            setErrorMessage(res.data.message || "No face detected in the image.");
            setShowRetakeModal(true);
            setLoading(false);
            return;
          }
          
          break;
          
        } catch (error) {
          console.error(`Failed for ${endpoint}:`, error.response?.data || error.message);
          lastError = error;
          
          // Check for no face detection error
          if (error.response?.data?.error === "NO_FACE_DETECTED") {
            setErrorMessage(error.response.data.message || "No face detected in the image.");
            setShowRetakeModal(true);
            setLoading(false);
            return;
          }
          
          continue;
        }
      }
      
      if (result) {
        // Double check if face was detected
        if (result.error === "NO_FACE_DETECTED" || !result.face_detected) {
          setErrorMessage(result.message || "No face detected in the image.");
          setShowRetakeModal(true);
        } else {
          setResult(result);
          console.log("Analysis complete with skincare recommendations");
        }
      } else {
        console.error("All endpoints failed:", lastError?.message);
        Alert.alert(
          "Analysis Failed",
          "Could not analyze the image. Please check your internet connection and try again."
        );
      }
      
    } catch (error) {
      console.error("Unexpected error:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Simple Info Card Component - Minimalist
  const InfoCard = ({ title, value, icon }) => (
    <View style={styles.infoCard}>
      <Icon name={icon} size={24} color={COLORS.accent} style={styles.infoCardIcon} />
      <Text style={styles.infoCardTitle}>{title}</Text>
      <Text style={styles.infoCardValue}>{value}</Text>
    </View>
  );

  // Skin Issue Card - Minimalist
  const SkinIssueCard = ({ title, value, icon }) => {
    const percentage = (value / 100) * 100;
    let severityColor = COLORS.success;
    
    if (percentage > 70) severityColor = COLORS.error;
    else if (percentage > 40) severityColor = COLORS.warning;
    
    return (
      <View style={styles.skinIssueCard}>
        <View style={styles.skinIssueHeader}>
          <Icon name={icon} size={20} color={COLORS.primary} />
          <Text style={styles.skinIssueTitle}>{title}</Text>
        </View>
        <View style={styles.skinIssueContent}>
          <Text style={styles.skinIssueValue}>{value}/100</Text>
          <View style={styles.skinIssueProgress}>
            <View style={[
              styles.skinIssueProgressFill,
              { 
                width: `${percentage}%`,
                backgroundColor: severityColor
              }
            ]} />
          </View>
        </View>
      </View>
    );
  };

  // Skincare Recommendation Card - Minimalist
  const SkincareRecommendationCard = ({ recommendation }) => {
    if (!recommendation) return null;
    
    return (
      <View style={styles.recommendationSection}>
        <Text style={styles.recommendationTitle}>Personalized Skincare Plan</Text>
        
        <View style={styles.recommendationSummaryCard}>
          <Icon name="spa" size={24} color={COLORS.accent} />
          <Text style={styles.recommendationSummary}>
            {recommendation.summary}
          </Text>
        </View>
        
        {/* Morning Routine */}
        {recommendation.morning_routine && recommendation.morning_routine.length > 0 && (
          <View style={styles.routineCard}>
            <View style={styles.routineHeader}>
              <Icon name="wb-sunny" size={20} color={COLORS.primary} />
              <Text style={styles.routineTitle}>Morning Routine</Text>
            </View>
            {recommendation.morning_routine.map((step, index) => (
              <View key={index} style={styles.routineStep}>
                <Icon name="circle" size={8} color={COLORS.accent} />
                <Text style={styles.routineText}>{step}</Text>
              </View>
            ))}
          </View>
        )}
        
        {/* Evening Routine */}
        {recommendation.evening_routine && recommendation.evening_routine.length > 0 && (
          <View style={styles.routineCard}>
            <View style={styles.routineHeader}>
              <Icon name="nightlight" size={20} color={COLORS.primary} />
              <Text style={styles.routineTitle}>Evening Routine</Text>
            </View>
            {recommendation.evening_routine.map((step, index) => (
              <View key={index} style={styles.routineStep}>
                <Icon name="circle" size={8} color={COLORS.accent} />
                <Text style={styles.routineText}>{step}</Text>
              </View>
            ))}
          </View>
        )}
        
        {/* Weekly Treatments */}
        {recommendation.weekly_treatments && recommendation.weekly_treatments.length > 0 && (
          <View style={styles.routineCard}>
            <View style={styles.routineHeader}>
              <Icon name="event" size={20} color={COLORS.primary} />
              <Text style={styles.routineTitle}>Weekly Treatments</Text>
            </View>
            {recommendation.weekly_treatments.map((step, index) => (
              <View key={index} style={styles.routineStep}>
                <Icon name="circle" size={8} color={COLORS.accent} />
                <Text style={styles.routineText}>{step}</Text>
              </View>
            ))}
          </View>
        )}
        
        {/* Lifestyle Tips */}
        {recommendation.lifestyle_tips && recommendation.lifestyle_tips.length > 0 && (
          <View style={styles.routineCard}>
            <View style={styles.routineHeader}>
              <Icon name="favorite" size={20} color={COLORS.primary} />
              <Text style={styles.routineTitle}>Lifestyle Tips</Text>
            </View>
            {recommendation.lifestyle_tips.map((tip, index) => (
              <View key={index} style={styles.routineStep}>
                <Icon name="circle" size={8} color={COLORS.accent} />
                <Text style={styles.routineText}>{tip}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  // Reset analysis
  const resetAnalysis = () => {
    setImage(null);
    setResult(null);
    setShowRetakeModal(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Camera Screen (Full Screen) */}
      {showCamera && (
        <CameraScreen />
      )}
      
      {/* Retake Photo Modal */}
      <RetakePhotoModal />
      
      {/* Main App Content (only show when not in camera mode) */}
      {!showCamera && (
        <>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={24} color={COLORS.primary} />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Face Analysis</Text>
              <Text style={styles.headerSubtitle}>
                {userEmail ? `Welcome, ${userEmail.split('@')[0]}` : 'AI-Powered Skincare Analysis'}
              </Text>
            </View>
            {userEmail && (
              <TouchableOpacity
                style={styles.historyButton}
                onPress={viewHistory}
              >
                <Icon name="history" size={20} color={COLORS.accent} />
              </TouchableOpacity>
            )}
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
                    onPress={resetAnalysis}
                  >
                    <Icon name="close" size={20} color={COLORS.surface} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.placeholderContainer}>
                  <Icon name="add-a-photo" size={48} color={COLORS.secondary} />
                  <Text style={styles.placeholderText}>No image selected</Text>
                  <Text style={styles.placeholderSubtext}>
                    Upload or capture a clear photo for skin analysis
                  </Text>
                </View>
              )}
            </View>

            {/* Upload Buttons */}
            <View style={styles.uploadSection}>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => pickImage(false)}
              >
                <Icon name="photo-library" size={24} color={COLORS.accent} />
                <Text style={styles.uploadButtonText}>Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => pickImage(true)}
              >
                <Icon name="photo-camera" size={24} color={COLORS.accent} />
                <Text style={styles.uploadButtonText}>Camera</Text>
              </TouchableOpacity>
            </View>

            {/* Analyze Button */}
            {image && !result && (
              <TouchableOpacity
                style={[styles.analyzeButton, loading && styles.analyzeButtonDisabled]}
                onPress={analyzeImage}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.surface} size="small" />
                ) : (
                  <>
                    <Icon name="search" size={20} color={COLORS.surface} style={styles.analyzeIcon} />
                    <Text style={styles.analyzeButtonText}>Analyze Skin</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Results Section */}
            {result && (
              <View style={styles.resultsSection}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultTitle}>Analysis Results</Text>
                  {result.api_used && (
                    <View style={styles.resultBadge}>
                      <Text style={styles.resultBadgeText}>
                        {result.api_used.includes("Face++") ? "AI Analysis" : result.api_used}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Basic Info Cards */}
                <View style={styles.infoCardsContainer}>
                  <InfoCard
                    title="Age"
                    value={result.age || "Unknown"}
                    icon="person"
                  />
                  <InfoCard
                    title="Gender"
                    value={result.gender || "Unknown"}
                    icon="accessibility"
                  />
                  <InfoCard
                    title="Acne Level"
                    value={`${result.acne || 0}/100`}
                    icon="warning"
                  />
                </View>

                {/* Skin Issues Analysis */}
                <View style={styles.skinIssuesSection}>
                  <Text style={styles.sectionTitle}>Face Analysis</Text>
                  
                  {result.skin_attributes && (
                    <>
                      <SkinIssueCard
                        title="Acne"
                        value={result.skin_attributes.acne || 0}
                        icon="flare"
                      />
                      
                      <SkinIssueCard
                        title="Dark Spots"
                        value={result.skin_attributes.stain || 0}
                        icon="brightness-6"
                      />
                      
                      <SkinIssueCard
                        title="Dark Circles"
                        value={result.skin_attributes.dark_circle || 0}
                        icon="remove-red-eye"
                      />
                      
                      <SkinIssueCard
                        title="Blackheads"
                        value={result.skin_attributes.blackhead || 0}
                        icon="filter-center-focus"
                      />
                    </>
                  )}
                </View>

                {/* Skincare Recommendations */}
                {result.skincare_recommendations && (
                  <SkincareRecommendationCard recommendation={result.skincare_recommendations} />
                )}

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={saveToHistory}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color={COLORS.surface} size="small" />
                    ) : (
                      <>
                        <Icon name="save" size={18} color={COLORS.surface} />
                        <Text style={styles.primaryButtonText}>Save Analysis</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={resetAnalysis}
                  >
                    <Icon name="refresh" size={18} color={COLORS.accent} />
                    <Text style={styles.secondaryButtonText}>New Analysis</Text>
                  </TouchableOpacity>
                </View>

                {/* History Button */}
                <TouchableOpacity
                  style={styles.historyLinkButton}
                  onPress={viewHistory}
                >
                  <Icon name="history" size={18} color={COLORS.accent} />
                  <Text style={styles.historyLinkText}>View Analysis History</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  // Camera Styles
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraPreview: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraPlaceholder: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: '#333',
  },
  // Grid Overlay Styles
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceOval: {
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.9,
    borderRadius: SCREEN_WIDTH * 0.5,
    borderWidth: 2,
    borderColor: 'rgba(163, 107, 79, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  faceOvalInner: {
    width: '90%',
    height: '95%',
    borderWidth: 1,
    borderColor: 'rgba(163, 107, 79, 0.4)',
    borderRadius: SCREEN_WIDTH * 0.45,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  verticalCenter: {
    width: 1,
    height: '100%',
    left: '50%',
    backgroundColor: 'rgba(163, 107, 79, 0.6)',
  },
  horizontalCenter: {
    height: 1,
    width: '100%',
    top: '50%',
    backgroundColor: 'rgba(163, 107, 79, 0.6)',
  },
  verticalThird1: {
    width: 1,
    height: '100%',
    left: '33.33%',
  },
  verticalThird2: {
    width: 1,
    height: '100%',
    left: '66.66%',
  },
  horizontalThird1: {
    height: 1,
    width: '100%',
    top: '33.33%',
  },
  horizontalThird2: {
    height: 1,
    width: '100%',
    top: '66.66%',
  },
  eyeMarker: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(56, 142, 60, 0.8)',
    top: '40%',
  },
  eyeLeft: {
    left: '30%',
  },
  eyeRight: {
    right: '30%',
  },
  mouthMarker: {
    position: 'absolute',
    width: 30,
    height: 4,
    backgroundColor: 'rgba(56, 142, 60, 0.8)',
    borderRadius: 2,
    bottom: '30%',
    left: '50%',
    marginLeft: -15,
  },
  cornerGuide: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: 'rgba(163, 107, 79, 0.8)',
  },
  topLeft: {
    top: 20,
    left: 20,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  topRight: {
    top: 20,
    right: 20,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  bottomLeft: {
    bottom: 20,
    left: 20,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  bottomRight: {
    bottom: 20,
    right: 20,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  distanceIndicator: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  positionGuide: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  positionText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 8,
  },
  eyeLevelGuide: {
    position: 'absolute',
    top: '40%',
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeLevelText: {
    color: COLORS.surface,
    fontSize: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  eyeLevelLine: {
    width: 40,
    height: 1,
    backgroundColor: 'rgba(56, 142, 60, 0.8)',
    marginLeft: 4,
  },
  cameraTypeIndicator: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  cameraTypeText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  flashIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  flashIndicatorText: {
    color: COLORS.warning,
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  // Camera Controls
  cameraControlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 20,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerControls: {
    flexDirection: 'row',
    gap: 20,
  },
  controlSpacer: {
    width: 44,
  },
  bottomControls: {
    alignItems: 'center',
  },
  instructions: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 30,
    width: '100%',
  },
  instructionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  instructionText: {
    color: COLORS.surface,
    fontSize: 11,
    marginLeft: 6,
  },
  captureSection: {
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 8,
  },
  captureButtonDisabled: {
    opacity: 0.7,
  },
  captureButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureHint: {
    color: COLORS.surface,
    fontSize: 12,
    opacity: 0.8,
  },
  // Existing styles (keep all existing styles from your original code)
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
    fontSize: 24,
    fontWeight: "600",
    color: COLORS.primary,
    marginBottom: 2,
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
    backgroundColor: 'rgba(58, 52, 60, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  resultBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.secondary,
  },
  // Info Cards
  infoCardsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 8,
  },
  infoCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: 'rgba(88, 101, 110, 0.1)',
  },
  infoCardIcon: {
    marginBottom: 8,
  },
  infoCardTitle: {
    fontSize: 12,
    color: COLORS.secondary,
    marginBottom: 4,
  },
  infoCardValue: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.primary,
  },
  // Skin Issues Section
  skinIssuesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.primary,
    marginBottom: 16,
  },
  skinIssueCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(88, 101, 110, 0.1)',
  },
  skinIssueHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  skinIssueTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
    marginLeft: 8,
  },
  skinIssueContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  skinIssueValue: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.primary,
    minWidth: 50,
  },
  skinIssueProgress: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(88, 101, 110, 0.1)',
    borderRadius: 3,
    overflow: "hidden",
    marginLeft: 12,
  },
  skinIssueProgressFill: {
    height: "100%",
    borderRadius: 3,
  },
  // Recommendations Section
  recommendationSection: {
    marginBottom: 24,
  },
  recommendationTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.primary,
    marginBottom: 16,
  },
  recommendationSummaryCard: {
    backgroundColor: 'rgba(163, 107, 79, 0.1)',
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  recommendationSummary: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "500",
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  routineCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(88, 101, 110, 0.1)',
  },
  routineHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  routineTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
    marginLeft: 8,
  },
  routineStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  routineText: {
    fontSize: 14,
    color: COLORS.secondary,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
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
  // History Link
  historyLinkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: 'rgba(58, 52, 60, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(88, 101, 110, 0.1)',
  },
  historyLinkText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "500",
    marginLeft: 8,
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
    marginBottom: 20,
    textAlign: 'center',
  },
  modalTips: {
    backgroundColor: 'rgba(58, 52, 60, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
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