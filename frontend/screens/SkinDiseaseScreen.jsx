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
  Dimensions,
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
const DISEASE_API_URL = "https://mediskin-backend-python.onrender.com";

const { width } = Dimensions.get('window');
const IMAGE_SIZE = (width - 60) / 3;

export default function SkinDiseaseScreen({ navigation }) {
  const [images, setImages] = useState([]);
  const [imagesBase64, setImagesBase64] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savingToHistory, setSavingToHistory] = useState(false);
  const [showRetakeModal, setShowRetakeModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorDetails, setErrorDetails] = useState("");
  const [historySaved, setHistorySaved] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // 0: capture, 1: review, 2: analyzing
  const [expandedImage, setExpandedImage] = useState(null); // For fullscreen view

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
  const DiseaseCard = ({ disease, confidence, description, warning, medicationInfo, consistencyScore, imagesAgreeing, imagesAnalyzed }) => {
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

        {/* Consistency Information */}
        {consistencyScore && (
          <View style={styles.consistencyBox}>
            <Icon name="assessment" size={16} color={COLORS.info} />
            <Text style={styles.consistencyText}>
              {imagesAgreeing} of {imagesAnalyzed} images show this condition ({consistencyScore}% consistent)
            </Text>
          </View>
        )}
        
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

  // Individual Image Result Card
  const IndividualImageResult = ({ result, imageIndex, imageUri, onImagePress }) => {
    let confidenceColor = result.confidence >= 70 ? COLORS.success : 
                         result.confidence >= 45 ? COLORS.info : COLORS.error;
    
    return (
      <TouchableOpacity 
        style={styles.individualResultCard}
        onPress={() => onImagePress(imageUri)}
        activeOpacity={0.7}
      >
        <View style={styles.individualResultHeader}>
          <Text style={styles.individualResultTitle}>Image {imageIndex}</Text>
          <TouchableOpacity 
            style={styles.expandImageIcon}
            onPress={() => onImagePress(imageUri)}
          >
            <Icon name="fullscreen" size={16} color={COLORS.accent} />
          </TouchableOpacity>
        </View>
        <View style={styles.individualResultContent}>
          <Image source={{ uri: imageUri }} style={styles.individualResultImage} />
          <View style={styles.individualResultDetails}>
            <Text style={styles.individualResultDisease}>
              {result.disease.replace(/_/g, ' ')}
            </Text>
            <View style={[styles.individualConfidenceBadge, { backgroundColor: `${confidenceColor}20` }]}>
              <Text style={[styles.individualConfidenceText, { color: confidenceColor }]}>
                {result.confidence}% confidence
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Fullscreen Image Modal
  const FullscreenImageModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={expandedImage !== null}
      onRequestClose={() => setExpandedImage(null)}
    >
      <View style={styles.fullscreenOverlay}>
        <TouchableOpacity 
          style={styles.fullscreenCloseButton}
          onPress={() => setExpandedImage(null)}
        >
          <Icon name="close" size={28} color={COLORS.surface} />
        </TouchableOpacity>
        {expandedImage && (
          <Image source={{ uri: expandedImage }} style={styles.fullscreenImage} resizeMode="contain" />
        )}
      </View>
    </Modal>
  );

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

  const captureImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled) {
        const newImages = [...images, result.assets[0].uri];
        const newBase64 = [...imagesBase64, result.assets[0].base64 ? `data:image/jpeg;base64,${result.assets[0].base64}` : null];
        
        setImages(newImages);
        setImagesBase64(newBase64);
        
        if (newImages.length === 3) {
          setCurrentStep(1); // Move to review step
        }
      }
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert("Error", "Could not take photo. Please try again.");
    }
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
        base64: true,
      });

      if (!result.canceled) {
        const newImages = [...images, result.assets[0].uri];
        const newBase64 = [...imagesBase64, result.assets[0].base64 ? `data:image/jpeg;base64,${result.assets[0].base64}` : null];
        
        setImages(newImages);
        setImagesBase64(newBase64);
        
        if (newImages.length === 3) {
          setCurrentStep(1); // Move to review step
        }
      }
    } catch (error) {
      console.error("Image selection error:", error);
      Alert.alert("Error", "Could not select image. Please try again.");
    }
  };

  const removeImage = (index) => {
    const newImages = [...images];
    const newBase64 = [...imagesBase64];
    newImages.splice(index, 1);
    newBase64.splice(index, 1);
    setImages(newImages);
    setImagesBase64(newBase64);
    setCurrentStep(0); // Go back to capture step if we remove an image
  };

  const analyzeSkin = async () => {
    if (images.length === 0) {
      Alert.alert("No Images", "Please capture at least one photo first");
      return;
    }

    setLoading(true);
    setCurrentStep(2);
    setResult(null);
    setHistorySaved(false);

    const formData = new FormData();
    
    images.forEach((image, index) => {
      formData.append("files", {
        uri: image,
        name: `skin_analysis_${index + 1}.jpg`,
        type: "image/jpeg",
      });
    });

    try {
      const response = await fetch(`${DISEASE_API_URL}/predict-skin-multi`, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const responseData = await response.json();

      if (!response.ok) {
        setErrorMessage(responseData.detail || "Analysis failed. Please try again.");
        setShowRetakeModal(true);
        setCurrentStep(1);
        return;
      }

      // Successful response
      if (responseData.aggregated_result) {
        setResult(responseData);
        
        if (responseData.warning) {
          Alert.alert(
            "Analysis Results",
            responseData.warning,
            [{ text: "OK" }]
          );
        }
      } else {
        setErrorMessage("Invalid response from server. Please try again.");
        setShowRetakeModal(true);
        setCurrentStep(1);
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
      setCurrentStep(1);
    } finally {
      setLoading(false);
    }
  };

  const saveToHistory = async () => {
    if (!result || !imagesBase64[0]) {
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
      formData.append("user_id", userId);
      formData.append("image_data", imagesBase64[0]); // Save first image as representative
      formData.append("prediction_result", JSON.stringify(result.aggregated_result));

      const response = await fetch(`${DISEASE_API_URL}/save-analysis-to-history`, {
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

  const resetAnalysis = () => {
    setImages([]);
    setImagesBase64([]);
    setResult(null);
    setHistorySaved(false);
    setCurrentStep(0);
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
            <Text style={styles.tipsTitle}>Tips for better results:</Text>
            <View style={styles.tipItem}>
              <Icon name="check-circle" size={14} color={COLORS.success} />
              <Text style={styles.tipText}>Take photos in good lighting</Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name="check-circle" size={14} color={COLORS.success} />
              <Text style={styles.tipText}>Keep camera steady and in focus</Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name="check-circle" size={14} color={COLORS.success} />
              <Text style={styles.tipText}>Capture the affected area clearly</Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name="check-circle" size={14} color={COLORS.success} />
              <Text style={styles.tipText}>Take photos from different angles</Text>
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
                resetAnalysis();
              }}
            >
              <Icon name="camera-alt" size={20} color={COLORS.surface} />
              <Text style={styles.modalPrimaryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Render Capture Step
  const renderCaptureStep = () => (
    <>
      {/* Image Grid */}
      <View style={styles.imageGrid}>
        {[0, 1, 2].map((index) => (
          <TouchableOpacity
            key={index}
            style={styles.imageSlot}
            onPress={() => images[index] ? removeImage(index) : null}
            activeOpacity={images[index] ? 0.7 : 1}
          >
            {images[index] ? (
              <>
                <Image source={{ uri: images[index] }} style={styles.imageSlotImage} />
                <TouchableOpacity
                  style={styles.removeImageIcon}
                  onPress={() => removeImage(index)}
                >
                  <Icon name="close" size={16} color={COLORS.surface} />
                </TouchableOpacity>
                <View style={styles.imageNumberBadge}>
                  <Text style={styles.imageNumberText}>{index + 1}</Text>
                </View>
              </>
            ) : (
              <View style={styles.imageSlotEmpty}>
                <Icon name="add-a-photo" size={32} color={COLORS.secondary} />
                <Text style={styles.imageSlotText}>Photo {index + 1}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Upload Buttons */}
      <View style={styles.uploadSection}>
        <TouchableOpacity
          style={[styles.uploadButton, images.length >= 3 && styles.uploadButtonDisabled]}
          onPress={captureImage}
          disabled={images.length >= 3}
        >
          <Icon name="photo-camera" size={24} color={images.length >= 3 ? COLORS.tertiary : COLORS.accent} />
          <Text style={[styles.uploadButtonText, images.length >= 3 && styles.uploadButtonTextDisabled]}>
            Take Photo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.uploadButton, images.length >= 3 && styles.uploadButtonDisabled]}
          onPress={pickImageFromGallery}
          disabled={images.length >= 3}
        >
          <Icon name="photo-library" size={24} color={images.length >= 3 ? COLORS.tertiary : COLORS.accent} />
          <Text style={[styles.uploadButtonText, images.length >= 3 && styles.uploadButtonTextDisabled]}>
            Gallery
          </Text>
        </TouchableOpacity>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          {images.length} of 3 photos captured
        </Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(images.length / 3) * 100}%` }]} />
        </View>
      </View>

      {/* Analyze Button */}
      {images.length > 0 && (
        <TouchableOpacity
          style={[styles.analyzeButton, images.length === 0 && styles.analyzeButtonDisabled]}
          onPress={analyzeSkin}
          disabled={images.length === 0 || loading}
        >
          <Icon name="search" size={20} color={COLORS.surface} />
          <Text style={styles.analyzeButtonText}>
            Analyze {images.length} Photo{images.length !== 1 ? 's' : ''}
          </Text>
        </TouchableOpacity>
      )}

      {/* Instructions */}
      {images.length === 0 && (
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>How it works:</Text>
          <View style={styles.instructionItem}>
            <Icon name="looks-1" size={16} color={COLORS.accent} />
            <Text style={styles.instructionText}>Take 3 photos of the affected area</Text>
          </View>
          <View style={styles.instructionItem}>
            <Icon name="looks-2" size={16} color={COLORS.accent} />
            <Text style={styles.instructionText}>Different angles for better accuracy</Text>
          </View>
          <View style={styles.instructionItem}>
            <Icon name="looks-3" size={16} color={COLORS.accent} />
            <Text style={styles.instructionText}>AI analyzes all photos together</Text>
          </View>
          <View style={styles.instructionItem}>
            <Icon name="verified" size={16} color={COLORS.success} />
            <Text style={styles.instructionText}>70%+ = High confidence</Text>
          </View>
          <View style={styles.instructionItem}>
            <Icon name="save" size={16} color={COLORS.accent} />
            <Text style={styles.instructionText}>Save analysis to history</Text>
          </View>
        </View>
      )}
    </>
  );

  // Render Results Step with image gallery
  const renderResultsStep = () => (
    <View style={styles.resultsSection}>
      {/* Reference Images Section */}
      <View style={styles.referenceImagesSection}>
        <Text style={styles.referenceImagesTitle}>Reference Images</Text>
        <View style={styles.referenceImageGrid}>
          {images.map((image, index) => (
            <TouchableOpacity
              key={index}
              style={styles.referenceImageSlot}
              onPress={() => setExpandedImage(image)}
              activeOpacity={0.7}
            >
              <Image source={{ uri: image }} style={styles.referenceImage} />
              <View style={styles.referenceImageBadge}>
                <Text style={styles.referenceImageNumber}>{index + 1}</Text>
              </View>
              <View style={styles.referenceImageOverlay}>
                <Icon name="fullscreen" size={20} color={COLORS.surface} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.resultHeader}>
        <Text style={styles.resultTitle}>Analysis Result</Text>
        <View style={[
          styles.resultBadge, 
          result?.aggregated_result?.average_confidence >= 70 ? styles.highConfidenceBadge : 
          result?.aggregated_result?.average_confidence >= 45 ? styles.mediumConfidenceBadge : styles.lowConfidenceBadge
        ]}>
          <Icon 
            name={result?.aggregated_result?.average_confidence >= 70 ? "verified" : "warning"} 
            size={14} 
            color={result?.aggregated_result?.average_confidence >= 70 ? COLORS.success : COLORS.warning} 
          />
          <Text style={[
            styles.resultBadgeText,
            result?.aggregated_result?.average_confidence >= 70 ? styles.highConfidenceText : 
            result?.aggregated_result?.average_confidence >= 45 ? styles.mediumConfidenceText : styles.lowConfidenceText
          ]}>
            {result?.aggregated_result?.average_confidence >= 70 ? "High Confidence" : 
             result?.aggregated_result?.average_confidence >= 45 ? "Medium Confidence" : "Low Confidence"}
          </Text>
        </View>
      </View>

      {/* Disease Card with Medications */}
      <DiseaseCard 
        disease={result?.aggregated_result?.disease}
        confidence={result?.aggregated_result?.average_confidence}
        description={result?.aggregated_result?.description}
        warning={result?.warning}
        medicationInfo={result?.aggregated_result?.medication_info}
        consistencyScore={result?.aggregated_result?.consistency_score}
        imagesAgreeing={result?.aggregated_result?.images_agreeing}
        imagesAnalyzed={result?.aggregated_result?.images_analyzed}
      />

      {/* Individual Results with Images */}
      {result?.individual_results && result.individual_results.length > 0 && (
        <View style={styles.individualResultsSection}>
          <Text style={styles.individualResultsTitle}>Per-Image Analysis</Text>
          {result.individual_results.map((item, index) => (
            <IndividualImageResult 
              key={index} 
              result={item} 
              imageIndex={item.image_index}
              imageUri={images[item.image_index - 1]}
              onImagePress={(uri) => setExpandedImage(uri)}
            />
          ))}
        </View>
      )}

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
          onPress={resetAnalysis}
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
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Fullscreen Image Modal */}
      <FullscreenImageModal />
      
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
          {currentStep === 1 && images.length === 3 && (
            <Text style={styles.headerSubtitle}>Ready to analyze</Text>
          )}
          {currentStep === 2 && (
            <Text style={styles.headerSubtitle}>Analyzing...</Text>
          )}
          {result && (
            <Text style={styles.headerSubtitle}>Analysis Complete</Text>
          )}
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
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.accent} />
            <Text style={styles.loadingText}>Analyzing {images.length} images...</Text>
            <Text style={styles.loadingSubtext}>This may take a few seconds</Text>
          </View>
        ) : result ? (
          renderResultsStep()
        ) : (
          renderCaptureStep()
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
    marginTop: 2,
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
  // Reference Images Section (Results)
  referenceImagesSection: {
    marginBottom: 24,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(88, 101, 110, 0.1)',
  },
  referenceImagesTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
    marginBottom: 12,
  },
  referenceImageGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  referenceImageSlot: {
    width: (width - 72) / 3,
    height: (width - 72) / 3,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  referenceImage: {
    width: '100%',
    height: '100%',
  },
  referenceImageBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  referenceImageNumber: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  referenceImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0,
  },
  // Image Grid (Capture)
  imageGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  imageSlot: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: 'rgba(88, 101, 110, 0.2)',
    overflow: 'hidden',
    position: 'relative',
  },
  imageSlotImage: {
    width: '100%',
    height: '100%',
  },
  imageSlotEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(88, 101, 110, 0.05)',
  },
  imageSlotText: {
    fontSize: 11,
    color: COLORS.secondary,
    marginTop: 8,
  },
  removeImageIcon: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(58, 52, 60, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageNumberBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageNumberText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: '600',
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
  uploadButtonDisabled: {
    opacity: 0.5,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
    marginTop: 8,
  },
  uploadButtonTextDisabled: {
    color: COLORS.tertiary,
  },
  // Progress Bar
  progressContainer: {
    marginBottom: 20,
  },
  progressText: {
    fontSize: 14,
    color: COLORS.secondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(88, 101, 110, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 4,
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
  loadingContainer: {
    alignItems: "center",
    marginVertical: 40,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '500',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 13,
    color: COLORS.secondary,
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
  consistencyBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: 'rgba(25, 118, 210, 0.1)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  consistencyText: {
    fontSize: 13,
    color: COLORS.info,
    marginLeft: 8,
    flex: 1,
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
  // Individual Results Section
  individualResultsSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  individualResultsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
    marginBottom: 12,
  },
  individualResultCard: {
    backgroundColor: 'rgba(58, 52, 60, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  individualResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  individualResultTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
  },
  expandImageIcon: {
    padding: 4,
  },
  individualResultContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  individualResultImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  individualResultDetails: {
    flex: 1,
  },
  individualResultDisease: {
    fontSize: 14,
    color: COLORS.secondary,
    marginBottom: 8,
  },
  individualConfidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  individualConfidenceText: {
    fontSize: 12,
    fontWeight: "600",
  },
  // Fullscreen Modal
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1000,
    padding: 10,
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
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
    gap: 8,
  },
  saveHistoryButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: "600",
  },
  historySavedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56, 142, 60, 0.1)',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  historySavedText: {
    fontSize: 16,
    color: COLORS.success,
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
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 14,
    color: COLORS.secondary,
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
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
    gap: 8,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalSecondaryButtonText: {
    color: COLORS.secondary,
    fontSize: 15,
    fontWeight: '600',
  },
});