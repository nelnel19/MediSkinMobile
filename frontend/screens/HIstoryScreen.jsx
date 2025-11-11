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
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';

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
      'A': '#7A8B7F',
      'B': '#9B8B7E',
      'C': '#A89F99',
      'D': '#8B8B8B',
      'E': '#2C2C2C',
      'F': '#2C2C2C',
    };
    return colors[grade] || '#9B8B7E';
  };

  const getConditionColor = (condition) => {
    if (condition?.toLowerCase().includes('excellent') || condition?.toLowerCase().includes('good')) {
      return '#7A8B7F';
    } else if (condition?.toLowerCase().includes('fair') || condition?.toLowerCase().includes('average')) {
      return '#9B8B7E';
    } else {
      return '#8B8B8B';
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
          <View style={styles.deleteIcon}>
            <View style={styles.deleteLine1} />
            <View style={styles.deleteLine2} />
          </View>
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
                <Text style={[styles.gradeDot, { backgroundColor: getGradeColor(grade._id) }]} />
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
        <ActivityIndicator size="large" color="#7A8B7F" />
        <Text style={styles.loadingText}>Loading your history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <View style={styles.backIcon} />
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
            colors={['#7A8B7F']}
            tintColor="#7A8B7F"
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
    backgroundColor: '#F9F7F5',
  },
  header: {
    backgroundColor: '#FEFDFB',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5DDD5',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEFDFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1.5,
    borderColor: '#E5DDD5',
  },
  backIcon: {
    width: 10,
    height: 10,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#9B8B7E',
    transform: [{ rotate: '45deg' }],
    marginLeft: 3,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#8B8B8B',
    fontWeight: '400',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  statsCard: {
    backgroundColor: '#FEFDFB',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5DDD5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2C',
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
    color: '#7A8B7F',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8B8B8B',
    textAlign: 'center',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E5DDD5',
  },
  gradeDistribution: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5DDD5',
  },
  distributionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
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
    color: '#2C2C2C',
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
    color: '#2C2C2C',
  },
  resultsCount: {
    fontSize: 14,
    color: '#8B8B8B',
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 20,
  },
  historyItem: {
    backgroundColor: '#FEFDFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#E5DDD5',
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
    color: '#8B8B8B',
    fontWeight: '500',
    marginBottom: 4,
  },
  analysisType: {
    fontSize: 12,
    color: '#7A8B7F',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deleteButton: {
    padding: 4,
  },
  deleteIcon: {
    width: 20,
    height: 20,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteLine1: {
    position: 'absolute',
    width: 14,
    height: 2,
    backgroundColor: '#FF6B6B',
    transform: [{ rotate: '45deg' }],
  },
  deleteLine2: {
    position: 'absolute',
    width: 14,
    height: 2,
    backgroundColor: '#FF6B6B',
    transform: [{ rotate: '-45deg' }],
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
    color: '#8B8B8B',
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
    color: '#8B8B8B',
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
    color: '#7A8B7F',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  // Expanded Details Styles
  detailsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5DDD5',
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 12,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7A8B7F',
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
    color: '#8B8B8B',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#2C2C2C',
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F7F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8B8B8B',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FEFDFB',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5DDD5',
    borderStyle: 'dashed',
    marginHorizontal: 8,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F9F7F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#E5DDD5',
  },
  emptyIconText: {
    fontSize: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#8B8B8B',
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8B8B8B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  analyzeButton: {
    backgroundColor: '#7A8B7F',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#6A7B6F',
  },
  analyzeButtonText: {
    color: '#FEFDFB',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  bottomPadding: {
    height: 40,
  },
});