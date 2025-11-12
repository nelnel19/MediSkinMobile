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

export default function HistoryScreen({ navigation }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [expandedItem, setExpandedItem] = useState(null);

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

  const getGradeColor = (grade) => {
    const colors = {
      'A': COLORS.terracotta,
      'B': COLORS.slate,
      'C': COLORS.dustyBlue,
      'D': COLORS.charcoal,
      'E': COLORS.charcoal,
      'F': COLORS.charcoal,
    };
    return colors[grade] || COLORS.slate;
  };

  const getConditionColor = (condition) => {
    if (condition?.toLowerCase().includes('excellent') || condition?.toLowerCase().includes('good')) {
      return COLORS.terracotta;
    } else if (condition?.toLowerCase().includes('fair') || condition?.toLowerCase().includes('average')) {
      return COLORS.slate;
    } else {
      return COLORS.dustyBlue;
    }
  };

  const renderAnalysisDetails = (item) => {
    const analysis = item.analysisData || item;
    
    return (
      <View style={styles.detailsContainer}>
        <Text style={styles.detailsTitle}>Detailed Analysis</Text>
        
        {/* Basic Info */}
        <View style={styles.detailSection}>
          <Text style={styles.detailSectionTitle}>Basic Information</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Gender:</Text>
            <Text style={styles.detailValue}>{analysis.gender || "Unknown"}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Estimated Age:</Text>
            <Text style={styles.detailValue}>{analysis.estimated_age || "Unknown"}</Text>
          </View>
        </View>

        {/* Skin Conditions */}
        <View style={styles.detailSection}>
          <Text style={styles.detailSectionTitle}>Skin Conditions</Text>
          {analysis.acne && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Acne:</Text>
              <Text style={styles.detailValue}>{analysis.acne}</Text>
            </View>
          )}
          {analysis.pimples && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Pimples:</Text>
              <Text style={styles.detailValue}>{analysis.pimples}</Text>
            </View>
          )}
          {analysis.blackheads && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Blackheads:</Text>
              <Text style={styles.detailValue}>{analysis.blackheads}</Text>
            </View>
          )}
          {analysis.dark_circles && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Dark Circles:</Text>
              <Text style={styles.detailValue}>{analysis.dark_circles}</Text>
            </View>
          )}
        </View>

        {/* Additional Metrics */}
        {(analysis.skin_moisture || analysis.pore_visibility) && (
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Additional Metrics</Text>
            {analysis.skin_moisture && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Skin Moisture:</Text>
                <Text style={styles.detailValue}>{analysis.skin_moisture}</Text>
              </View>
            )}
            {analysis.pore_visibility && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Pore Visibility:</Text>
                <Text style={styles.detailValue}>{analysis.pore_visibility}</Text>
              </View>
            )}
          </View>
        )}

        {analysis.analysis_confidence && (
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Analysis Confidence</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Confidence Level:</Text>
              <Text style={styles.detailValue}>{analysis.analysis_confidence}%</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderAnalysisItem = ({ item, index }) => (
    <View style={[
      styles.historyItem,
      index === 0 && styles.firstItem,
      index === history.length - 1 && styles.lastItem
    ]}>
      <View style={styles.itemHeader}>
        <View style={styles.dateContainer}>
          <Text style={styles.itemDate}>{formatDate(item.timestamp)}</Text>
          {item.analysisType && (
            <Text style={styles.analysisType}>{item.analysisType}</Text>
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
        <View style={styles.gradeContainer}>
          <Text style={styles.gradeLabel}>SKIN GRADE</Text>
          <Text style={[styles.gradeValue, { color: getGradeColor(item.skinGrade) }]}>
            {item.skinGrade}
          </Text>
        </View>
        
        <View style={styles.conditionContainer}>
          <Text style={styles.conditionLabel}>CONDITION</Text>
          <Text style={[styles.conditionValue, { color: getConditionColor(item.overallCondition) }]}>
            {item.overallCondition}
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

  const StatsCard = () => (
    <View style={styles.statsCard}>
      <Text style={styles.statsTitle}>Your Skin Analysis Stats</Text>
      
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats?.totalAnalyses || 0}</Text>
          <Text style={styles.statLabel}>Total Analyses</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: getGradeColor(stats?.latestAnalysis?.skinGrade) }]}>
            {stats?.latestAnalysis?.skinGrade || 'N/A'}
          </Text>
          <Text style={styles.statLabel}>Latest Grade</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {stats?.gradeDistribution?.length || 0}
          </Text>
          <Text style={styles.statLabel}>Different Grades</Text>
        </View>
      </View>

      {stats?.gradeDistribution && stats.gradeDistribution.length > 0 && (
        <View style={styles.gradeDistribution}>
          <Text style={styles.distributionTitle}>Grade Distribution</Text>
          <View style={styles.distributionRow}>
            {stats.gradeDistribution.map((grade, index) => (
              <View key={index} style={styles.gradeItem}>
                <View style={[styles.gradeDot, { backgroundColor: getGradeColor(grade._id) }]} />
                <Text style={styles.gradeCount}>{grade.count}</Text>
                <Text style={styles.gradeLabel}>{grade._id}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );

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
      >
        {/* Statistics Card */}
        {stats && <StatsCard />}

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
    paddingTop: 120, // Extra padding for floating header
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  statsCard: {
    backgroundColor: COLORS.white,
    margin: 16,
    marginTop: 120, // Adjusted for floating header
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
  gradeDistribution: {
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
  distributionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  gradeItem: {
    alignItems: 'center',
  },
  gradeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  gradeCount: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.charcoal,
    marginBottom: 2,
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
  analysisType: {
    fontSize: 12,
    color: COLORS.terracotta,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deleteButton: {
    padding: 4,
  },
  itemBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gradeContainer: {
    alignItems: 'center',
    flex: 1,
  },
  gradeLabel: {
    fontSize: 10,
    color: COLORS.slate,
    marginBottom: 4,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  gradeValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  conditionContainer: {
    alignItems: 'center',
    flex: 1,
  },
  conditionLabel: {
    fontSize: 10,
    color: COLORS.slate,
    marginBottom: 4,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  conditionValue: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
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
  detailSection: {
    marginBottom: 16,
  },
  detailSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.terracotta,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
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
});