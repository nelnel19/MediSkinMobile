import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Dimensions,
  ScrollView, // Add this import
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useRoute } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

// Real dermatology locations in Taguig/Manila area
const REAL_DERMATOLOGY_LOCATIONS = [
  {
    id: '1',
    name: 'Skin Dermatology & Laser Center',
    type: 'dermatologist',
    latitude: 14.5533,
    longitude: 121.0508,
    address: 'Bonifacio High Street, BGC, Taguig',
    phone: '+63-2-8403-8000',
    hours: 'Mon-Sat: 9AM-7PM',
    rating: 4.6,
  },
  {
    id: '2',
    name: 'The Aivee Clinic - Fort BGC',
    type: 'skin_clinic',
    latitude: 14.5522,
    longitude: 121.0485,
    address: 'Forbestown Center, Burgos Circle, Bonifacio Global City, Taguig',
    phone: '+63-917-537-1801',
    hours: 'Mon-Sat: 9AM-8PM',
    rating: 4.8,
  },
  {
    id: '3',
    name: 'St. Lukes Medical Center - Dermatology',
    type: 'dermatologist',
    latitude: 14.5584,
    longitude: 121.0542,
    address: 'Rizal Drive cor. 32nd St. & 5th Ave., Global City, Taguig',
    phone: '+63-2-8789-7700',
    hours: '24/7 Emergency, Clinic: Mon-Fri 8AM-5PM',
    rating: 4.8,
  },
  {
    id: '4',
    name: 'Avignon Clinic',
    type: 'skin_clinic',
    latitude: 14.5528,
    longitude: 121.0492,
    address: 'Fort Victoria, 5th Ave & 23rd St., BGC, Taguig',
    phone: '+63-917-809-2399',
    hours: 'Mon-Fri: 8AM-6PM',
    rating: 4.5,
  },
  {
    id: '5',
    name: 'Luminisce BGC',
    type: 'skin_clinic',
    latitude: 14.5541,
    longitude: 121.0515,
    address: 'Mercury Drug Building, 32nd St. corner 4th Ave., Fort Bonifacio, Taguig',
    phone: '+63-977-804-4601',
    hours: 'Tue-Sat: 10AM-8PM',
    rating: 4.4,
  },
  {
    id: '6',
    name: 'Teviant Beauty',
    type: 'skincare_shop',
    latitude: 14.5489,
    longitude: 121.0528,
    address: 'Upper Ground Floor, SM Aura Premier, McKinley Parkway, Taguig',
    phone: '+63-917-626-9979',
    hours: 'Daily: 10AM-9PM',
    rating: 4.5,
  },
  {
    id: '7',
    name: 'Skin Potions - Market Market',
    type: 'skincare_shop',
    latitude: 14.5482,
    longitude: 121.0531,
    address: 'Lower Ground Floor, Market Market, Taguig',
    phone: '+63-917-626-9979',
    hours: 'Daily: 10AM-9PM',
    rating: 4.4,
  },
  {
    id: '8',
    name: 'Medical Center Taguig - Dermatology',
    type: 'dermatologist',
    latitude: 14.5189,
    longitude: 121.0678,
    address: 'Levi Mariano Avenue, Ususan, Taguig City',
    phone: '+63-2-8888-6284',
    hours: '24/7 Emergency, Clinic: Mon-Fri 8AM-5PM',
    rating: 4.3,
  },
  {
    id: '9',
    name: 'The Face Shop - BGC Mall',
    type: 'skincare_shop',
    latitude: 14.5538,
    longitude: 121.0512,
    address: 'BGC Mall, Bonifacio Global City, Taguig',
    phone: '+63-917-626-9979',
    hours: 'Daily: 10AM-9PM',
    rating: 4.4,
  },
  {
    id: '10',
    name: 'Wunderskin Aesthetic Medicine & Laser Clinic',
    type: 'skin_clinic',
    latitude: 14.5535,
    longitude: 121.0510,
    address: 'BGC Area, Taguig City',
    phone: '+63-917-626-9979',
    hours: 'Mon-Sat: 9AM-7PM',
    rating: 4.3,
  },
];

const MiniMapScreen = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyLocations, setNearbyLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef();
  const route = useRoute();

  // Get data passed from previous screen
  const { userLocation: passedLocation, places: passedPlaces } = route.params || {};

  useEffect(() => {
    if (passedLocation && passedPlaces) {
      // Use data passed from previous screen
      setUserLocation({
        latitude: passedLocation.latitude,
        longitude: passedLocation.longitude,
      });
      setNearbyLocations(passedPlaces);
      setLoading(false);
    } else {
      // Fallback: get location and find real places
      getCurrentLocation();
    }
  }, [passedLocation, passedPlaces]);

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setError('Permission to access location was denied');
        setLoading(false);
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const userLoc = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };

      setUserLocation(userLoc);
      
      // Find real locations near user
      const nearbyRealLocations = findNearbyRealLocations(
        userLoc.latitude,
        userLoc.longitude
      );
      setNearbyLocations(nearbyRealLocations);
      setLoading(false);

    } catch (error) {
      setError('Error getting location: ' + error.message);
      setLoading(false);
    }
  };

  // Find real locations within 50km radius
  const findNearbyRealLocations = (userLat, userLng) => {
    const locationsWithDistance = REAL_DERMATOLOGY_LOCATIONS.map(location => {
      const distance = calculateDistance(
        userLat,
        userLng,
        location.latitude,
        location.longitude
      );
      return {
        ...location,
        distance: distance,
        displayDistance: distance < 1 
          ? `${(distance * 1000).toFixed(0)} m` 
          : `${distance.toFixed(1)} km`
      };
    })
    .filter(location => location.distance <= 50) // Within 50km radius
    .sort((a, b) => a.distance - b.distance); // Sort by distance

    return locationsWithDistance;
  };

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

  const getMarkerColor = (type) => {
    switch (type) {
      case 'dermatologist':
        return '#FF6B6B';
      case 'skin_clinic':
        return '#4ECDC4';
      case 'skincare_shop':
        return '#45B7D1';
      default:
        return '#7A8B7F';
    }
  };

  const getMarkerIcon = (type) => {
    switch (type) {
      case 'dermatologist':
        return 'user-md';
      case 'skin_clinic':
        return 'hospital';
      case 'skincare_shop':
        return 'shopping-bag';
      default:
        return 'map-marker-alt';
    }
  };

  const handleMarkerPress = (location) => {
    setSelectedLocation(location);
    // Center map on selected location
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  const handleCall = (phoneNumber) => {
    const url = `tel:${phoneNumber}`;
    Linking.openURL(url).catch(err => 
      Alert.alert('Error', 'Could not make a call')
    );
  };

  const handleDirections = (location) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}&travelmode=driving`;
    Linking.openURL(url).catch(err => 
      Alert.alert('Error', 'Could not open maps app')
    );
  };

  const fitToMarkers = () => {
    if (mapRef.current && userLocation && nearbyLocations.length > 0) {
      const coordinates = [
        userLocation,
        ...nearbyLocations.map(loc => ({
          latitude: loc.latitude,
          longitude: loc.longitude
        }))
      ];
      
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 100, right: 50, bottom: 150, left: 50 },
        animated: true,
      });
    }
  };

  const handleOpenInMaps = () => {
    if (userLocation) {
      const url = `https://www.openstreetmap.org/#map=13/${userLocation.latitude}/${userLocation.longitude}`;
      Linking.openURL(url).catch(err => 
        Alert.alert('Error', 'Could not open maps app')
      );
    }
  };

  const navigateToLocation = (location) => {
    if (mapRef.current) {
      // Animate to the specific location
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.005, // Zoom in closer
        longitudeDelta: 0.005,
      }, 1000);
      
      setSelectedLocation(location);
    }
  };

  const handleMapReady = () => {
    setMapReady(true);
    // Small delay to ensure map is fully ready
    setTimeout(() => {
      fitToMarkers();
    }, 500);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7A8B7F" />
        <Text style={styles.loadingText}>Loading map and locations...</Text>
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
        <Text style={styles.headerTitle}>Dermatology Services Map</Text>
        <Text style={styles.headerSubtitle}>
          {nearbyLocations.length} locations found near you
        </Text>
      </View>

      {/* Locations List */}
      <View style={styles.locationsList}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {nearbyLocations.map((location) => (
            <TouchableOpacity
              key={location.id}
              style={styles.locationChip}
              onPress={() => navigateToLocation(location)}
            >
              <View style={[styles.chipIcon, { backgroundColor: getMarkerColor(location.type) }]}>
                <FontAwesome5 
                  name={getMarkerIcon(location.type)} 
                  size={12} 
                  color="#FFF" 
                />
              </View>
              <Text style={styles.chipText} numberOfLines={1}>
                {location.name}
              </Text>
              <Text style={styles.chipDistance}>
                {location.displayDistance}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Embedded Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
          onMapReady={handleMapReady}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={true}
          showsScale={true}
        >
          {/* Nearby Locations Markers */}
          {nearbyLocations.map((location) => (
            <Marker
              key={location.id}
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              onPress={() => handleMarkerPress(location)}
            >
              <View style={[styles.markerContainer, { backgroundColor: getMarkerColor(location.type) }]}>
                <FontAwesome5 
                  name={getMarkerIcon(location.type)} 
                  size={12} 
                  color="#FFF" 
                />
              </View>
            </Marker>
          ))}
        </MapView>
      </View>

      {/* Selected Location Info */}
      {selectedLocation && (
        <View style={styles.selectedLocationCard}>
          <View style={styles.selectedLocationHeader}>
            <View style={[styles.locationIcon, { backgroundColor: getMarkerColor(selectedLocation.type) }]}>
              <FontAwesome5 
                name={getMarkerIcon(selectedLocation.type)} 
                size={16} 
                color="#FFF" 
              />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationName}>{selectedLocation.name}</Text>
              <View style={styles.ratingContainer}>
                <FontAwesome5 name="star" size={12} color="#FFD700" />
                <Text style={styles.rating}>{selectedLocation.rating}</Text>
                <Text style={styles.locationType}>{selectedLocation.type.replace('_', ' ')}</Text>
                <Text style={styles.distance}>{selectedLocation.displayDistance}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setSelectedLocation(null)}>
              <Icon name="close" size={24} color="#7A8B7F" />
            </TouchableOpacity>
          </View>

          <View style={styles.locationDetails}>
            <View style={styles.detailRow}>
              <FontAwesome5 name="map-marker-alt" size={12} color="#7A8B7F" />
              <Text style={styles.detailText}>{selectedLocation.address}</Text>
            </View>
            <View style={styles.detailRow}>
              <FontAwesome5 name="clock" size={12} color="#7A8B7F" />
              <Text style={styles.detailText}>{selectedLocation.hours}</Text>
            </View>
            <View style={styles.detailRow}>
              <FontAwesome5 name="phone" size={12} color="#7A8B7F" />
              <Text style={styles.detailText}>{selectedLocation.phone}</Text>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleCall(selectedLocation.phone)}
            >
              <FontAwesome5 name="phone" size={14} color="#7A8B7F" />
              <Text style={styles.actionText}>Call</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.directionsButton]}
              onPress={() => handleDirections(selectedLocation)}
            >
              <FontAwesome5 name="directions" size={14} color="#7A8B7F" />
              <Text style={styles.actionText}>Navigate</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Legend</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FF6B6B' }]} />
            <Text style={styles.legendText}>Dermatologists</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#4ECDC4' }]} />
            <Text style={styles.legendText}>Skin Clinics</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#45B7D1' }]} />
            <Text style={styles.legendText}>Skincare Shops</Text>
          </View>
        </View>
      </View>

      {/* Control Buttons */}
      <View style={styles.controlButtons}>
        <TouchableOpacity style={styles.fitButton} onPress={fitToMarkers}>
          <Icon name="my-location" size={20} color="#7A8B7F" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.externalMapButton} onPress={handleOpenInMaps}>
          <FontAwesome5 name="external-link-alt" size={16} color="#7A8B7F" />
        </TouchableOpacity>
      </View>
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7A8B7F',
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
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5DDD5',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 4,
    fontFamily: 'System',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#7A8B7F',
    fontFamily: 'System',
  },
  locationsList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FEFDFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5DDD5',
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F7F5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5DDD5',
    minWidth: 120,
  },
  chipIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2C2C2C',
    fontFamily: 'System',
    flex: 1,
    marginRight: 4,
  },
  chipDistance: {
    fontSize: 10,
    color: '#7A8B7F',
    fontWeight: '500',
    fontFamily: 'System',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  markerContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  selectedLocationCard: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#FEFDFB',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#E5DDD5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  selectedLocationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2C',
    fontFamily: 'System',
    marginBottom: 4,
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
  locationType: {
    marginLeft: 12,
    fontSize: 14,
    color: '#7A8B7F',
    fontWeight: '500',
    fontFamily: 'System',
    textTransform: 'capitalize',
  },
  distance: {
    marginLeft: 12,
    fontSize: 14,
    color: '#7A8B7F',
    fontWeight: '500',
    fontFamily: 'System',
  },
  locationDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    fontFamily: 'System',
    fontWeight: '500',
    flex: 1,
  },
  actionButtons: {
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
  legend: {
    position: 'absolute',
    top: 180,
    left: 20,
    backgroundColor: 'rgba(254, 253, 251, 0.95)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5DDD5',
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 8,
    fontFamily: 'System',
  },
  legendItems: {
    gap: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 10,
    color: '#666',
    fontFamily: 'System',
  },
  controlButtons: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    gap: 12,
  },
  fitButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
  externalMapButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
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

export default MiniMapScreen;