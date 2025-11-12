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
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { PYTHON_API_URL, API_URL } from "../config/api";
import Icon from 'react-native-vector-icons/MaterialIcons';

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

// Key for storing user email
const USER_EMAIL_KEY = "user_email";

export default function SkincareScreen({ navigation }) {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastImageHash, setLastImageHash] = useState(null);
  const [userEmail, setUserEmail] = useState(null);

  // Load user email on component mount
  useEffect(() => {
    loadUserEmail();
  }, []);

  // Load user email from AsyncStorage
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

  // Image Quality Guide Component
  const ImageQualityGuide = () => (
    <View style={styles.qualityGuide}>
      <Text style={styles.qualityGuideTitle}>For Best Results:</Text>
      <View style={styles.qualityTips}>
        <Text style={styles.qualityTip}>• Use natural lighting</Text>
        <Text style={styles.qualityTip}>• Face the light source</Text>
        <Text style={styles.qualityTip}>• Remove glasses if possible</Text>
        <Text style={styles.qualityTip}>• Keep neutral expression</Text>
        <Text style={styles.qualityTip}>• Ensure clear focus</Text>
      </View>
      <Text style={styles.qualityNote}>
        Note: AI analysis may sometimes detect minor imperfections that aren't visible to the naked eye.
      </Text>
    </View>
  );

  // Enhanced image selection with state reset
  const pickImage = async (fromCamera = false) => {
    try {
      const permission = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permission Required", "Please allow camera or gallery access.");
        return;
      }

      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
            exif: false,
          })
        : await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
            exif: false,
          });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
        setResult(null);
        setLastImageHash(null);
      }
    } catch (error) {
      console.error("Image selection error:", error);
      Alert.alert("Error", "Could not select image. Please try again.");
    }
  };

  // Enhanced error handling
  const handleAnalysisError = (error) => {
    const message = error.response?.data?.detail || error.message;
    
    if (message.includes("No face detected")) {
      Alert.alert(
        "No Face Detected",
        "Please ensure:\n• Face is clearly visible\n• Good lighting\n• No shadows or glare\n• Front-facing position\n• No glasses or masks"
      );
    } else if (message.includes("timeout")) {
      Alert.alert(
        "Analysis Timeout",
        "The analysis is taking longer than expected. Please try again with a clearer image."
      );
    } else if (message.includes("unavailable")) {
      Alert.alert(
        "Service Unavailable",
        "The skin analysis service is temporarily unavailable. Please try again in a few moments."
      );
    } else if (error.response?.data?.analysis_skipped) {
      Alert.alert(
        "Poor Image Quality",
        `Issues detected:\n${error.response.data.issues?.join('\n') || 'Unknown'}\n\nRecommendations:\n${error.response.data.recommendations?.join('\n') || 'Please try with a better quality image.'}`
      );
    } else {
      Alert.alert(
        "Analysis Failed",
        "Please try again with a different photo. Ensure good lighting and a clear view of your face."
      );
    }
  };

  // Enhanced analysis function
  const analyzeImage = async () => {
    if (!image) {
      Alert.alert("No Image", "Please select or capture a clear face photo first.");
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

      console.log("Analyzing new image...");

      const res = await axios.post(`${PYTHON_API_URL}/analyze/skin`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 30000,
      });

      if (res.data.analysis_skipped) {
        handleAnalysisError({ response: { data: res.data } });
        return;
      }

      console.log("New analysis result:", res.data);
      
      if (res.data.image_hash === lastImageHash) {
        console.log("Same image detected, but got new analysis");
      }
      
      setLastImageHash(res.data.image_hash);
      setResult(res.data);
      
    } catch (error) {
      console.error("API Error:", error.response?.data || error.message);
      handleAnalysisError(error);
    } finally {
      setLoading(false);
    }
  };

  // Save analysis to history
  const saveAnalysisToHistory = async () => {
    if (!result || !userEmail) {
      Alert.alert("Error", "User not identified. Please login again.");
      return;
    }

    try {
      setSaving(true);
      
      const analysisData = {
        userEmail: userEmail,
        imageHash: result.image_hash,
        analysisData: result,
        skinGrade: result.skin_grade,
        overallCondition: result.overall_condition,
      };

      const response = await axios.post(`${API_URL}/api/history/save-analysis`, analysisData);
      
      if (response.data.success) {
        Alert.alert("Success", "Analysis saved to your history!");
      } else {
        throw new Error(response.data.message || "Failed to save analysis");
      }
    } catch (error) {
      console.error("Save error:", error);
      Alert.alert("Save Failed", "Could not save analysis to history. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // View history
  const viewHistory = () => {
    if (!userEmail) {
      Alert.alert("Error", "User not identified. Please login again.");
      return;
    }
    navigation.navigate('History', { userEmail });
  };

  // Convert severity to percentage
  const getSeverityLevel = (severity) => {
    const levels = {
      "None": 0,
      "Very Mild": 20,
      "Mild": 40,
      "Moderate": 60,
      "Severe": 80,
      "Very Severe": 100,
      "Few": 30,
      "Several": 60,
      "Many": 90,
      "Heavy": 85,
    };
    return levels[severity] || 0;
  };

  // Get color based on severity
  const getSeverityColor = (severity) => {
    const colors = {
      "None": COLORS.dustyBlue,
      "Very Mild": COLORS.sand,
      "Mild": COLORS.slate,
      "Moderate": COLORS.terracotta,
      "Severe": COLORS.charcoal,
      "Very Severe": COLORS.charcoal,
      "Few": COLORS.sand,
      "Several": COLORS.slate,
      "Many": COLORS.charcoal,
      "Heavy": COLORS.charcoal,
    };
    return colors[severity] || COLORS.slate;
  };

  // Level Bar Component
  const LevelBar = ({ label, value, icon }) => {
    const level = getSeverityLevel(value);
    const color = getSeverityColor(value);

    return (
      <View style={styles.levelBarContainer}>
        <View style={styles.levelBarHeader}>
          <View style={styles.labelContainer}>
            <Text style={styles.levelIcon}>{icon}</Text>
            <Text style={styles.levelLabel}>{label}</Text>
          </View>
          <Text style={[styles.levelValue, { color }]}>{value}</Text>
        </View>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${level}%`, backgroundColor: color },
            ]}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.sand} />
      
      {/* Floating Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={24} color={COLORS.charcoal} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Skin Analysis</Text>
          <Text style={styles.headerSubtitle}>
            {userEmail ? `Logged in as ${userEmail}` : 'AI-powered skin assessment'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={viewHistory}
          activeOpacity={0.7}
        >
          <Icon name="history" size={24} color={COLORS.charcoal} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Quality Guide */}
        <ImageQualityGuide />

        {/* Image Preview */}
        <View style={styles.imageSection}>
          {image ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: image }} style={styles.preview} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => {
                  setImage(null);
                  setResult(null);
                  setLastImageHash(null);
                }}
              >
                <Icon name="close" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <View style={styles.cameraPlaceholder}>
                <View style={styles.cameraBody}>
                  <View style={styles.cameraLens} />
                </View>
              </View>
              <Text style={styles.placeholderText}>No image selected</Text>
              <Text style={styles.placeholderSubtext}>
                Upload or capture a clear photo
              </Text>
            </View>
          )}
        </View>

        {/* Upload Buttons */}
        <View style={styles.uploadSection}>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => pickImage(false)}
            activeOpacity={0.8}
          >
            <Icon name="photo-library" size={32} color={COLORS.terracotta} />
            <Text style={styles.uploadButtonText}>Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => pickImage(true)}
            activeOpacity={0.8}
          >
            <Icon name="photo-camera" size={32} color={COLORS.terracotta} />
            <Text style={styles.uploadButtonText}>Camera</Text>
          </TouchableOpacity>
        </View>

        {/* Analyze Button */}
        {image && !result && (
          <TouchableOpacity
            style={[styles.analyzeButton, loading && styles.analyzeButtonDisabled]}
            onPress={analyzeImage}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <>
                <Icon name="search" size={20} color={COLORS.white} style={styles.analyzeIcon} />
                <Text style={styles.analyzeButtonText}>Analyze Skin</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Enhanced Results Section */}
        {result && (
          <View style={styles.resultsSection}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>Analysis Results</Text>
              <View style={styles.resultBadge}>
                <Text style={styles.resultBadgeText}>
                  {result.analysis_confidence}% Confident
                </Text>
              </View>
            </View>

            {/* Analysis Info */}
            {result.analysis_attempts > 1 && (
              <View style={styles.analysisInfo}>
                <Text style={styles.analysisInfoText}>
                  Optimized analysis based on {result.analysis_attempts} attempts
                </Text>
              </View>
            )}

            {/* Enhanced Basic Info */}
            <View style={styles.basicInfoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Gender</Text>
                <Text style={styles.infoValue}>{result.gender || "Unknown"}</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Estimated Age</Text>
                <Text style={styles.infoValue}>{result.estimated_age || "Unknown"}</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Skin Grade</Text>
                <Text style={[styles.infoValue, styles.gradeText]}>{result.skin_grade}</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Overall Condition</Text>
                <Text style={styles.infoValue}>{result.overall_condition}</Text>
              </View>
            </View>

            {/* Enhanced Skin Conditions */}
            <View style={styles.conditionsCard}>
              <Text style={styles.conditionsTitle}>Detailed Analysis</Text>

              <LevelBar
                label="Acne Severity"
                value={result.acne}
                icon="🫒"
              />

              <LevelBar
                label="Pimples"
                value={result.pimples}
                icon="🔴"
              />

              <LevelBar
                label="Blackheads"
                value={result.blackheads}
                icon="⚫"
              />

              <LevelBar
                label="Dark Circles"
                value={result.dark_circles}
                icon="👁️"
              />

              {/* Additional Metrics */}
              <View style={styles.additionalMetrics}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Skin Moisture</Text>
                  <Text style={styles.metricValue}>{result.skin_moisture}</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Pores</Text>
                  <Text style={styles.metricValue}>{result.pore_visibility}</Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={saveAnalysisToHistory}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <>
                    <Icon name="save" size={18} color={COLORS.white} style={styles.saveIcon} />
                    <Text style={styles.saveButtonText}>Save to History</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.reanalyzeButton}
                onPress={() => {
                  setImage(null);
                  setResult(null);
                  setLastImageHash(null);
                }}
                activeOpacity={0.8}
              >
                <Icon name="refresh" size={18} color={COLORS.terracotta} style={styles.refreshIcon} />
                <Text style={styles.reanalyzeButtonText}>New Analysis</Text>
              </TouchableOpacity>
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
    backgroundColor: COLORS.sand,
  },
  header: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 1000,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: 'transparent',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'transparent',
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: COLORS.charcoal,
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.slate,
    fontWeight: "400",
  },
  historyButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 120, // Extra padding to account for floating header
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  // Image Quality Guide Styles
  qualityGuide: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: COLORS.dustyBlue,
  },
  qualityGuideTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.charcoal,
    marginBottom: 8,
  },
  qualityTips: {
    marginBottom: 8,
  },
  qualityTip: {
    fontSize: 12,
    color: COLORS.slate,
    marginBottom: 2,
  },
  qualityNote: {
    fontSize: 11,
    color: COLORS.slate,
    fontStyle: "italic",
  },
  // Analysis Info
  analysisInfo: {
    backgroundColor: "rgba(155, 170, 174, 0.1)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(155, 170, 174, 0.2)",
  },
  analysisInfoText: {
    fontSize: 12,
    color: COLORS.dustyBlue,
    fontWeight: "500",
    textAlign: "center",
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
    height: 320,
    borderRadius: 16,
    backgroundColor: COLORS.lightGray,
    borderWidth: 1.5,
    borderColor: COLORS.dustyBlue,
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
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  placeholderContainer: {
    height: 320,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.dustyBlue,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraPlaceholder: {
    marginBottom: 16,
  },
  cameraBody: {
    width: 60,
    height: 48,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.dustyBlue,
  },
  cameraLens: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: COLORS.terracotta,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.charcoal,
    marginBottom: 4,
  },
  placeholderSubtext: {
    fontSize: 13,
    color: COLORS.slate,
  },
  uploadSection: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  uploadButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.dustyBlue,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.charcoal,
    letterSpacing: 0.1,
    marginTop: 8,
  },
  analyzeButton: {
    backgroundColor: COLORS.terracotta,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.terracotta,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: COLORS.terracotta,
  },
  analyzeButtonDisabled: {
    opacity: 0.7,
  },
  analyzeIcon: {
    marginRight: 10,
  },
  analyzeButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.2,
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
    color: COLORS.charcoal,
    letterSpacing: -0.3,
  },
  resultBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.dustyBlue,
  },
  resultBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.dustyBlue,
    letterSpacing: 0.3,
  },
  basicInfoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: COLORS.dustyBlue,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.slate,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.charcoal,
    fontWeight: "600",
  },
  gradeText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.terracotta,
  },
  infoDivider: {
    height: 1,
    backgroundColor: COLORS.dustyBlue,
    marginVertical: 12,
  },
  conditionsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: COLORS.dustyBlue,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  conditionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.charcoal,
    marginBottom: 20,
    letterSpacing: -0.2,
  },
  levelBarContainer: {
    marginBottom: 20,
  },
  levelBarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  levelIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  levelLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.charcoal,
  },
  levelValue: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: COLORS.lightGray,
    borderRadius: 4,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.dustyBlue,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  additionalMetrics: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.dustyBlue,
  },
  metricItem: {
    alignItems: "center",
  },
  metricLabel: {
    fontSize: 12,
    color: COLORS.slate,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.charcoal,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.terracotta,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.terracotta,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: COLORS.terracotta,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveIcon: {
    marginRight: 8,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  reanalyzeButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: COLORS.dustyBlue,
  },
  refreshIcon: {
    marginRight: 8,
  },
  reanalyzeButtonText: {
    color: COLORS.terracotta,
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});