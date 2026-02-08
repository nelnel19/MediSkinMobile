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

const { width: screenWidth } = Dimensions.get('window');

export default function HistoryScreen({ navigation }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [expandedItem, setExpandedItem] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // Load user email and data on component mount
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const storedEmail = await AsyncStorage.getItem('user_email');
      const storedUser = await AsyncStorage.getItem('user');
      
      if (storedEmail) {
        setUserEmail(storedEmail);
        fetchHistory(storedEmail);
        fetchStats(storedEmail);
      } else if (storedUser) {
        const user = JSON.parse(storedUser);
        setUserEmail(user.email);
        await AsyncStorage.setItem('user_email', user.email);
        fetchHistory(user.email);
        fetchStats(user.email);
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

  const fetchHistory = async (email) => {
    try {
      const response = await axios.get(`${API_URL}/api/history/${email}`);
      if (response.data.success) {
        setHistory(response.data.data);
      }
    } catch (error) {
      console.error('Fetch history error:', error);
      if (error.response?.status !== 404) {
        Alert.alert('Error', 'Failed to load analysis history');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
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
    fetchHistory(userEmail);
    fetchStats(userEmail);
  };

  const deleteAnalysis = async (id) => {
    Alert.alert(
      'Delete Analysis',
      'Are you sure you want to delete this analysis?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/api/history/${id}`);
              setHistory(history.filter(item => item._id !== id));
              if (userEmail) {
                fetchStats(userEmail);
              }
              Alert.alert('Success', 'Analysis deleted successfully');
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete analysis');
            }
          }
        }
      ]
    );
  };

  const toggleExpand = (id) => {
    setExpandedItem(expandedItem === id ? null : id);
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score) => {
    if (score >= 70) return '#F44336'; // Red for high scores (bad)
    if (score >= 40) return '#FF9800'; // Orange for medium scores
    return '#4CAF50'; // Green for low scores (good)
  };

  const getScoreLabel = (score) => {
    if (score >= 70) return 'High';
    if (score >= 40) return 'Moderate';
    return 'Low';
  };

  // Calculate average acne score from history
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

  // Get latest analysis data for stats
  const getLatestAnalysisData = () => {
    if (history.length === 0) return { age: 'N/A', gender: 'N/A', acneScore: 0 };
    
    const latest = history[0];
    return {
      age: latest.analysisData?.age || latest.analysisData?.face?.age || 'N/A',
      gender: latest.analysisData?.gender || latest.analysisData?.face?.gender || 'N/A',
      acneScore: latest.analysisData?.acne || latest.analysisData?.skin_attributes?.acne || 0
    };
  };

  const renderAnalysisDetails = (item) => {
    const analysisData = item.analysisData || {};
    
    return (
      <View style={styles.detailsContainer}>
        <Text style={styles.detailsTitle}>Detailed Analysis</Text>
        
        {/* Image Preview if available */}
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
        
        {/* Basic Info */}
        <View style={styles.detailSection}>
          <Text style={styles.detailSectionTitle}>Basic Information</Text>
          
          {/* Age */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Age:</Text>
            <Text style={styles.detailValue}>
              {analysisData.age || analysisData.face?.age || 'Unknown'}
            </Text>
          </View>
          
          {/* Gender */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Gender:</Text>
            <Text style={styles.detailValue}>
              {analysisData.gender || analysisData.face?.gender || 'Unknown'}
            </Text>
          </View>
          
          {/* API Used */}
          {analysisData.api_used && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Analysis Method:</Text>
              <Text style={styles.detailValue}>{analysisData.api_used}</Text>
            </View>
          )}
          
          {/* Face Detected */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Face Detected:</Text>
            <Text style={styles.detailValue}>
              {analysisData.face_detected !== false ? 'Yes' : 'No'}
            </Text>
          </View>
        </View>

        {/* Skin Analysis Scores */}
        {(analysisData.skin_attributes || analysisData.acne) && (
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Skin Analysis Scores (0-100)</Text>
            
            {/* Acne Score */}
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
            
            {/* Dark Spots */}
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
            
            {/* Dark Circles */}
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
            
            {/* Blackheads */}
            {analysisData.skin_attributes?.blackhead !== undefined && (
              <View style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>Blackheads:</Text>
                <View style={styles.scoreValueContainer}>
                  <Text style={styles.scoreValue}>
                    {analysisData.skin_attributes.blackhead}
                  </Text>
                  <Text style={[styles.scoreSeverity, { 
                    color: getScoreColor(analysisData.skin_attributes.blackhead) 
                  }]}>
                    {getScoreLabel(analysisData.skin_attributes.blackhead)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Skincare Recommendations */}
        {analysisData.skincare_recommendations && (
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Skincare Recommendations</Text>
            
            {/* Summary */}
            {analysisData.skincare_recommendations.summary && (
              <View style={styles.recommendationItem}>
                <Icon name="info" size={16} color={COLORS.terracotta} style={styles.recommendationIcon} />
                <Text style={styles.recommendationText}>
                  {analysisData.skincare_recommendations.summary}
                </Text>
              </View>
            )}
            
            {/* Morning Routine */}
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
            
            {/* Evening Routine */}
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
            
            {/* Weekly Treatments */}
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

        {/* Raw Data Button (for debugging) */}
        <TouchableOpacity
          style={styles.rawDataButton}
          onPress={() => {
            console.log('Analysis Data:', analysisData);
            Alert.alert(
              'Raw Analysis Data',
              JSON.stringify(analysisData, null, 2),
              [{ text: 'OK' }]
            );
          }}
        >
          <Text style={styles.rawDataText}>View Raw Analysis Data</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderAnalysisItem = ({ item, index }) => {
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
            <Text style={styles.itemDate}>{formatDate(item.timestamp)}</Text>
            {item.imageUrl && (
              <Text style={styles.hasImageText}>📷 Image Available</Text>
            )}
          </View>
          <TouchableOpacity
            onPress={() => deleteAnalysis(item._id)}
            style={styles.deleteButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="delete-outline" size={20} color={COLORS.terracotta} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.itemBody}>
          {/* Age Display */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoLabel}>AGE</Text>
            <Text style={styles.infoValue}>{age}</Text>
          </View>
          
          {/* Gender Display */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoLabel}>GENDER</Text>
            <Text style={styles.infoValue}>{gender}</Text>
          </View>

          {/* Acne Score Display */}
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
            onPress={() => toggleExpand(item._id)}
            activeOpacity={0.7}
          >
            <Text style={styles.detailsLabel}>
              {expandedItem === item._id ? 'HIDE DETAILS ↑' : 'VIEW DETAILS ↓'}
            </Text>
          </TouchableOpacity>
        </View>

        {expandedItem === item._id && renderAnalysisDetails(item)}
      </View>
    );
  };

  const StatsCard = () => {
    const latestData = getLatestAnalysisData();
    const averageAcneScore = stats?.averageAcneScore || calculateAverageAcneScore();
    const totalAnalyses = stats?.totalAnalyses || history.length;
    
    return (
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Your Skin Analysis Stats</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalAnalyses || 0}</Text>
            <Text style={styles.statLabel}>Total Analyses</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {latestData.age || 'N/A'}
            </Text>
            <Text style={styles.statLabel}>Latest Age</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {latestData.gender || 'N/A'}
            </Text>
            <Text style={styles.statLabel}>Gender</Text>
          </View>
        </View>

        {/* Acne Score Distribution */}
        {history.length > 0 && (
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
          </View>
        )}
      </View>
    );
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
        {/* Statistics Card */}
        {history.length > 0 && <StatsCard />}

        {/* History List */}
        <View style={styles.historySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Previous Analyses</Text>
            <Text style={styles.resultsCount}>
              {history.length} result{history.length !== 1 ? 's' : ''}
            </Text>
          </View>

          {history.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Text style={styles.emptyIconText}>📊</Text>
              </View>
              <Text style={styles.emptyTitle}>No Analysis History</Text>
              <Text style={styles.emptyText}>
                You haven't completed any skin analyses yet.
              </Text>
              <Text style={styles.emptySubtext}>
                Start by analyzing your skin to track your progress over time.
              </Text>
              <TouchableOpacity
                style={styles.analyzeButton}
                onPress={() => navigation.navigate('Skincare')}
                activeOpacity={0.8}
              >
                <Text style={styles.analyzeButtonText}>Start Skin Analysis</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={history}
              renderItem={renderAnalysisItem}
              keyExtractor={item => item._id}
              scrollEnabled={false}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Image Modal */}
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
    margin: 16,
    marginTop: 120,
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
  historySection: {
    paddingHorizontal: 16,
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
  hasImageText: {
    fontSize: 12,
    color: COLORS.terracotta,
    fontWeight: '500',
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
  // Expanded Details Styles
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
  // Score Row Styles
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
  // Recommendation Styles
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
  // Raw Data Button
  rawDataButton: {
    backgroundColor: 'rgba(88, 101, 110, 0.1)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  rawDataText: {
    fontSize: 14,
    color: COLORS.slate,
    fontWeight: '500',
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
  // Modal Styles
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