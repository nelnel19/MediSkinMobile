import React, { useState, useEffect } from "react";
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
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_URL } from "../config/api";
import Icon from 'react-native-vector-icons/MaterialIcons';

// Color Theme
const COLORS = {
  primary: '#3A343C',
  secondary: '#58656E',
  tertiary: '#9BAAAE',
  accent: '#A36B4F',
  background: '#F5F3F0',
  surface: '#FFFFFF',
  error: '#D32F2F',
  success: '#388E3C',
  warning: '#F57C00',
};

const USER_EMAIL_KEY = "user_email";
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IDEAL_DISTANCE = "30-50"; // cm

// Photo capture positions
const PHOTO_POSITIONS = [
  { id: 'left', name: 'Left Side', angle: '45° Left', icon: 'rotate-left', instruction: 'Turn face slightly to the left' },
  { id: 'center', name: 'Front', angle: '0°', icon: 'camera-front', instruction: 'Look straight at camera' },
  { id: 'right', name: 'Right Side', angle: '45° Right', icon: 'rotate-right', instruction: 'Turn face slightly to the right' }
];

export default function SkincareScreen({ navigation }) {
  const [photos, setPhotos] = useState([]);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showRetakeModal, setShowRetakeModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [cameraType, setCameraType] = useState('front');
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const [cameraQuality, setCameraQuality] = useState(null);
  const [showQualityWarning, setShowQualityWarning] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [tempPhoto, setTempPhoto] = useState(null);

  useEffect(() => {
    loadUserEmail();
    checkCameraPermissions();
    estimateDeviceCameraQuality();
  }, []);

  const checkCameraPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    setCameraPermission(status === 'granted');
  };

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

  const estimateDeviceCameraQuality = () => {
    let estimatedQuality = {
      megapixels: 12,
      label: '12MP',
      resolution: '4032x3024',
      isEstimated: true
    };

    if (Platform.OS === 'ios') {
      estimatedQuality = { 
        megapixels: 12, 
        label: '12MP', 
        resolution: '4032x3024', 
        isEstimated: true 
      };
    } else {
      estimatedQuality = { 
        megapixels: 8, 
        label: '8MP', 
        resolution: '3264x2448', 
        isEstimated: true 
      };
    }

    setCameraQuality(estimatedQuality);
    return estimatedQuality;
  };

  const getQualityColor = (megapixels) => {
    if (megapixels >= 20) return COLORS.success;
    if (megapixels >= 12) return '#4CAF50';
    if (megapixels >= 8) return COLORS.warning;
    return COLORS.error;
  };

  // Save to history - ONLY the front photo (center position)
  const saveToHistory = async () => {
    try {
      if (!result || !photos.length || !userEmail) {
        Alert.alert("Error", "Cannot save analysis. Missing data.");
        return;
      }

      // Find the front/center photo
      const frontPhoto = photos.find(photo => photo.position === 'center');
      
      if (!frontPhoto) {
        Alert.alert("Error", "Front-facing photo not found. Please retake the photos.");
        return;
      }

      setSaving(true);
      console.log("========== STARTING SAVE PROCESS ==========");
      console.log(`Saving only front photo (center position)...`);
      
      // Upload ONLY the front photo to Cloudinary
      const formData = new FormData();
      formData.append('image', {
        uri: frontPhoto.uri,
        type: 'image/jpeg',
        name: `face_center_${Date.now()}.jpg`,
      });

      const uploadResponse = await axios.post(
        `${API_URL}/api/upload/skin-analysis`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 30000
        }
      );

      if (!uploadResponse.data.success) {
        throw new Error(uploadResponse.data.message || "Failed to upload front photo");
      }

      const uploadedImageUrl = uploadResponse.data.imageUrl;
      console.log('✅ Front photo uploaded to Cloudinary successfully!');

      // Prepare analysis result with multi-angle metadata
      const analysisWithMetadata = {
        ...result,
        multi_angle_info: {
          photos_taken: photos.length,
          angles_captured: photos.map(p => p.positionName),
          analysis_based_on: "Front-facing photo",
          note: "Side photos were captured but not analyzed. Only the front photo was used for analysis."
        },
        captured_photos_count: photos.length,
        captured_positions: photos.map(p => p.position)
      };

      // Save analysis with single image URL
      const saveData = {
        userEmail,
        imageUrl: uploadedImageUrl,
        analysisResult: analysisWithMetadata
      };

      const saveResponse = await axios.post(
        `${API_URL}/api/history/save-analysis`,
        saveData,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000
        }
      );

      if (saveResponse.data.success) {
        Alert.alert(
          "✅ Saved Successfully",
          `Your multi-angle analysis has been saved to history!\n\n` +
          `📸 Photos captured: ${photos.length} (Left, Front, Right)\n` +
          `🔍 Analysis based on: Front photo only\n` +
          `💾 Side photos saved for reference only`,
          [
            { 
              text: "View History", 
              onPress: () => navigation.navigate('History') 
            },
            { 
              text: "OK", 
              style: "cancel"
            }
          ]
        );
      } else {
        Alert.alert("Error", saveResponse.data.message || "Failed to save analysis.");
      }

    } catch (error) {
      console.error("Error in save process:", error);
      Alert.alert("Error", "Failed to save analysis. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const viewHistory = () => {
    navigation.navigate('History');
  };

  // Camera Screen Component for multi-photo capture
  const CameraScreen = () => {
    const [facePosition, setFacePosition] = useState('center');

    const takePicture = async () => {
      if (isTakingPhoto) return;
      
      setIsTakingPhoto(true);
      try {
        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.9,
          cameraType: cameraType === 'front' ? 'front' : 'back',
        });

        if (!result.canceled) {
          const newPhoto = {
            id: Date.now(),
            uri: result.assets[0].uri,
            position: PHOTO_POSITIONS[currentPosition].id,
            positionName: PHOTO_POSITIONS[currentPosition].name,
            timestamp: Date.now()
          };
          
          setTempPhoto(newPhoto);
          
          // Show preview and ask for confirmation
          Alert.alert(
            "Review Photo",
            `Is this a good photo for ${PHOTO_POSITIONS[currentPosition].name} view?`,
            [
              { text: "Retake", style: "cancel", onPress: () => setTempPhoto(null) },
              { 
                text: "Accept", 
                onPress: () => {
                  const updatedPhotos = [...photos, newPhoto];
                  setPhotos(updatedPhotos);
                  setTempPhoto(null);
                  
                  if (currentPosition + 1 < PHOTO_POSITIONS.length) {
                    setCurrentPosition(currentPosition + 1);
                  } else {
                    setShowCamera(false);
                    // All photos taken, analyze ONLY the front photo
                    setTimeout(() => analyzeFrontPhoto(updatedPhotos), 500);
                  }
                }
              }
            ]
          );
        }
      } catch (error) {
        Alert.alert("Error", "Could not take photo. Please try again.");
      } finally {
        setIsTakingPhoto(false);
      }
    };

    const flipCamera = () => {
      setCameraType(cameraType === 'front' ? 'back' : 'front');
    };

    const skipToNext = () => {
      if (currentPosition + 1 < PHOTO_POSITIONS.length) {
        setCurrentPosition(currentPosition + 1);
      } else if (photos.length > 0) {
        setShowCamera(false);
        analyzeFrontPhoto(photos);
      }
    };

    const currentPositionInfo = PHOTO_POSITIONS[currentPosition];
    const photosTaken = photos.length;
    const totalPhotos = PHOTO_POSITIONS.length;

    return (
      <View style={styles.cameraContainer}>
        <View style={styles.cameraPreview}>
          <View style={styles.cameraPlaceholder}>
            {cameraQuality && (
              <View style={styles.qualityInfoContainer}>
                <View style={[styles.qualityBadge, { backgroundColor: getQualityColor(cameraQuality.megapixels) }]}>
                  <Icon name="camera-alt" size={16} color={COLORS.surface} />
                  <Text style={styles.qualityText}>{cameraQuality.label}</Text>
                  <Text style={styles.qualityResolutionText}>{cameraQuality.resolution}</Text>
                </View>
              </View>
            )}

            {/* Progress indicator */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${(photosTaken / totalPhotos) * 100}%` }]} />
              </View>
              <Text style={styles.progressText}>
                Photo {photosTaken + 1} of {totalPhotos}
              </Text>
            </View>

            {/* Position instruction */}
            <View style={styles.positionInstructionCard}>
              <Icon name={currentPositionInfo.icon} size={24} color={COLORS.accent} />
              <View style={styles.positionInstructionText}>
                <Text style={styles.positionName}>{currentPositionInfo.name}</Text>
                <Text style={styles.positionAngle}>{currentPositionInfo.angle}</Text>
              </View>
              <Text style={styles.positionInstruction}>{currentPositionInfo.instruction}</Text>
            </View>

            <View style={styles.faceGuideContainer}>
              <View style={styles.faceOval} />
              
              <View style={styles.facePositionIndicators}>
                <View style={[styles.positionDot, facePosition === 'center' && styles.positionDotActive]} />
                <View style={styles.positionLine} />
                <View style={[styles.positionDot, facePosition === 'center' && styles.positionDotActive]} />
              </View>

              <View style={[styles.gridLine, styles.verticalCenter]} />
              <View style={[styles.gridLine, styles.horizontalCenter]} />
            </View>

            <View style={styles.distanceGuidanceContainer}>
              <View style={styles.distanceGuidance}>
                <Icon name="straighten" size={20} color={COLORS.accent} />
                <Text style={styles.distanceText}>
                  Hold phone {IDEAL_DISTANCE}cm from face
                </Text>
              </View>
            </View>

            {/* Thumbnail preview of taken photos */}
            {photos.length > 0 && (
              <View style={styles.thumbnailStrip}>
                {photos.map((photo, index) => (
                  <View key={photo.id} style={styles.thumbnailContainer}>
                    <Image source={{ uri: photo.uri }} style={styles.thumbnail} />
                    <View style={styles.thumbnailBadge}>
                      <Icon name="check-circle" size={12} color={COLORS.success} />
                    </View>
                  </View>
                ))}
                {Array(totalPhotos - photos.length).fill().map((_, index) => (
                  <View key={`empty-${index}`} style={[styles.thumbnail, styles.emptyThumbnail]}>
                    <Icon name="photo-camera" size={16} color={COLORS.secondary} />
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.cameraControlsOverlay}>
          <View style={styles.topControls}>
            <TouchableOpacity style={styles.controlButton} onPress={() => {
              if (photos.length > 0) {
                Alert.alert(
                  "Cancel Capture",
                  "Are you sure? Your captured photos will be lost.",
                  [
                    { text: "Continue Capturing", style: "cancel" },
                    { 
                      text: "Cancel & Reset", 
                      style: "destructive",
                      onPress: () => {
                        setPhotos([]);
                        setCurrentPosition(0);
                        setShowCamera(false);
                      }
                    }
                  ]
                );
              } else {
                setShowCamera(false);
              }
            }}>
              <Icon name="close" size={28} color={COLORS.surface} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.controlButton} onPress={flipCamera}>
              <Icon name="flip-camera-android" size={28} color={COLORS.surface} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.bottomControls}>
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
              <Text style={styles.captureHint}>Tap to capture</Text>
            </View>
            
            {photos.length > 0 && (
              <TouchableOpacity style={styles.skipButton} onPress={skipToNext}>
                <Text style={styles.skipButtonText}>Skip & Continue</Text>
                <Icon name="arrow-forward" size={16} color={COLORS.accent} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Modal
          animationType="fade"
          transparent={true}
          visible={showQualityWarning}
          onRequestClose={() => setShowQualityWarning(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Icon name="warning" size={40} color={COLORS.warning} />
                <Text style={styles.modalTitle}>Camera Quality Note</Text>
              </View>
              
              <Text style={styles.modalMessage}>
                Your front camera quality is estimated at {cameraQuality?.label} ({cameraQuality?.resolution}).
                For best results with multi-angle analysis, ensure good lighting.
              </Text>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalPrimaryButton}
                  onPress={() => setShowQualityWarning(false)}
                >
                  <Text style={styles.modalPrimaryButtonText}>Got it</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  // Analyze ONLY the front-facing photo (center position)
  const analyzeFrontPhoto = async (allPhotos) => {
    // Find the front/center photo
    const frontPhoto = allPhotos.find(photo => photo.position === 'center');
    
    if (!frontPhoto) {
      Alert.alert("Error", "Front-facing photo is missing. Please retake the photos.");
      setShowCamera(true);
      return;
    }

    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append("file", {
        uri: frontPhoto.uri,
        name: `face_front_${Date.now()}.jpg`,
        type: "image/jpeg",
      });

      // Use the existing working endpoint
      const response = await axios.post(
        `${API_URL}/api/face/analyze/skin`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 20000,
        }
      );
      
      if (response.data.error === "NO_FACE_DETECTED") {
        setErrorMessage(response.data.message || "No face detected in the front-facing photo.");
        setShowRetakeModal(true);
      } else {
        // Add multi-angle metadata to the result
        const enhancedResult = {
          ...response.data,
          multi_angle_info: {
            photos_taken: allPhotos.length,
            angles_captured: allPhotos.map(p => p.positionName),
            analysis_based_on: "Front-facing photo",
            note: "Side photos are for reference only. Analysis based on front view."
          }
        };
        setResult(enhancedResult);
        console.log("Analysis complete based on front-facing photo:", enhancedResult);
      }
      
    } catch (error) {
      console.error("Analysis error:", error);
      
      if (error.response?.data?.error === "NO_FACE_DETECTED") {
        setErrorMessage(error.response.data.message || "No face detected in the front-facing photo.");
        setShowRetakeModal(true);
      } else {
        Alert.alert("Error", "Failed to analyze photo. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const startNewSession = () => {
    setPhotos([]);
    setCurrentPosition(0);
    setResult(null);
    setShowRetakeModal(false);
    setErrorMessage("");
  };

  const pickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Required", "Please allow gallery access.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (!result.canceled) {
        // For gallery, use single photo mode
        const singlePhoto = {
          id: Date.now(),
          uri: result.assets[0].uri,
          position: 'center',
          positionName: 'Front (Gallery)',
          timestamp: Date.now()
        };
        setPhotos([singlePhoto]);
        analyzeSinglePhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Could not select image. Please try again.");
    }
  };

  const analyzeSinglePhoto = async (imageUri) => {
    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append("file", {
        uri: imageUri,
        name: `face_${Date.now()}.jpg`,
        type: "image/jpeg",
      });

      const response = await axios.post(
        `${API_URL}/api/face/analyze/skin`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 20000,
        }
      );
      
      if (response.data.error === "NO_FACE_DETECTED") {
        setErrorMessage(response.data.message || "No face detected in the image.");
        setShowRetakeModal(true);
      } else {
        setResult(response.data);
      }
      
    } catch (error) {
      Alert.alert("Error", "Failed to analyze image. Please try again.");
    } finally {
      setLoading(false);
    }
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
            <Text style={styles.modalTitle}>Photo Issue Detected</Text>
          </View>
          
          <Text style={styles.modalMessage}>{errorMessage}</Text>
          
          <View style={styles.modalTips}>
            <Text style={styles.tipsTitle}>Tips for better photos:</Text>
            <View style={styles.tipItem}>
              <Icon name="check" size={16} color={COLORS.success} />
              <Text style={styles.tipText}>Hold phone {IDEAL_DISTANCE}cm from face</Text>
            </View>
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
          </View>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.modalSecondaryButton}
              onPress={startNewSession}
            >
              <Text style={styles.modalSecondaryButtonText}>Start Over</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalPrimaryButton}
              onPress={() => {
                setShowRetakeModal(false);
                setShowCamera(true);
              }}
            >
              <Text style={styles.modalPrimaryButtonText}>Retake Photos</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const InfoCard = ({ title, value, icon }) => (
    <View style={styles.infoCard}>
      <Icon name={icon} size={24} color={COLORS.accent} />
      <Text style={styles.infoCardTitle}>{title}</Text>
      <Text style={styles.infoCardValue}>{value}</Text>
    </View>
  );

  // Skin Grade Card Component
  const SkinGradeCard = ({ grade }) => {
    if (!grade) return null;
    
    return (
      <View style={styles.gradeCard}>
        <View style={styles.gradeHeader}>
          <Text style={styles.gradeTitle}>Skin Health Grade</Text>
          <View style={[styles.gradeBadge, { backgroundColor: grade.color + '20' }]}>
            <Text style={[styles.gradeBadgeText, { color: grade.color }]}>{grade.grade}</Text>
          </View>
        </View>
        
        <View style={styles.gradeContent}>
          <View style={styles.gradeScoreContainer}>
            <Text style={styles.gradeScore}>{grade.overall_score}</Text>
            <Text style={styles.gradeScoreLabel}>Overall Score</Text>
          </View>
          
          <View style={styles.gradeDescription}>
            <Text style={styles.gradeDescriptionText}>{grade.description}</Text>
            <Text style={styles.gradeRecommendation}>{grade.recommendation}</Text>
          </View>
        </View>
        
        <View style={styles.gradeComponents}>
          <View style={styles.gradeComponent}>
            <Text style={styles.gradeComponentLabel}>Acne</Text>
            <View style={styles.gradeComponentBar}>
              <View style={[styles.gradeComponentFill, { 
                width: `${grade.components.acne.score}%`,
                backgroundColor: grade.components.acne.score < 30 ? COLORS.success :
                               grade.components.acne.score < 50 ? '#4CAF50' :
                               grade.components.acne.score < 70 ? COLORS.warning : COLORS.error
              }]} />
            </View>
            <Text style={styles.gradeComponentScore}>{grade.components.acne.score}</Text>
          </View>
          
          <View style={styles.gradeComponent}>
            <Text style={styles.gradeComponentLabel}>Dark Spots</Text>
            <View style={styles.gradeComponentBar}>
              <View style={[styles.gradeComponentFill, { 
                width: `${grade.components.stain.score}%`,
                backgroundColor: grade.components.stain.score < 30 ? COLORS.success :
                               grade.components.stain.score < 50 ? '#4CAF50' :
                               grade.components.stain.score < 70 ? COLORS.warning : COLORS.error
              }]} />
            </View>
            <Text style={styles.gradeComponentScore}>{grade.components.stain.score}</Text>
          </View>
          
          <View style={styles.gradeComponent}>
            <Text style={styles.gradeComponentLabel}>Dark Circles</Text>
            <View style={styles.gradeComponentBar}>
              <View style={[styles.gradeComponentFill, { 
                width: `${grade.components.dark_circle.score}%`,
                backgroundColor: grade.components.dark_circle.score < 30 ? COLORS.success :
                               grade.components.dark_circle.score < 50 ? '#4CAF50' :
                               grade.components.dark_circle.score < 70 ? COLORS.warning : COLORS.error
              }]} />
            </View>
            <Text style={styles.gradeComponentScore}>{grade.components.dark_circle.score}</Text>
          </View>
        </View>
        
        <View style={styles.gradeStrengthsWeaknesses}>
          <View style={styles.gradeStrengths}>
            <Text style={styles.gradeStrengthsTitle}>✓ Strengths</Text>
            {grade.strengths.map((strength, index) => (
              <View key={index} style={styles.gradeStrengthItem}>
                <Icon name="check-circle" size={14} color={COLORS.success} />
                <Text style={styles.gradeStrengthText}>{strength}</Text>
              </View>
            ))}
          </View>
          
          <View style={styles.gradeWeaknesses}>
            <Text style={styles.gradeWeaknessesTitle}>⚠ Areas to Improve</Text>
            {grade.weaknesses.map((weakness, index) => (
              <View key={index} style={styles.gradeWeaknessItem}>
                <Icon name="warning" size={14} color={COLORS.warning} />
                <Text style={styles.gradeWeaknessText}>{weakness}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  // Skin Tone Card
  const SkinToneCard = ({ skinTone }) => {
    if (!skinTone) return null;
    
    const getSkinToneDescription = (value) => {
      switch(value) {
        case 0: return "Very fair skin that burns easily";
        case 1: return "Fair to medium skin that tans gradually";
        case 2: return "Medium to olive skin that tans easily";
        case 3: return "Tan to brown skin, rarely burns";
        case 4: return "Brown to dark brown skin, very rarely burns";
        default: return "Medium skin tone";
      }
    };
    
    return (
      <View style={styles.skinToneSection}>
        <Text style={styles.sectionTitle}>Skin Tone Analysis</Text>
        <View style={styles.skinToneCard}>
          <View style={[styles.skinToneSwatch, { backgroundColor: skinTone.hex || '#C8A880' }]} />
          <View style={styles.skinToneInfo}>
            <View style={styles.skinToneHeader}>
              <Text style={styles.skinToneCategory}>{skinTone.name || "Medium"}</Text>
              <View style={styles.skinToneBadge}>
                <Text style={styles.skinToneBadgeText}>Type {skinTone.raw_value}/4</Text>
              </View>
            </View>
            <Text style={styles.skinToneDescription}>
              {getSkinToneDescription(skinTone.raw_value)}
            </Text>
            <Text style={styles.skinToneNote}>
              This indicates your skin's natural melanin level and sun sensitivity
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Skin Issue Card
  const SkinIssueCard = ({ title, value, icon, description }) => {
    const percentage = Math.min(value, 100);
    
    const getInterpretation = () => {
      if (percentage < 30) return "Minimal concern";
      if (percentage < 50) return "Mild concern";
      if (percentage < 70) return "Moderate concern";
      return "Significant concern";
    };
    
    const getColor = () => {
      if (percentage < 30) return COLORS.success;
      if (percentage < 50) return '#4CAF50';
      if (percentage < 70) return COLORS.warning;
      return COLORS.error;
    };
    
    return (
      <View style={styles.skinIssueCard}>
        <View style={styles.skinIssueHeader}>
          <Icon name={icon} size={20} color={COLORS.primary} />
          <Text style={styles.skinIssueTitle}>{title}</Text>
          <View style={[styles.interpretationBadge, { backgroundColor: getColor() + '20' }]}>
            <Text style={[styles.interpretationText, { color: getColor() }]}>
              {getInterpretation()}
            </Text>
          </View>
        </View>
        
        <View style={styles.skinIssueContent}>
          <Text style={styles.skinIssueValue}>{value}/100</Text>
          <View style={styles.skinIssueProgress}>
            <View style={[
              styles.skinIssueProgressFill,
              { width: `${percentage}%`, backgroundColor: getColor() }
            ]} />
          </View>
        </View>
        
        {description && (
          <Text style={styles.skinIssueDescription}>{description}</Text>
        )}
      </View>
    );
  };

  // Recommendation Card
  const SkincareRecommendationCard = ({ recommendation }) => {
    if (!recommendation) return null;
    
    return (
      <View style={styles.recommendationSection}>
        <Text style={styles.recommendationTitle}>Personalized Suggestions</Text>
        
        <View style={styles.recommendationSummaryCard}>
          <Icon name="info" size={20} color={COLORS.accent} />
          <Text style={styles.recommendationSummary}>{recommendation.summary}</Text>
        </View>
        
        {recommendation.skin_type && (
          <View style={styles.skinTypeBadge}>
            <Text style={styles.skinTypeText}>Skin Type: {recommendation.skin_type}</Text>
          </View>
        )}
        
        {recommendation.morning_routine && recommendation.morning_routine.length > 0 && (
          <View style={styles.routineCard}>
            <View style={styles.routineHeader}>
              <Icon name="wb-sunny" size={18} color={COLORS.primary} />
              <Text style={styles.routineTitle}>Morning Routine</Text>
            </View>
            {recommendation.morning_routine.map((step, index) => (
              <View key={index} style={styles.routineStep}>
                <Text style={styles.routineNumber}>{index + 1}</Text>
                <Text style={styles.routineText}>{step}</Text>
              </View>
            ))}
          </View>
        )}
        
        {recommendation.evening_routine && recommendation.evening_routine.length > 0 && (
          <View style={styles.routineCard}>
            <View style={styles.routineHeader}>
              <Icon name="nightlight" size={18} color={COLORS.primary} />
              <Text style={styles.routineTitle}>Evening Routine</Text>
            </View>
            {recommendation.evening_routine.map((step, index) => (
              <View key={index} style={styles.routineStep}>
                <Text style={styles.routineNumber}>{index + 1}</Text>
                <Text style={styles.routineText}>{step}</Text>
              </View>
            ))}
          </View>
        )}
        
        {recommendation.weekly_treatments && recommendation.weekly_treatments.length > 0 && (
          <View style={styles.routineCard}>
            <View style={styles.routineHeader}>
              <Icon name="date-range" size={18} color={COLORS.primary} />
              <Text style={styles.routineTitle}>Weekly (Optional)</Text>
            </View>
            {recommendation.weekly_treatments.map((treatment, index) => (
              <View key={index} style={styles.routineStep}>
                <Icon name="fiber-manual-record" size={8} color={COLORS.accent} />
                <Text style={styles.routineText}>{treatment}</Text>
              </View>
            ))}
          </View>
        )}
        
        {recommendation.key_recommendations && recommendation.key_recommendations.length > 0 && (
          <View style={styles.routineCard}>
            <View style={styles.routineHeader}>
              <Icon name="star" size={18} color={COLORS.warning} />
              <Text style={styles.routineTitle}>Top Tips</Text>
            </View>
            {recommendation.key_recommendations.map((tip, index) => (
              <View key={index} style={styles.routineStep}>
                <Icon name="check-circle" size={14} color={COLORS.success} />
                <Text style={styles.routineText}>{tip}</Text>
              </View>
            ))}
          </View>
        )}
        
        {recommendation.lifestyle_tips && recommendation.lifestyle_tips.length > 0 && (
          <View style={styles.routineCard}>
            <View style={styles.routineHeader}>
              <Icon name="favorite" size={18} color={COLORS.primary} />
              <Text style={styles.routineTitle}>Lifestyle</Text>
            </View>
            {recommendation.lifestyle_tips.map((tip, index) => (
              <View key={index} style={styles.routineStep}>
                <Icon name="circle" size={8} color={COLORS.accent} />
                <Text style={styles.routineText}>{tip}</Text>
              </View>
            ))}
          </View>
        )}
        
        {recommendation.confidence_note && (
          <Text style={styles.confidenceNote}>{recommendation.confidence_note}</Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {showCamera && <CameraScreen />}
      
      <RetakePhotoModal />
      
      {!showCamera && (
        <>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Icon name="arrow-back" size={24} color={COLORS.primary} />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Multi-Angle Capture</Text>
              <Text style={styles.headerSubtitle}>
                {userEmail ? `Welcome, ${userEmail.split('@')[0]}` : '3 Photos for Complete Records'}
              </Text>
            </View>
            {userEmail && (
              <TouchableOpacity style={styles.historyButton} onPress={viewHistory}>
                <Icon name="history" size={20} color={COLORS.accent} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.imageSection}>
              {photos.length > 0 ? (
                <View style={styles.photosContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
                    {photos.map((photo, index) => (
                      <View key={photo.id} style={styles.photoCard}>
                        <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
                        <View style={[styles.photoLabel, photo.position === 'center' && styles.photoLabelActive]}>
                          <Text style={styles.photoLabelText}>
                            {photo.positionName}
                            {photo.position === 'center' && ' ✓'}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                  <TouchableOpacity style={styles.removeAllButton} onPress={startNewSession}>
                    <Icon name="delete" size={20} color={COLORS.error} />
                    <Text style={styles.removeAllText}>Clear All</Text>
                  </TouchableOpacity>
                  <Text style={styles.analysisNote}>
                    * Analysis will be based on the FRONT photo only
                  </Text>
                </View>
              ) : (
                <View style={styles.placeholderContainer}>
                  <Icon name="camera-alt" size={48} color={COLORS.secondary} />
                  <Text style={styles.placeholderText}>Capture 3 Photos</Text>
                  <Text style={styles.placeholderSubtext}>
                    Take photos from 3 different angles for complete records:{'\n'}
                    Left Side • Front • Right Side{'\n'}
                    Hold camera {IDEAL_DISTANCE}cm from face{'\n'}
                    📸 Analysis will be based on FRONT photo only
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.uploadSection}>
              <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                <Icon name="photo-library" size={24} color={COLORS.accent} />
                <Text style={styles.uploadButtonText}>Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.uploadButton, photos.length > 0 && styles.uploadButtonActive]} 
                onPress={() => setShowCamera(true)}
              >
                <Icon name="photo-camera" size={24} color={photos.length > 0 ? COLORS.success : COLORS.accent} />
                <Text style={styles.uploadButtonText}>
                  {photos.length === 0 ? "Start" : photos.length === 3 ? "Retake" : `Take Photo ${photos.length + 1}/3`}
                </Text>
              </TouchableOpacity>
            </View>

            {photos.length === 3 && !result && (
              <TouchableOpacity
                style={[styles.analyzeButton, loading && styles.analyzeButtonDisabled]}
                onPress={() => analyzeFrontPhoto(photos)}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.surface} size="small" />
                ) : (
                  <>
                    <Icon name="analytics" size={20} color={COLORS.surface} />
                    <Text style={styles.analyzeButtonText}>Analyze Front Photo</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {photos.length > 0 && photos.length < 3 && !result && (
              <View style={styles.incompleteWarning}>
                <Icon name="info" size={20} color={COLORS.warning} />
                <Text style={styles.incompleteWarningText}>
                  {3 - photos.length} more photo(s) needed
                </Text>
              </View>
            )}

            {result && (
              <View style={styles.resultsSection}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultTitle}>Analysis Results</Text>
                  {result.multi_angle_info && (
                    <View style={styles.resultBadge}>
                      <Text style={styles.resultBadgeText}>
                        Based on Front Photo
                      </Text>
                    </View>
                  )}
                </View>

                {result.multi_angle_info && (
                  <View style={styles.infoNote}>
                    <Icon name="info" size={16} color={COLORS.accent} />
                    <Text style={styles.infoNoteText}>
                      Analysis based on front-facing photo. Side photos saved for reference.
                    </Text>
                  </View>
                )}

                <View style={styles.infoCardsContainer}>
                  <InfoCard title="Age" value={result.age || "Unknown"} icon="person" />
                  <InfoCard title="Gender" value={result.gender || "Unknown"} icon="accessibility" />
                  <InfoCard title="Acne Level" value={`${result.acne || 0}/100`} icon="warning" />
                </View>

                {result.skin_grade && (
                  <SkinGradeCard grade={result.skin_grade} />
                )}

                {result.skin_attributes?.skin_tone && (
                  <SkinToneCard skinTone={result.skin_attributes.skin_tone} />
                )}

                <View style={styles.skinIssuesSection}>
                  <Text style={styles.sectionTitle}>Face Analysis</Text>
                  
                  {result.skin_attributes && (
                    <>
                      <SkinIssueCard 
                        title="Acne" 
                        value={result.skin_attributes.acne || 0} 
                        icon="flare" 
                        description="Indicates active breakouts and blemishes"
                      />
                      <SkinIssueCard 
                        title="Dark Spots" 
                        value={result.skin_attributes.stain || 0} 
                        icon="brightness-6" 
                        description="Areas of hyperpigmentation and uneven tone"
                      />
                      <SkinIssueCard 
                        title="Dark Circles" 
                        value={result.skin_attributes.dark_circle || 0} 
                        icon="remove-red-eye" 
                        description="Under-eye discoloration and shadows"
                      />
                    </>
                  )}
                </View>

                {result.skincare_recommendations && (
                  <SkincareRecommendationCard recommendation={result.skincare_recommendations} />
                )}

                <View style={styles.actionButtons}>
                  <TouchableOpacity style={styles.primaryButton} onPress={saveToHistory} disabled={saving}>
                    {saving ? (
                      <ActivityIndicator color={COLORS.surface} size="small" />
                    ) : (
                      <>
                        <Icon name="save" size={18} color={COLORS.surface} />
                        <Text style={styles.primaryButtonText}>Save Analysis</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.secondaryButton} onPress={startNewSession}>
                    <Icon name="refresh" size={18} color={COLORS.accent} />
                    <Text style={styles.secondaryButtonText}>New Analysis</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.historyLinkButton} onPress={viewHistory}>
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
  qualityInfoContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 8,
  },
  qualityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  qualityText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
    marginRight: 8,
  },
  qualityResolutionText: {
    color: COLORS.surface,
    fontSize: 11,
    opacity: 0.9,
  },
  progressContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 8,
    minWidth: 120,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 2,
  },
  progressText: {
    color: COLORS.surface,
    fontSize: 11,
    textAlign: 'center',
  },
  positionInstructionCard: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  positionInstructionText: {
    flex: 1,
    marginLeft: 12,
  },
  positionName: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  positionAngle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  positionInstruction: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 8,
  },
  faceGuideContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceOval: {
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.9,
    borderRadius: SCREEN_WIDTH * 0.5,
    borderWidth: 2,
    borderColor: 'rgba(163, 107, 79, 0.8)',
    position: 'absolute',
  },
  facePositionIndicators: {
    position: 'absolute',
    top: '30%',
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
  },
  positionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  positionDotActive: {
    backgroundColor: COLORS.accent,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  positionLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 4,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  verticalCenter: {
    width: 1,
    height: '100%',
    left: '50%',
  },
  horizontalCenter: {
    height: 1,
    width: '100%',
    top: '50%',
  },
  distanceGuidanceContainer: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  distanceGuidance: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  distanceText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  thumbnailStrip: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  thumbnailContainer: {
    position: 'relative',
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  emptyThumbnail: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
  },
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
  bottomControls: {
    alignItems: 'center',
    marginBottom: 40,
  },
  captureSection: {
    alignItems: 'center',
    marginBottom: 12,
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
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  skipButtonText: {
    color: COLORS.surface,
    fontSize: 14,
    marginRight: 6,
  },
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  photosContainer: {
    alignItems: 'center',
  },
  photosScroll: {
    flexGrow: 0,
    marginBottom: 12,
  },
  photoCard: {
    marginRight: 12,
    alignItems: 'center',
  },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
  },
  photoLabel: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  photoLabelActive: {
    backgroundColor: COLORS.accent,
  },
  photoLabelText: {
    color: COLORS.surface,
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  removeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  removeAllText: {
    color: COLORS.error,
    fontSize: 12,
    marginLeft: 4,
  },
  analysisNote: {
    fontSize: 11,
    color: COLORS.secondary,
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
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
    lineHeight: 18,
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
  uploadButtonActive: {
    borderColor: COLORS.success,
    backgroundColor: 'rgba(56, 142, 60, 0.1)',
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
    gap: 10,
  },
  analyzeButtonDisabled: {
    opacity: 0.7,
  },
  analyzeButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: "600",
  },
  incompleteWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 124, 0, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  incompleteWarningText: {
    color: COLORS.warning,
    fontSize: 14,
    fontWeight: '500',
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
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(163, 107, 79, 0.1)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  infoNoteText: {
    fontSize: 12,
    color: COLORS.accent,
    flex: 1,
  },
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
  infoCardTitle: {
    fontSize: 12,
    color: COLORS.secondary,
    marginTop: 8,
    marginBottom: 4,
  },
  infoCardValue: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.primary,
  },
  gradeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(88, 101, 110, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  gradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  gradeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
  },
  gradeBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  gradeBadgeText: {
    fontSize: 24,
    fontWeight: '700',
  },
  gradeContent: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  gradeScoreContainer: {
    alignItems: 'center',
    marginRight: 20,
  },
  gradeScore: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.primary,
  },
  gradeScoreLabel: {
    fontSize: 12,
    color: COLORS.secondary,
    marginTop: 4,
  },
  gradeDescription: {
    flex: 1,
  },
  gradeDescriptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 8,
  },
  gradeRecommendation: {
    fontSize: 13,
    color: COLORS.secondary,
    lineHeight: 18,
  },
  gradeComponents: {
    marginBottom: 20,
  },
  gradeComponent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  gradeComponentLabel: {
    width: 80,
    fontSize: 13,
    color: COLORS.secondary,
  },
  gradeComponentBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(88, 101, 110, 0.1)',
    borderRadius: 3,
    marginHorizontal: 10,
  },
  gradeComponentFill: {
    height: '100%',
    borderRadius: 3,
  },
  gradeComponentScore: {
    width: 40,
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.primary,
    textAlign: 'right',
  },
  gradeStrengthsWeaknesses: {
    flexDirection: 'row',
    gap: 12,
  },
  gradeStrengths: {
    flex: 1,
  },
  gradeStrengthsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.success,
    marginBottom: 8,
  },
  gradeStrengthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  gradeStrengthText: {
    fontSize: 12,
    color: COLORS.secondary,
    marginLeft: 6,
    flex: 1,
  },
  gradeWeaknesses: {
    flex: 1,
  },
  gradeWeaknessesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.warning,
    marginBottom: 8,
  },
  gradeWeaknessItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  gradeWeaknessText: {
    fontSize: 12,
    color: COLORS.secondary,
    marginLeft: 6,
    flex: 1,
  },
  skinToneSection: {
    marginBottom: 24,
  },
  skinToneCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(88, 101, 110, 0.1)',
  },
  skinToneSwatch: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  skinToneInfo: {
    flex: 1,
  },
  skinToneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  skinToneCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  skinToneBadge: {
    backgroundColor: 'rgba(163, 107, 79, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  skinToneBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.accent,
  },
  skinToneDescription: {
    fontSize: 13,
    color: COLORS.secondary,
    lineHeight: 18,
  },
  skinToneNote: {
    fontSize: 11,
    color: COLORS.secondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
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
    flex: 1,
  },
  interpretationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 'auto',
  },
  interpretationText: {
    fontSize: 10,
    fontWeight: '500',
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
  skinIssueDescription: {
    fontSize: 11,
    color: COLORS.secondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
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
  skinTypeBadge: {
    backgroundColor: 'rgba(163, 107, 79, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  skinTypeText: {
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: '500',
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
  routineNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(163, 107, 79, 0.1)',
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.accent,
    marginRight: 10,
  },
  routineText: {
    fontSize: 14,
    color: COLORS.secondary,
    flex: 1,
    lineHeight: 20,
  },
  confidenceNote: {
    fontSize: 11,
    color: COLORS.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
  },
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
    gap: 8,
  },
  primaryButtonText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: "600",
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
    gap: 8,
  },
  secondaryButtonText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: "600",
  },
  historyLinkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: 'rgba(58, 52, 60, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(88, 101, 110, 0.1)',
    gap: 8,
  },
  historyLinkText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "500",
  },
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
    alignItems: 'center',
  },
  modalPrimaryButtonText: {
    color: COLORS.surface,
    fontSize: 15,
    fontWeight: '600',
  },
  modalSecondaryButton: {
    flex: 1,
    backgroundColor: 'rgba(58, 52, 60, 0.1)',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSecondaryButtonText: {
    color: COLORS.secondary,
    fontSize: 15,
    fontWeight: '600',
  },
});