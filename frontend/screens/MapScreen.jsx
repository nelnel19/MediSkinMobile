import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import * as Location from 'expo-location';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

// Updated dermatology clinics database for Philippines with new data
const DERMATOLOGY_CLINICS = [
  // Taguig/BGC Area Clinics
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

  // New Skincare Shops
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

  // Additional clinics from original data for variety
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
  const [selectedCategory, setSelectedCategory] = useState('dermatologist');
  const navigation = useNavigation();

  const categories = [
    { id: 'dermatologist', name: 'Dermatologists', icon: 'user-md' },
    { id: 'skin_clinic', name: 'Skin Clinics', icon: 'hospital' },
    { id: 'skincare_shop', name: 'Skincare Shops', icon: 'shopping-bag' },
  ];

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (location) {
      findNearestPlaces();
    }
  }, [location, selectedCategory]);

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
  };

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setError('Permission to access location was denied');
        setLoading(false);
        Alert.alert(
          'Location Permission Required',
          'Please enable location services to find nearby dermatology services.'
        );
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
      setError('Error getting location: ' + error.message);
      setLoading(false);
    }
  };

  const findNearestPlaces = () => {
    if (!location) return;

    setLoading(true);
    try {
      const userLat = location.latitude;
      const userLon = location.longitude;
      
      // Filter places by category and calculate distances
      const placesWithDistance = DERMATOLOGY_CLINICS
        .filter(clinic => clinic.type === selectedCategory)
        .map(clinic => {
          const distance = calculateDistance(
            userLat, 
            userLon, 
            clinic.latitude, 
            clinic.longitude
          );
          return {
            ...clinic,
            distance: distance,
            displayDistance: distance < 1 
              ? `${(distance * 1000).toFixed(0)} m` 
              : `${distance.toFixed(1)} km`
          };
        })
        .filter(clinic => clinic.distance <= 50) // Within 50km radius
        .sort((a, b) => a.distance - b.distance); // Sort by distance

      setPlaces(placesWithDistance);
    } catch (error) {
      setError('Error finding nearby places: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (type) => {
    const iconConfig = {
      dermatologist: { name: 'user-md', color: '#FF6B6B' },
      skin_clinic: { name: 'hospital', color: '#4ECDC4' },
      skincare_shop: { name: 'shopping-bag', color: '#45B7D1' },
    };
    
    return iconConfig[type] || { name: 'map-marker-alt', color: '#666' };
  };

  const handleCall = (phoneNumber) => {
    const url = `tel:${phoneNumber}`;
    Linking.openURL(url).catch(err => 
      Alert.alert('Error', 'Could not make a call')
    );
  };

  const openMaps = (place) => {
    // Open Google Maps with exact coordinates for navigation
    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}&travelmode=driving`;
    Linking.openURL(url).catch(err => 
      Alert.alert('Error', 'Could not open maps app')
    );
  };

  const openWebsite = (website) => {
    if (website && !website.startsWith('http')) {
      website = 'https://' + website;
    }
    if (website) {
      Linking.openURL(website).catch(err => 
        Alert.alert('Error', 'Could not open website')
      );
    }
  };

  const handleViewMap = () => {
    // Pass the necessary data to MiniMap screen
    navigation.navigate('MiniMap', {
      userLocation: location,
      places: places,
      selectedCategory: selectedCategory
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7A8B7F" />
        <Text style={styles.loadingText}>Finding nearest dermatology services...</Text>
        <Text style={styles.loadingSubtext}>Searching within 50km radius</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={64} color="#FF6B6B" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={getCurrentLocation}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Find Dermatology Services</Text>
          <TouchableOpacity 
            style={styles.viewMapButton}
            onPress={handleViewMap}
          >
            <FontAwesome5 name="map" size={16} color="#FFF" />
            <Text style={styles.viewMapButtonText}>View Map</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>Within 50km of your location</Text>
      </View>

      {/* Category Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
        contentContainerStyle={styles.categoryContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              selectedCategory === category.id && styles.categoryButtonSelected,
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <FontAwesome5
              name={category.icon}
              size={16}
              color={selectedCategory === category.id ? '#FFF' : '#7A8B7F'}
            />
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category.id && styles.categoryTextSelected,
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Location Info */}
      <View style={styles.locationInfo}>
        <Icon name="my-location" size={18} color="#7A8B7F" />
        <Text style={styles.locationText}>
          {places.length} {selectedCategory.replace('_', ' ')} found within 50km
        </Text>
      </View>

      {/* Places List */}
      <ScrollView 
        style={styles.placesContainer}
        showsVerticalScrollIndicator={false}
      >
        {places.map((place) => {
          const icon = getCategoryIcon(place.type);
          return (
            <View key={place.id} style={styles.placeCard}>
              <View style={styles.placeHeader}>
                <View style={[styles.placeIconContainer, { backgroundColor: icon.color }]}>
                  <FontAwesome5 
                    name={icon.name} 
                    size={14} 
                    color="#FFF" 
                  />
                </View>
                <View style={styles.placeInfo}>
                  <View style={styles.nameContainer}>
                    <Text style={styles.placeName}>{place.name}</Text>
                    <View style={styles.verifiedBadge}>
                      <FontAwesome5 name="check-circle" size={12} color="#7A8B7F" />
                    </View>
                  </View>
                  <View style={styles.ratingContainer}>
                    <FontAwesome5 name="star" size={12} color="#FFD700" />
                    <Text style={styles.rating}>{place.rating}</Text>
                    <Text style={styles.distance}>{place.displayDistance} away</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.placeDetails}>
                <View style={styles.areaContainer}>
                  <FontAwesome5 name="map-marker-alt" size={12} color="#7A8B7F" />
                  <Text style={styles.placeArea}>{place.area}</Text>
                </View>
                
                <View style={styles.hoursContainer}>
                  <FontAwesome5 name="clock" size={12} color="#7A8B7F" />
                  <Text style={styles.placeHours}>{place.hours}</Text>
                </View>

                {place.website && (
                  <TouchableOpacity 
                    style={styles.websiteContainer}
                    onPress={() => openWebsite(place.website)}
                  >
                    <FontAwesome5 name="globe" size={12} color="#7A8B7F" />
                    <Text style={styles.websiteText}>Visit Website</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.placeActions}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleCall(place.phone)}
                >
                  <FontAwesome5 name="phone" size={14} color="#7A8B7F" />
                  <Text style={styles.actionText}>Call</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.directionsButton]}
                  onPress={() => openMaps(place)}
                >
                  <FontAwesome5 name="directions" size={14} color="#7A8B7F" />
                  <Text style={styles.actionText}>Navigate</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
        
        {places.length === 0 && (
          <View style={styles.noResults}>
            <Icon name="location-off" size={48} color="#E5DDD5" />
            <Text style={styles.noResultsText}>
              No {selectedCategory.replace('_', ' ')} found within 50km
            </Text>
            <Text style={styles.noResultsSubtext}>
              Try a different category or expand your search area
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Refresh Button */}
      <TouchableOpacity style={styles.refreshButton} onPress={findNearestPlaces}>
        <Icon name="refresh" size={24} color="#7A8B7F" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F7F5",
    paddingTop: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#F9F7F5",
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7A8B7F',
    textAlign: 'center',
    fontFamily: 'System',
    fontWeight: '500',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#8B8B8B',
    textAlign: 'center',
    fontFamily: 'System',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#F9F7F5",
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'System',
  },
  retryButton: {
    backgroundColor: '#7A8B7F',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5DDD5',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2C2C2C',
    fontFamily: 'System',
    flex: 1,
  },
  viewMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7A8B7F',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginLeft: 12,
  },
  viewMapButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
    fontFamily: 'System',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#7A8B7F',
    fontFamily: 'System',
  },
  categoryContainer: {
    backgroundColor: '#FEFDFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5DDD5',
  },
  categoryContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F7F5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: '#E5DDD5',
    minWidth: 120,
  },
  categoryButtonSelected: {
    backgroundColor: '#7A8B7F',
    borderColor: '#7A8B7F',
  },
  categoryText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#7A8B7F',
    fontFamily: 'System',
  },
  categoryTextSelected: {
    color: '#FFF',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FEFDFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5DDD5',
  },
  locationText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#7A8B7F',
    fontWeight: '500',
    fontFamily: 'System',
  },
  placesContainer: {
    flex: 1,
    padding: 16,
  },
  placeCard: {
    backgroundColor: '#FEFDFB',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#E5DDD5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  placeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  placeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  placeInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  placeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2C',
    fontFamily: 'System',
    flex: 1,
  },
  verifiedBadge: {
    marginLeft: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#2C2C2C',
    fontFamily: 'System',
  },
  distance: {
    marginLeft: 12,
    fontSize: 14,
    color: '#7A8B7F',
    fontWeight: '500',
    fontFamily: 'System',
  },
  placeDetails: {
    marginBottom: 16,
  },
  areaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  placeArea: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    fontFamily: 'System',
    fontWeight: '500',
  },
  hoursContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  placeHours: {
    marginLeft: 8,
    fontSize: 14,
    color: '#7A8B7F',
    fontFamily: 'System',
  },
  websiteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  websiteText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#45B7D1',
    fontWeight: '500',
    fontFamily: 'System',
    textDecorationLine: 'underline',
  },
  placeActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F9F7F5',
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: '#E5DDD5',
    flex: 0.48,
    justifyContent: 'center',
  },
  directionsButton: {
    backgroundColor: '#FEFDFB',
  },
  actionText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#7A8B7F',
    fontWeight: '500',
    fontFamily: 'System',
  },
  noResults: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noResultsText: {
    fontSize: 18,
    color: '#2C2C2C',
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'System',
    textAlign: 'center',
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#7A8B7F',
    textAlign: 'center',
    fontFamily: 'System',
  },
  refreshButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEFDFB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: '#E5DDD5',
  },
});

export default MapScreen;