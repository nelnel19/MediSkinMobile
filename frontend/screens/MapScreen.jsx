import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
  Linking,
  TextInput,
  StatusBar,
} from 'react-native';
import * as Location from 'expo-location';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const DERMATOLOGY_CLINICS = [
  {
    id: '1',
    name: 'SKIN Dermatology & Laser Center',
    type: 'dermatologist',
    latitude: 14.5533,
    longitude: 121.0508,
    area: 'Bonifacio High Street, BGC, Taguig',
    phone: '+63-2-8403-8000',
    hours: 'Mon-Sat: 9AM-7PM',
    rating: 4.6,
    website: 'skindermatologyandlasercenter.com'
  },
  {
    id: '2',
    name: 'Avignon Clinic',
    type: 'skin_clinic',
    latitude: 14.5528,
    longitude: 121.0492,
    area: 'Fort Victoria, 5th Ave & 23rd St., BGC, Taguig',
    phone: '+63-917-809-2399',
    hours: 'Mon-Fri: 8AM-6PM',
    rating: 4.5,
    website: 'avignon.clinic'
  },
  {
    id: '3',
    name: 'Luminisce BGC',
    type: 'skin_clinic',
    latitude: 14.5541,
    longitude: 121.0515,
    area: 'Mercury Drug Building, 32nd St. corner 4th Ave., Fort Bonifacio, Taguig',
    phone: '+63-977-804-4601',
    hours: 'Tue-Sat: 10AM-8PM',
    rating: 4.4,
    website: 'luminisce.com'
  },
  {
    id: '4',
    name: 'Wunderskin Aesthetic Medicine & Laser Clinic',
    type: 'skin_clinic',
    latitude: 14.5535,
    longitude: 121.0510,
    area: 'BGC Area, Taguig City',
    phone: '+63-917-626-9979',
    hours: 'Mon-Sat: 9AM-7PM',
    rating: 4.3,
    website: 'wunderskin.ph'
  },
  {
    id: '5',
    name: 'Medico Global Clinic',
    type: 'dermatologist',
    latitude: 14.5256,
    longitude: 121.0623,
    area: 'Bayani Road, Equator Building, Western Bicutan, Taguig',
    phone: '+63-928-893-7264',
    hours: 'Mon-Fri: 8AM-5PM',
    rating: 4.2,
    website: 'medicoglobal.net'
  },
  {
    id: '6',
    name: 'Kamiseta Skin Clinic - BGC',
    type: 'skin_clinic',
    latitude: 14.5530,
    longitude: 121.0502,
    area: 'W Global Center, Bonifacio Global City, Taguig',
    phone: '+63-2-8478-8440',
    hours: 'Mon-Sun: 10AM-9PM',
    rating: 4.5,
    website: 'kamisetaskinclinic.com'
  },
  {
    id: '7',
    name: 'Hydra Skin Clinic - BGC',
    type: 'skin_clinic',
    latitude: 14.5489,
    longitude: 121.0528,
    area: 'SM Aura Premier, McKinley Parkway, Fort Bonifacio, Taguig',
    phone: '+63-915-584-3250',
    hours: 'Daily: 10AM-9PM',
    rating: 4.4,
    website: 'facebook.com/hydraskinclinicph'
  },
  {
    id: '8',
    name: 'Slimmers World Face & Skin Clinic - Elite BGC',
    type: 'skin_clinic',
    latitude: 14.5543,
    longitude: 121.0498,
    area: '26th St., BGC, Taguig City',
    phone: '+63-917-546-6377',
    hours: 'Mon-Sat: 8AM-8PM',
    rating: 4.3,
    website: 'classpass.com'
  },
  {
    id: '9',
    name: 'St. Lukes Medical Center - Dermatology Department',
    type: 'dermatologist',
    latitude: 14.5584,
    longitude: 121.0542,
    area: 'Rizal Drive cor. 32nd St. & 5th Ave., Global City, Taguig',
    phone: '+63-2-8789-7700',
    hours: '24/7 Emergency, Clinic: Mon-Fri 8AM-5PM',
    rating: 4.8,
    website: 'stlukes.com.ph'
  },
  {
    id: '10',
    name: 'Healthway Medical Market Market - Dr. Kriselle Dar Santos-Cabrera',
    type: 'dermatologist',
    latitude: 14.5482,
    longitude: 121.0531,
    area: 'Market Market, Bonifacio Global City, Taguig',
    phone: '+63-917-626-9979',
    hours: 'By Appointment',
    rating: 4.7,
    website: 'seriousmd.com'
  },
  {
    id: '11',
    name: 'Dr Emmerson Vista Dermatology Clinic',
    type: 'dermatologist',
    latitude: 14.5250,
    longitude: 121.0630,
    area: 'Taguig City',
    phone: '+63-917-626-9979',
    hours: 'By Appointment',
    rating: 4.6,
    website: 'facebook.com/vistaderm'
  },
  {
    id: '12',
    name: 'Dr A Aesthetics & Skin Clinic',
    type: 'skin_clinic',
    latitude: 14.5260,
    longitude: 121.0620,
    area: 'Taguig City',
    phone: '+63-917-626-9979',
    hours: 'Mon-Sat: 9AM-6PM',
    rating: 4.4,
    website: 'facebook.com'
  },
  {
    id: '13',
    name: 'Medical Center Taguig - Dermatology Department',
    type: 'dermatologist',
    latitude: 14.5189,
    longitude: 121.0678,
    area: 'Levi Mariano Avenue, Ususan, Taguig City',
    phone: '+63-2-8888-6284',
    hours: '24/7 Emergency, Clinic: Mon-Fri 8AM-5PM',
    rating: 4.3,
    website: 'medicalcentertaguig.com'
  },
  {
    id: '14',
    name: 'The Dermatology Suite Skin & Laser Clinic',
    type: 'skin_clinic',
    latitude: 14.5547,
    longitude: 121.0512,
    area: 'Avida Cityflex Towers, Lane T corner 7th Ave., BGC, Taguig',
    phone: '+63-2-759-6368',
    hours: 'Mon-Sat: 9AM-7PM',
    rating: 4.5,
    website: 'bizippines.com'
  },
  {
    id: '15',
    name: 'Cellona Skin Dermatology & Laser Center',
    type: 'skin_clinic',
    latitude: 14.5538,
    longitude: 121.0505,
    area: 'BGC Area, Taguig',
    phone: '+63-917-626-9979',
    hours: 'Mon-Sat: 9AM-7PM',
    rating: 4.4,
    website: 'cellona.com'
  },
  {
    id: '16',
    name: 'The Aivee Clinic - Fort BGC',
    type: 'skin_clinic',
    latitude: 14.5522,
    longitude: 121.0485,
    area: 'Forbestown Center, Burgos Circle, Bonifacio Global City, Taguig',
    phone: '+63-917-537-1801',
    hours: 'Mon-Sat: 9AM-8PM',
    rating: 4.8,
    website: 'theaiveeclinic.com'
  },
  {
    id: '17',
    name: 'Vivacité Center for Scientific Wellness - BGC',
    type: 'skin_clinic',
    latitude: 14.5536,
    longitude: 121.0509,
    area: 'Bonifacio Global City, Taguig',
    phone: '+63-917-152-6697',
    hours: 'By Appointment',
    rating: 4.6,
    website: 'aqskinsolutionsph.com'
  },
  {
    id: '18',
    name: 'Teviant Beauty',
    type: 'skincare_shop',
    latitude: 14.5489,
    longitude: 121.0528,
    area: 'Upper Ground Floor, SM Aura Premier, McKinley Parkway, Taguig',
    phone: '+63-917-626-9979',
    hours: 'Daily: 10AM-9PM',
    rating: 4.5,
    website: 'teviantbeauty.com'
  },
  {
    id: '19',
    name: 'Skin Potions - Market Market',
    type: 'skincare_shop',
    latitude: 14.5482,
    longitude: 121.0531,
    area: 'Lower Ground Floor, Market Market, Taguig',
    phone: '+63-917-626-9979',
    hours: 'Daily: 10AM-9PM',
    rating: 4.4,
    website: 'skinpotions.com'
  },
  {
    id: '20',
    name: 'Shiseido Philippines - BGC',
    type: 'skincare_shop',
    latitude: 14.5530,
    longitude: 121.0510,
    area: '30th Street, Bonifacio Global City, Taguig',
    phone: '+63-917-626-9979',
    hours: 'Mon-Sat: 10AM-8PM',
    rating: 4.7,
    website: 'shiseido.com.ph'
  },
  {
    id: '21',
    name: 'Love, Skin',
    type: 'skincare_shop',
    latitude: 14.5540,
    longitude: 121.0520,
    area: '2/F Mitsukoshi BGC, 8th Ave. Corner 36th St., Taguig',
    phone: '+63-977-284-7619',
    hours: 'Daily: 10AM-9PM',
    rating: 4.6,
    website: 'loveskin.com.ph'
  },
  {
    id: '22',
    name: 'Maison de Beauté Boutique',
    type: 'skincare_shop',
    latitude: 14.5525,
    longitude: 121.0488,
    area: 'The Piazza at Serendra, 2nd Floor, McKinley Parkway, BGC, Taguig',
    phone: '+63-917-626-9979',
    hours: 'Mon-Sun: 10AM-8PM',
    rating: 4.8,
    website: 'maisondebeaute.ph'
  },
  {
    id: '23',
    name: 'BeautyselectionPH',
    type: 'skincare_shop',
    latitude: 14.5532,
    longitude: 121.0495,
    area: 'Bonifacio Stopover, 32nd St. corner 2nd St., BGC, Taguig',
    phone: '+63-917-626-9979',
    hours: 'Daily: 10AM-9PM',
    rating: 4.3,
    website: 'beautyselectionph.shop'
  },
  {
    id: '24',
    name: 'Best Buy World - BGC Pickup Point',
    type: 'skincare_shop',
    latitude: 14.5535,
    longitude: 121.0500,
    area: 'BGC, Taguig City (Pickup Available)',
    phone: '+63-917-626-9979',
    hours: 'Mon-Sat: 9AM-7PM',
    rating: 4.2,
    website: 'bestbuyworld.ph'
  },
  {
    id: '25',
    name: 'SKINCARE.MNL Taguig Store',
    type: 'skincare_shop',
    latitude: 14.5533,
    longitude: 121.0508,
    area: '24 Bonifacio High Street, 9th Ave, Taguig',
    phone: '+63-917-626-9979',
    hours: 'Daily: 10AM-9PM',
    rating: 4.5,
    website: 'skincaremanila.com'
  },
  {
    id: '26',
    name: 'The Face Shop - BGC Mall',
    type: 'skincare_shop',
    latitude: 14.5538,
    longitude: 121.0512,
    area: 'BGC Mall, Bonifacio Global City, Taguig',
    phone: '+63-917-626-9979',
    hours: 'Daily: 10AM-9PM',
    rating: 4.4,
    website: 'ph.feau.com'
  },
  {
    id: '27',
    name: 'Celeteque Retail Shop - Taguig',
    type: 'skincare_shop',
    latitude: 14.5531,
    longitude: 121.0505,
    area: 'Various Locations in Taguig',
    phone: '+63-917-626-9979',
    hours: 'Daily: 9AM-8PM',
    rating: 4.3,
    website: 'celeteque.com.ph'
  },
  {
    id: '28',
    name: 'Skin Science Clinic',
    type: 'skin_clinic',
    latitude: 14.5995,
    longitude: 120.9842,
    area: 'Manila',
    phone: '+63-2-8345-6789',
    hours: 'Mon-Sat: 8AM-7PM',
    rating: 4.5,
  },
  {
    id: '29',
    name: 'Luxe Skin Boutique',
    type: 'skincare_shop',
    latitude: 14.5634,
    longitude: 121.0265,
    area: 'Rockwell Center, Makati',
    phone: '+63-2-8567-8901',
    hours: 'Daily: 10AM-8PM',
    rating: 4.7,
  },
];

const MapScreen = () => {
  const [location, setLocation] = useState(null);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation();

  const categories = [
    { id: 'all', name: 'All', icon: 'apps', color: '#58656E' },
    { id: 'dermatologist', name: 'Doctors', icon: 'local-hospital', color: '#A36B4F' },
    { id: 'skin_clinic', name: 'Clinics', icon: 'business', color: '#9BAAAE' },
    { id: 'skincare_shop', name: 'Shops', icon: 'shopping-bag', color: '#58656E' },
  ];

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (location) {
      findNearestPlaces();
    }
  }, [location, selectedCategory, searchQuery]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setError('Location access denied');
        setLoading(false);
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    } catch (error) {
      setError('Error getting location');
      setLoading(false);
    }
  };

  const findNearestPlaces = () => {
    if (!location) return;

    setLoading(true);
    try {
      const userLat = location.latitude;
      const userLon = location.longitude;
      
      const placesWithDistance = DERMATOLOGY_CLINICS
        .filter(clinic => 
          (selectedCategory === 'all' || clinic.type === selectedCategory) &&
          (searchQuery === '' || clinic.name.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        .map(clinic => {
          const distance = calculateDistance(userLat, userLon, clinic.latitude, clinic.longitude);
          return {
            ...clinic,
            distance: distance,
            displayDistance: distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`
          };
        })
        .filter(clinic => clinic.distance <= 50)
        .sort((a, b) => a.distance - b.distance);

      setPlaces(placesWithDistance);
    } catch (error) {
      setError('Error finding places');
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (phoneNumber) => {
    Linking.openURL(`tel:${phoneNumber}`).catch(() => 
      Alert.alert('Error', 'Could not make a call')
    );
  };

  const openMaps = (place) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;
    Linking.openURL(url).catch(() => 
      Alert.alert('Error', 'Could not open maps')
    );
  };

  const openWebsite = (website) => {
    if (website && !website.startsWith('http')) {
      website = 'https://' + website;
    }
    if (website) {
      Linking.openURL(website).catch(() => 
        Alert.alert('Error', 'Could not open website')
      );
    }
  };

  if (loading && !location) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#58656E" />
        <Text style={styles.loadingText}>Finding location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#D8CEB8" />
      
      {/* Minimal Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={24} color="#3A343C" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Nearby</Text>
              <Text style={styles.headerSubtitle}>{places.length} places</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.mapButton}
            onPress={() => navigation.navigate('MiniMap', { userLocation: location, places, selectedCategory })}
          >
            <Icon name="map" size={24} color="#3A343C" />
          </TouchableOpacity>
        </View>

        {/* Minimal Search */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Minimal Category Tabs */}
      <View style={styles.categoryRow}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {categories.map((category) => {
            const isSelected = selectedCategory === category.id;
            return (
              <TouchableOpacity
                key={category.id}
                onPress={() => setSelectedCategory(category.id)}
                activeOpacity={0.7}
              >
                {isSelected ? (
                  <LinearGradient
                    colors={[category.color, category.color + 'DD']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.categoryTabActive}
                  >
                    <Text style={styles.categoryTabTextActive}>
                      {category.name}
                    </Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.categoryTab}>
                    <Text style={styles.categoryTabText}>
                      {category.name}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Places List */}
      <ScrollView 
        style={styles.listContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {places.map((place) => (
          <View key={place.id} style={styles.card}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <View style={styles.cardLeft}>
                <Text style={styles.cardTitle} numberOfLines={2}>{place.name}</Text>
                <View style={styles.cardMeta}>
                  <View style={styles.ratingBadge}>
                    <Icon name="star" size={12} color="#F59E0B" />
                    <Text style={styles.ratingText}>{place.rating}</Text>
                  </View>
                  <View style={styles.divider} />
                  <Text style={styles.distanceText}>{place.displayDistance}</Text>
                </View>
              </View>
            </View>

            {/* Card Details */}
            <View style={styles.cardDetails}>
              <View style={styles.detailRow}>
                <Icon name="location-on" size={14} color="#666" />
                <Text style={styles.detailText} numberOfLines={2}>{place.area}</Text>
              </View>
              <View style={styles.detailRow}>
                <Icon name="schedule" size={14} color="#666" />
                <Text style={styles.detailText}>{place.hours}</Text>
              </View>
            </View>

            {/* Card Actions */}
            <View style={styles.cardActions}>
              <TouchableOpacity 
                style={styles.actionBtn}
                onPress={() => handleCall(place.phone)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#58656E', '#3A343C']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.actionBtnGradient}
                >
                  <Icon name="phone" size={16} color="#FFF" />
                  <Text style={styles.actionBtnText}>Call</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionBtnSecondary}
                onPress={() => openMaps(place)}
                activeOpacity={0.7}
              >
                <Icon name="directions" size={16} color="#A36B4F" />
                <Text style={styles.actionBtnSecondaryText}>Directions</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {places.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="search-off" size={48} color="#E0E0E0" />
            <Text style={styles.emptyText}>No results</Text>
            <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F2ED',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F2ED',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#58656E',
    fontWeight: '400',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#D8CEB8',
    borderBottomWidth: 1,
    borderBottomColor: '#9BAAAE',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
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
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '600',
    color: '#3A343C',
    letterSpacing: -1,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#58656E',
    fontWeight: '400',
  },
  mapButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F2ED',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#3A343C',
    marginLeft: 8,
    fontWeight: '400',
  },
  categoryRow: {
    backgroundColor: '#D8CEB8',
    borderBottomWidth: 1,
    borderBottomColor: '#9BAAAE',
  },
  categoryScroll: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F2ED',
    marginRight: 8,
  },
  categoryTabActive: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#58656E',
  },
  categoryTabTextActive: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFF',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardLeft: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
    lineHeight: 22,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#F59E0B',
  },
  divider: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#CCC',
    marginHorizontal: 8,
  },
  distanceText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6366F1',
  },
  cardDetails: {
    marginBottom: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
    lineHeight: 18,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFF',
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    gap: 6,
  },
  actionBtnSecondaryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6366F1',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
  },
});

export default MapScreen;