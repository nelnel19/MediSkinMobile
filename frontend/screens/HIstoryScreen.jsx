import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  ScrollView,
  RefreshControl,
  StatusBar,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';
import Icon from 'react-native-vector-icons/MaterialIcons';

// FastAPI URL for skin disease history
const DISEASE_API_URL = "http://172.34.45.34:8000";

// Color Theme
const COLORS = {
  charcoal: '#3A343C',
  slate: '#58656E',
  dustyBlue: '#9BAAAE',
  terracotta: '#A36B4F',
  sand: '#D8CEB8',
  white: '#FFFFFF',
  lightGray: '#F5F3F0',
  info: '#1976D2',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
};

const { width: screenWidth } = Dimensions.get('window');

export default function HistoryScreen({ navigation }) {
  const [history, setHistory] = useState([]);
  const [skinDiseaseHistory, setSkinDiseaseHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [expandedItem, setExpandedItem] = useState(null);
  const [expandedDiseaseItem, setExpandedDiseaseItem] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeTab, setActiveTab] = useState('skincare');

  // Load user email and data on component mount
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      let email = await AsyncStorage.getItem('user_email');
      
      if (!email) {
        const userString = await AsyncStorage.getItem('user');
        if (userString) {
          const user = JSON.parse(userString);
          email = user.email;
          if (email) {
            await AsyncStorage.setItem('user_email', email);
          }
        }
      }
      
      if (email) {
        setUserEmail(email);
        await fetchAllHistory(email);
      } else {
        setLoading(false);
        Alert.alert(
          'Login Required',
          'Please login to view your analysis history.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Login', onPress: () => navigation.navigate('Login') }
          ]
        );
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setLoading(false);
    }
  };

  const fetchAllHistory = async (email) => {
    try {
      await Promise.all([
        fetchSkincareHistory(email),
        fetchSkinDiseaseHistory(email)
      ]);
    } catch (error) {
      console.error('Error fetching histories:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchSkincareHistory = async (email) => {
    try {
      const response = await axios.get(`${API_URL}/api/history/${email}`);
      if (response.data.success) {
        setHistory(response.data.data || []);
        fetchStats(email);
      }
    } catch (error) {
      console.error('Fetch skincare history error:', error);
      if (error.response?.status !== 404) {
        Alert.alert('Error', 'Failed to load skincare analysis history');
      }
    }
  };

  const fetchSkinDiseaseHistory = async (email) => {
    try {
      const response = await axios.get(`${DISEASE_API_URL}/user-skin-history/${email}`);
      if (response.data) {
        setSkinDiseaseHistory(response.data.history || []);
      }
    } catch (error) {
      console.error('Fetch skin disease history error:', error);
      if (error.response?.status !== 404) {
        console.log('Error fetching skin disease history:', error.message);
      }
    }
  };

  const fetchStats = async (email) => {
    try {
      const response = await axios.get(`${API_URL}/api/history/stats/${email}`);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  };

  const onRefresh = () => {
    if (!userEmail) {
      loadUserData();
      return;
    }
    setRefreshing(true);
    fetchAllHistory(userEmail);
  };

  const deleteSkincareAnalysis = async (id) => {
    Alert.alert(
      'Delete Analysis',
      'Are you sure you want to delete this skincare analysis?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await axios.delete(`${API_URL}/api/history/${id}`);
              
              if (response.data.success) {
                setHistory(prevHistory => prevHistory.filter(item => item.id !== id));
                if (userEmail) fetchStats(userEmail);
                Alert.alert('Success', 'Analysis deleted successfully');
              }
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete analysis');
            }
          }
        }
      ]
    );
  };

  const deleteSkinDiseaseAnalysis = async (id) => {
    Alert.alert(
      'Delete Analysis',
      'Are you sure you want to delete this skin disease analysis?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              const response = await axios.delete(`${DISEASE_API_URL}/delete-skin-history/${id}`);
              
              if (response.data.success) {
                setSkinDiseaseHistory(prevHistory => 
                  prevHistory.filter(item => item.id !== id)
                );
                Alert.alert('Success', 'Analysis deleted successfully');
              } else {
                throw new Error(response.data.detail || 'Failed to delete');
              }
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete analysis: ' + 
                (error.response?.data?.detail || error.message));
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const toggleExpand = (id) => {
    setExpandedItem(expandedItem === id ? null : id);
  };

  const toggleDiseaseExpand = (id) => {
    setExpandedDiseaseItem(expandedDiseaseItem === id ? null : id);
  };

  const openImageModal = (imageUrl) => {
    if (imageUrl) {
      setSelectedImage(imageUrl);
      setImageModalVisible(true);
    }
  };

  const closeImageModal = () => {
    setImageModalVisible(false);
    setSelectedImage(null);
  };

  // SIMPLIFIED DATE FORMATTING FUNCTION
  const formatDate = (timestamp) => {
    try {
      if (!timestamp) return 'Date not available';
      
      let date;
      
      // Handle timestamp (should be in milliseconds from backend)
      if (typeof timestamp === 'number') {
        date = new Date(timestamp);
      } else if (typeof timestamp === 'string') {
        // Try to parse the string
        date = new Date(timestamp);
        
        // If it's a numeric string, handle it as timestamp
        if (!isNaN(date.getTime()) && timestamp.match(/^\d+$/)) {
          const numTimestamp = parseInt(timestamp, 10);
          date = new Date(numTimestamp);
        }
      } else {
        date = new Date(timestamp);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.log('Invalid date:', timestamp);
        return 'Invalid date';
      }

      // Format the date in Philippines time (UTC+8)
      // The date object automatically handles the timezone conversion
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Manila' // Force Philippines timezone
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date error';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return COLORS.error;
    if (score >= 40) return COLORS.warning;
    return COLORS.success;
  };

  const getScoreLabel = (score) => {
    if (score >= 70) return 'High';
    if (score >= 40) return 'Moderate';
    return 'Low';
  };

  const calculateAverageAcneScore = () => {
    if (history.length === 0) return 0;
    
    let totalScore = 0;
    let validScores = 0;
    
    history.forEach(item => {
      const acneScore = item.analysisData?.acne || 
                       item.analysisData?.skin_attributes?.acne;
      if (acneScore !== undefined && acneScore !== null) {
        totalScore += acneScore;
        validScores++;
      }
    });
    
    return validScores > 0 ? Math.round(totalScore / validScores) : 0;
  };

  const calculateAverageConfidence = () => {
    if (skinDiseaseHistory.length === 0) return 0;
    
    let totalConfidence = 0;
    let validEntries = 0;
    
    skinDiseaseHistory.forEach(item => {
      const confidence = item.prediction?.confidence;
      if (confidence !== undefined && confidence !== null) {
        totalConfidence += confidence;
        validEntries++;
      }
    });
    
    return validEntries > 0 ? Math.round(totalConfidence / validEntries) : 0;
  };

  const getLatestAnalysisData = () => {
    if (history.length === 0) return { age: 'N/A', gender: 'N/A', acneScore: 0 };
    
    const latest = history[0];
    return {
      age: latest.analysisData?.age || latest.analysisData?.face?.age || 'N/A',
      gender: latest.analysisData?.gender || latest.analysisData?.face?.gender || 'N/A',
      acneScore: latest.analysisData?.acne || latest.analysisData?.skin_attributes?.acne || 0
    };
  };

  // Render Skin Disease Analysis Details
  const renderSkinDiseaseDetails = (item) => {
    const prediction = item.prediction || {};
    
    return (
      <View style={styles.detailsContainer}>
        <Text style={styles.detailsTitle}>Skin Disease Analysis</Text>
        
        {item.image_url && (
          <View style={styles.imagePreviewSection}>
            <Text style={styles.detailSectionTitle}>Analysis Image</Text>
            <TouchableOpacity 
              onPress={() => openImageModal(item.image_url)}
              activeOpacity={0.8}
            >
              <Image 
                source={{ uri: item.image_url }} 
                style={styles.analysisImage}
                resizeMode="cover"
              />
              <Text style={styles.viewImageText}>Tap to view full image</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.detailSection}>
          <Text style={styles.detailSectionTitle}>Detection Results</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Condition:</Text>
            <Text style={[styles.detailValue, styles.diseaseName]}>
              {prediction.disease?.replace(/_/g, ' ') || 'Unknown'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Confidence:</Text>
            <View style={styles.confidenceContainer}>
              <Text style={[
                styles.confidenceValue,
                { color: getScoreColor(prediction.confidence || 0) }
              ]}>
                {prediction.confidence || 0}%
              </Text>
              <Text style={[
                styles.confidenceLabel,
                { color: getScoreColor(prediction.confidence || 0) }
              ]}>
                ({getScoreLabel(prediction.confidence || 0)})
              </Text>
            </View>
          </View>
          
          {prediction.warning && (
            <View style={styles.warningContainer}>
              <Icon name="warning" size={16} color={COLORS.warning} />
              <Text style={styles.warningText}>{prediction.warning}</Text>
            </View>
          )}
        </View>

        {prediction.description && (
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{prediction.description}</Text>
          </View>
        )}

        {prediction.medication_info && prediction.medication_info.has_medications && (
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Treatment Recommendations</Text>
            
            {prediction.medication_info.medications && 
             prediction.medication_info.medications.map((med, idx) => (
              <View key={idx} style={styles.medicationCategory}>
                <Text style={styles.medicationCategoryTitle}>{med.category}</Text>
                <Text style={styles.medicationDescription}>{med.description}</Text>
                {med.items && med.items.map((item, itemIdx) => (
                  <View key={itemIdx} style={styles.medicationItem}>
                    <Icon name="check-circle" size={14} color={COLORS.success} />
                    <Text style={styles.medicationItemText}>{item}</Text>
                  </View>
                ))}
              </View>
            ))}
            
            {prediction.medication_info.general_advice && 
             prediction.medication_info.general_advice.length > 0 && (
              <View style={styles.adviceSection}>
                <Text style={styles.adviceTitle}>Self-Care Tips</Text>
                {prediction.medication_info.general_advice.map((advice, idx) => (
                  <View key={idx} style={styles.adviceItem}>
                    <Icon name="circle" size={6} color={COLORS.terracotta} />
                    <Text style={styles.adviceText}>{advice}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  // Render Skin Disease Item
  const renderSkinDiseaseItem = ({ item, index }) => {
    const prediction = item.prediction || {};
    const diseaseName = prediction.disease?.replace(/_/g, ' ') || 'Unknown';
    const confidence = prediction.confidence || 0;
    
    return (
      <View style={[
        styles.historyItem,
        index === 0 && styles.firstItem,
        index === skinDiseaseHistory.length - 1 && styles.lastItem
      ]}>
        <View style={styles.itemHeader}>
          <View style={styles.dateContainer}>
            <Text style={styles.itemDate}>{formatDate(item.created_at)}</Text>
            <View style={[styles.typeBadge, styles.diseaseBadge]}>
              <Icon name="medical-services" size={12} color={COLORS.white} />
              <Text style={styles.typeBadgeText}>Skin Disease</Text>
            </View>
            {item.image_url && (
              <Text style={styles.hasImageText}>📷 Image Available</Text>
            )}
          </View>
          <TouchableOpacity
            onPress={() => deleteSkinDiseaseAnalysis(item.id)}
            style={styles.deleteButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="delete-outline" size={20} color={COLORS.terracotta} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.itemBody}>
          <View style={styles.infoContainer}>
            <Text style={styles.infoLabel}>CONDITION</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {diseaseName}
            </Text>
          </View>
          
          <View style={styles.infoContainer}>
            <Text style={styles.infoLabel}>CONFIDENCE</Text>
            <Text style={[styles.infoValue, { color: getScoreColor(confidence) }]}>
              {confidence}%
            </Text>
          </View>

          <TouchableOpacity
            style={styles.detailsContainerButton}
            onPress={() => toggleDiseaseExpand(item.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.detailsLabel}>
              {expandedDiseaseItem === item.id ? 'HIDE DETAILS ↑' : 'VIEW DETAILS ↓'}
            </Text>
          </TouchableOpacity>
        </View>

        {expandedDiseaseItem === item.id && renderSkinDiseaseDetails(item)}
      </View>
    );
  };

  // Render Skincare Analysis Details
  const renderSkincareDetails = (item) => {
    const analysisData = item.analysisData || {};
    
    return (
      <View style={styles.detailsContainer}>
        <Text style={styles.detailsTitle}>Detailed Analysis</Text>
        
        {item.imageUrl && (
          <View style={styles.imagePreviewSection}>
            <Text style={styles.detailSectionTitle}>Analysis Image</Text>
            <TouchableOpacity 
              onPress={() => openImageModal(item.imageUrl)}
              activeOpacity={0.8}
            >
              <Image 
                source={{ uri: item.imageUrl }} 
                style={styles.analysisImage}
                resizeMode="cover"
              />
              <Text style={styles.viewImageText}>Tap to view full image</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.detailSection}>
          <Text style={styles.detailSectionTitle}>Basic Information</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Age:</Text>
            <Text style={styles.detailValue}>
              {analysisData.age || analysisData.face?.age || 'Unknown'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Gender:</Text>
            <Text style={styles.detailValue}>
              {analysisData.gender || analysisData.face?.gender || 'Unknown'}
            </Text>
          </View>
          
          {analysisData.api_used && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Analysis Method:</Text>
              <Text style={styles.detailValue}>{analysisData.api_used}</Text>
            </View>
          )}
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Face Detected:</Text>
            <Text style={styles.detailValue}>
              {analysisData.face_detected !== false ? 'Yes' : 'No'}
            </Text>
          </View>
        </View>

        {(analysisData.skin_attributes || analysisData.acne) && (
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Skin Analysis Scores (0-100)</Text>
            
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>Acne:</Text>
              <View style={styles.scoreValueContainer}>
                <Text style={styles.scoreValue}>
                  {analysisData.acne || analysisData.skin_attributes?.acne || 0}
                </Text>
                <Text style={[styles.scoreSeverity, { 
                  color: getScoreColor(analysisData.acne || analysisData.skin_attributes?.acne || 0) 
                }]}>
                  {getScoreLabel(analysisData.acne || analysisData.skin_attributes?.acne || 0)}
                </Text>
              </View>
            </View>
            
            {analysisData.skin_attributes?.stain !== undefined && (
              <View style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>Dark Spots:</Text>
                <View style={styles.scoreValueContainer}>
                  <Text style={styles.scoreValue}>
                    {analysisData.skin_attributes.stain}
                  </Text>
                  <Text style={[styles.scoreSeverity, { 
                    color: getScoreColor(analysisData.skin_attributes.stain) 
                  }]}>
                    {getScoreLabel(analysisData.skin_attributes.stain)}
                  </Text>
                </View>
              </View>
            )}
            
            {analysisData.skin_attributes?.dark_circle !== undefined && (
              <View style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>Dark Circles:</Text>
                <View style={styles.scoreValueContainer}>
                  <Text style={styles.scoreValue}>
                    {analysisData.skin_attributes.dark_circle}
                  </Text>
                  <Text style={[styles.scoreSeverity, { 
                    color: getScoreColor(analysisData.skin_attributes.dark_circle) 
                  }]}>
                    {getScoreLabel(analysisData.skin_attributes.dark_circle)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {item.skinGrade && (
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Skin Grade</Text>
            <View style={styles.gradeContainer}>
              {typeof item.skinGrade === 'object' ? (
                <>
                  <View style={styles.gradeHeader}>
                    <Text style={styles.gradeText}>Grade: {item.skinGrade.grade || 'N/A'}</Text>
                    <Text style={styles.gradeDescription}>{item.skinGrade.description || ''}</Text>
                  </View>
                  {item.skinGrade.overall_score && (
                    <Text style={styles.gradeScore}>Score: {item.skinGrade.overall_score}</Text>
                  )}
                </>
              ) : (
                <Text style={styles.gradeText}>Grade: {item.skinGrade}</Text>
              )}
              <Text style={styles.overallCondition}>Overall: {item.overallCondition || 'Unknown'}</Text>
            </View>
          </View>
        )}

        {analysisData.skincare_recommendations && (
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Skincare Recommendations</Text>
            
            {analysisData.skincare_recommendations.summary && (
              <View style={styles.recommendationItem}>
                <Icon name="info" size={16} color={COLORS.terracotta} style={styles.recommendationIcon} />
                <Text style={styles.recommendationText}>
                  {analysisData.skincare_recommendations.summary}
                </Text>
              </View>
            )}
            
            {analysisData.skincare_recommendations.morning_routine && 
             analysisData.skincare_recommendations.morning_routine.length > 0 && (
              <View style={styles.routineSection}>
                <View style={styles.routineHeader}>
                  <Icon name="wb-sunny" size={16} color={COLORS.terracotta} />
                  <Text style={styles.routineTitle}>Morning Routine</Text>
                </View>
                {analysisData.skincare_recommendations.morning_routine.map((step, index) => (
                  <View key={index} style={styles.routineStep}>
                    <Icon name="circle" size={6} color={COLORS.slate} />
                    <Text style={styles.routineText}>{step}</Text>
                  </View>
                ))}
              </View>
            )}
            
            {analysisData.skincare_recommendations.evening_routine && 
             analysisData.skincare_recommendations.evening_routine.length > 0 && (
              <View style={styles.routineSection}>
                <View style={styles.routineHeader}>
                  <Icon name="nightlight" size={16} color={COLORS.terracotta} />
                  <Text style={styles.routineTitle}>Evening Routine</Text>
                </View>
                {analysisData.skincare_recommendations.evening_routine.map((step, index) => (
                  <View key={index} style={styles.routineStep}>
                    <Icon name="circle" size={6} color={COLORS.slate} />
                    <Text style={styles.routineText}>{step}</Text>
                  </View>
                ))}
              </View>
            )}
            
            {analysisData.skincare_recommendations.weekly_treatments && 
             analysisData.skincare_recommendations.weekly_treatments.length > 0 && (
              <View style={styles.routineSection}>
                <View style={styles.routineHeader}>
                  <Icon name="event" size={16} color={COLORS.terracotta} />
                  <Text style={styles.routineTitle}>Weekly Treatments</Text>
                </View>
                {analysisData.skincare_recommendations.weekly_treatments.map((step, index) => (
                  <View key={index} style={styles.routineStep}>
                    <Icon name="circle" size={6} color={COLORS.slate} />
                    <Text style={styles.routineText}>{step}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  // Render Skincare Item
  const renderSkincareItem = ({ item, index }) => {
    const analysisData = item.analysisData || {};
    const age = analysisData.age || analysisData.face?.age || 'N/A';
    const gender = analysisData.gender || analysisData.face?.gender || 'N/A';
    const acneScore = analysisData.acne || analysisData.skin_attributes?.acne || 0;
    
    return (
      <View style={[
        styles.historyItem,
        index === 0 && styles.firstItem,
        index === history.length - 1 && styles.lastItem
      ]}>
        <View style={styles.itemHeader}>
          <View style={styles.dateContainer}>
            <Text style={styles.itemDate}>{formatDate(item.timestamp || item.createdAt)}</Text>
            <View style={styles.typeBadge}>
              <Icon name="face" size={12} color={COLORS.white} />
              <Text style={styles.typeBadgeText}>Skincare</Text>
            </View>
            {item.imageUrl && (
              <Text style={styles.hasImageText}>📷 Image Available</Text>
            )}
            {item.skinGrade && (
              <View style={styles.gradeBadge}>
                <Text style={styles.gradeBadgeText}>
                  {typeof item.skinGrade === 'object' ? item.skinGrade.grade : item.skinGrade}
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={() => deleteSkincareAnalysis(item.id)}
            style={styles.deleteButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="delete-outline" size={20} color={COLORS.terracotta} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.itemBody}>
          <View style={styles.infoContainer}>
            <Text style={styles.infoLabel}>AGE</Text>
            <Text style={styles.infoValue}>{age}</Text>
          </View>
          
          <View style={styles.infoContainer}>
            <Text style={styles.infoLabel}>GENDER</Text>
            <Text style={styles.infoValue}>{gender}</Text>
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.infoLabel}>ACNE SCORE</Text>
            <Text style={[styles.infoValue, { 
              color: getScoreColor(acneScore) 
            }]}>
              {acneScore}/100
            </Text>
          </View>

          <TouchableOpacity
            style={styles.detailsContainerButton}
            onPress={() => toggleExpand(item.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.detailsLabel}>
              {expandedItem === item.id ? 'HIDE DETAILS ↑' : 'VIEW DETAILS ↓'}
            </Text>
          </TouchableOpacity>
        </View>

        {expandedItem === item.id && renderSkincareDetails(item)}
      </View>
    );
  };

  // Stats Card Component
  const StatsCard = () => {
    const totalSkincare = history.length;
    const totalSkinDisease = skinDiseaseHistory.length;
    const totalAnalyses = totalSkincare + totalSkinDisease;
    
    const latestData = getLatestAnalysisData();
    const averageAcneScore = stats?.averageAcneScore || calculateAverageAcneScore();
    const averageConfidence = calculateAverageConfidence();
    
    return (
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>
          {activeTab === 'skincare' ? 'Your Skin Analysis Stats' : 'Your Disease Detection Stats'}
        </Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalAnalyses}</Text>
            <Text style={styles.statLabel}>Total Analyses</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalSkincare}</Text>
            <Text style={styles.statLabel}>Skincare</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalSkinDisease}</Text>
            <Text style={styles.statLabel}>Disease Detection</Text>
          </View>
        </View>

        {activeTab === 'skincare' && history.length > 0 && (
          <View style={styles.scoreDistribution}>
            <Text style={styles.distributionTitle}>Average Acne Score</Text>
            <View style={styles.scoreBarContainer}>
              <View style={[
                styles.scoreBar, 
                { 
                  width: `${Math.min(averageAcneScore, 100)}%`,
                  backgroundColor: getScoreColor(averageAcneScore)
                }
              ]} />
              <Text style={styles.scoreBarText}>
                {averageAcneScore}/100
              </Text>
            </View>
            
            <View style={styles.latestInfoContainer}>
              <Text style={styles.latestInfoTitle}>Latest Analysis:</Text>
              <View style={styles.latestInfoRow}>
                <Text style={styles.latestInfoLabel}>Age: </Text>
                <Text style={styles.latestInfoValue}>{latestData.age}</Text>
              </View>
              <View style={styles.latestInfoRow}>
                <Text style={styles.latestInfoLabel}>Gender: </Text>
                <Text style={styles.latestInfoValue}>{latestData.gender}</Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'skindisease' && skinDiseaseHistory.length > 0 && (
          <View style={styles.scoreDistribution}>
            <Text style={styles.distributionTitle}>Average Confidence</Text>
            <View style={styles.scoreBarContainer}>
              <View style={[
                styles.scoreBar, 
                { 
                  width: `${averageConfidence}%`,
                  backgroundColor: getScoreColor(averageConfidence)
                }
              ]} />
              <Text style={styles.scoreBarText}>
                {averageConfidence}%
              </Text>
            </View>
            
            {skinDiseaseHistory.length > 0 && (
              <View style={styles.latestInfoContainer}>
                <Text style={styles.latestInfoTitle}>Most Common:</Text>
                <View style={styles.latestInfoRow}>
                  <Text style={styles.latestInfoLabel}>Condition: </Text>
                  <Text style={styles.latestInfoValue}>
                    {getMostCommonCondition()}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const getMostCommonCondition = () => {
    if (skinDiseaseHistory.length === 0) return 'N/A';
    
    const conditionCount = {};
    skinDiseaseHistory.forEach(item => {
      const condition = item.prediction?.disease?.replace(/_/g, ' ') || 'Unknown';
      conditionCount[condition] = (conditionCount[condition] || 0) + 1;
    });
    
    let mostCommon = 'Unknown';
    let maxCount = 0;
    
    Object.entries(conditionCount).forEach(([condition, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = condition;
      }
    });
    
    return mostCommon;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.terracotta} />
        <Text style={styles.loadingText}>Loading your history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.sand} />
      
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={24} color={COLORS.charcoal} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Analysis History</Text>
          <Text style={styles.headerSubtitle}>
            {userEmail ? `Viewing history for ${userEmail}` : 'Your skin analysis timeline'}
          </Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.terracotta]}
            tintColor={COLORS.terracotta}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {(history.length > 0 || skinDiseaseHistory.length > 0) && <StatsCard />}

        {(history.length > 0 || skinDiseaseHistory.length > 0) && (
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'skincare' && styles.activeTab]}
              onPress={() => setActiveTab('skincare')}
            >
              <Icon 
                name="face" 
                size={20} 
                color={activeTab === 'skincare' ? COLORS.terracotta : COLORS.slate} 
              />
              <Text style={[
                styles.tabText,
                activeTab === 'skincare' && styles.activeTabText
              ]}>
                Skincare ({history.length})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'skindisease' && styles.activeTab]}
              onPress={() => setActiveTab('skindisease')}
            >
              <Icon 
                name="medical-services" 
                size={20} 
                color={activeTab === 'skindisease' ? COLORS.terracotta : COLORS.slate} 
              />
              <Text style={[
                styles.tabText,
                activeTab === 'skindisease' && styles.activeTabText
              ]}>
                Disease Detection ({skinDiseaseHistory.length})
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.historySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {activeTab === 'skincare' ? 'Previous Analyses' : 'Disease Detection History'}
            </Text>
            <Text style={styles.resultsCount}>
              {activeTab === 'skincare' ? history.length : skinDiseaseHistory.length} result
              {(activeTab === 'skincare' ? history.length : skinDiseaseHistory.length) !== 1 ? 's' : ''}
            </Text>
          </View>

          {activeTab === 'skincare' && history.length === 0 && (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Text style={styles.emptyIconText}>📊</Text>
              </View>
              <Text style={styles.emptyTitle}>No Skincare History</Text>
              <Text style={styles.emptyText}>
                You haven't completed any skincare analyses yet.
              </Text>
              <TouchableOpacity
                style={styles.analyzeButton}
                onPress={() => navigation.navigate('Skincare')}
                activeOpacity={0.8}
              >
                <Text style={styles.analyzeButtonText}>Start Skin Analysis</Text>
              </TouchableOpacity>
            </View>
          )}

          {activeTab === 'skindisease' && skinDiseaseHistory.length === 0 && (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Text style={styles.emptyIconText}>🔬</Text>
              </View>
              <Text style={styles.emptyTitle}>No Disease Detection History</Text>
              <Text style={styles.emptyText}>
                You haven't completed any skin disease analyses yet.
              </Text>
              <TouchableOpacity
                style={styles.analyzeButton}
                onPress={() => navigation.navigate('SkinDisease')}
                activeOpacity={0.8}
              >
                <Text style={styles.analyzeButtonText}>Start Disease Detection</Text>
              </TouchableOpacity>
            </View>
          )}

          {activeTab === 'skincare' && history.length > 0 && (
            <FlatList
              data={history}
              renderItem={renderSkincareItem}
              keyExtractor={item => item.id || item._id}
              scrollEnabled={false}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}

          {activeTab === 'skindisease' && skinDiseaseHistory.length > 0 && (
            <FlatList
              data={skinDiseaseHistory}
              renderItem={renderSkinDiseaseItem}
              keyExtractor={item => item.id || item._id}
              scrollEnabled={false}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImageModal}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.modalCloseButton}
            onPress={closeImageModal}
          >
            <Icon name="close" size={24} color={COLORS.white} />
          </TouchableOpacity>
          {selectedImage && (
            <Image 
              source={{ uri: selectedImage }} 
              style={styles.modalImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
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
  placeholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 120,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  statsCard: {
    backgroundColor: COLORS.white,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.dustyBlue,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.charcoal,
    marginBottom: 20,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.terracotta,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.slate,
    textAlign: 'center',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.dustyBlue,
  },
  scoreDistribution: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.dustyBlue,
  },
  distributionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.charcoal,
    marginBottom: 12,
    textAlign: 'center',
  },
  scoreBarContainer: {
    height: 30,
    backgroundColor: 'rgba(88, 101, 110, 0.1)',
    borderRadius: 15,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    marginBottom: 16,
  },
  scoreBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 15,
  },
  scoreBarText: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    color: COLORS.charcoal,
    fontWeight: '600',
    fontSize: 14,
  },
  latestInfoContainer: {
    backgroundColor: 'rgba(163, 107, 79, 0.05)',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  latestInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.terracotta,
    marginBottom: 8,
  },
  latestInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  latestInfoLabel: {
    fontSize: 13,
    color: COLORS.slate,
    fontWeight: '500',
  },
  latestInfoValue: {
    fontSize: 13,
    color: COLORS.charcoal,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: COLORS.dustyBlue,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  activeTab: {
    backgroundColor: 'rgba(163, 107, 79, 0.1)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.slate,
  },
  activeTabText: {
    color: COLORS.terracotta,
    fontWeight: '600',
  },
  historySection: {
    paddingHorizontal: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.charcoal,
  },
  resultsCount: {
    fontSize: 14,
    color: COLORS.slate,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 20,
  },
  historyItem: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: COLORS.dustyBlue,
  },
  firstItem: {
    marginTop: 8,
  },
  lastItem: {
    marginBottom: 20,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dateContainer: {
    flex: 1,
  },
  itemDate: {
    fontSize: 14,
    color: COLORS.slate,
    fontWeight: '500',
    marginBottom: 4,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.terracotta,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 4,
    gap: 4,
  },
  diseaseBadge: {
    backgroundColor: COLORS.info,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.white,
  },
  hasImageText: {
    fontSize: 12,
    color: COLORS.terracotta,
    fontWeight: '500',
    marginBottom: 4,
  },
  gradeBadge: {
    backgroundColor: 'rgba(163, 107, 79, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  gradeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.terracotta,
  },
  deleteButton: {
    padding: 4,
  },
  itemBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  infoContainer: {
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    color: COLORS.slate,
    marginBottom: 4,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.charcoal,
  },
  detailsContainerButton: {
    alignItems: 'center',
    flex: 1,
  },
  detailsLabel: {
    fontSize: 10,
    color: COLORS.terracotta,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  detailsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.dustyBlue,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.charcoal,
    marginBottom: 12,
  },
  imagePreviewSection: {
    marginBottom: 20,
  },
  analysisImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.dustyBlue,
  },
  viewImageText: {
    fontSize: 12,
    color: COLORS.terracotta,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  detailSection: {
    marginBottom: 20,
  },
  detailSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.terracotta,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(88, 101, 110, 0.1)',
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.slate,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.charcoal,
    fontWeight: '600',
  },
  diseaseName: {
    color: COLORS.info,
    fontSize: 16,
  },
  confidenceContainer: {
    alignItems: 'flex-end',
  },
  confidenceValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  confidenceLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  warningText: {
    fontSize: 13,
    color: COLORS.warning,
    flex: 1,
    fontStyle: 'italic',
  },
  descriptionText: {
    fontSize: 14,
    color: COLORS.slate,
    lineHeight: 20,
  },
  medicationCategory: {
    marginBottom: 16,
  },
  medicationCategoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.charcoal,
    marginBottom: 4,
  },
  medicationDescription: {
    fontSize: 12,
    color: COLORS.slate,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  medicationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
    paddingLeft: 8,
  },
  medicationItemText: {
    fontSize: 13,
    color: COLORS.charcoal,
    flex: 1,
  },
  adviceSection: {
    marginTop: 12,
    backgroundColor: 'rgba(163, 107, 79, 0.05)',
    padding: 12,
    borderRadius: 8,
  },
  adviceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.terracotta,
    marginBottom: 8,
  },
  adviceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    gap: 8,
  },
  adviceText: {
    fontSize: 13,
    color: COLORS.slate,
    flex: 1,
    lineHeight: 18,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(88, 101, 110, 0.1)',
  },
  scoreLabel: {
    fontSize: 14,
    color: COLORS.slate,
    fontWeight: '500',
    flex: 1,
  },
  scoreValueContainer: {
    alignItems: 'flex-end',
    flex: 1,
  },
  scoreValue: {
    fontSize: 16,
    color: COLORS.charcoal,
    fontWeight: '700',
  },
  scoreSeverity: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  gradeContainer: {
    backgroundColor: 'rgba(163, 107, 79, 0.05)',
    padding: 12,
    borderRadius: 8,
  },
  gradeHeader: {
    marginBottom: 8,
  },
  gradeText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.charcoal,
    marginBottom: 4,
  },
  gradeDescription: {
    fontSize: 14,
    color: COLORS.slate,
    fontStyle: 'italic',
  },
  gradeScore: {
    fontSize: 14,
    color: COLORS.charcoal,
    fontWeight: '500',
    marginBottom: 4,
  },
  overallCondition: {
    fontSize: 14,
    color: COLORS.terracotta,
    fontWeight: '600',
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    backgroundColor: 'rgba(163, 107, 79, 0.05)',
    padding: 12,
    borderRadius: 8,
  },
  recommendationIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  recommendationText: {
    fontSize: 14,
    color: COLORS.charcoal,
    flex: 1,
    lineHeight: 20,
  },
  routineSection: {
    marginBottom: 16,
  },
  routineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  routineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.charcoal,
    marginLeft: 8,
  },
  routineStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    marginLeft: 8,
  },
  routineText: {
    fontSize: 13,
    color: COLORS.slate,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.sand,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.slate,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.dustyBlue,
    borderStyle: 'dashed',
    marginHorizontal: 8,
    marginTop: 8,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: COLORS.dustyBlue,
  },
  emptyIconText: {
    fontSize: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.charcoal,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.slate,
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.slate,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  analyzeButton: {
    backgroundColor: COLORS.terracotta,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.terracotta,
  },
  analyzeButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  bottomPadding: {
    height: 40,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: screenWidth * 0.9,
    height: screenWidth * 0.9,
    borderRadius: 12,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});