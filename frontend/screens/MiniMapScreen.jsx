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
  ScrollView,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useRoute, useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

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
  const [showLocationsList, setShowLocationsList] = useState(false);
  const mapRef = useRef();
  const route = useRoute();
  const navigation = useNavigation();

  const { userLocation: passedLocation, places: passedPlaces } = route.params || {};

  useEffect(() => {
    if (passedLocation && passedPlaces) {
      setUserLocation({
        latitude: passedLocation.latitude,
        longitude: passedLocation.longitude,
      });
      setNearbyLocations(passedPlaces);
      setLoading(false);
    } else {
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
          ? `${(distance * 1000).toFixed(0)}m` 
          : `${distance.toFixed(1)}km`
      };
    })
    .filter(location => location.distance <= 50)
    .sort((a, b) => a.distance - b.distance);

    return locationsWithDistance;
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
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
        return COLORS.terracotta;
      case 'skin_clinic':
        return COLORS.slate;
      case 'skincare_shop':
        return COLORS.dustyBlue;
      default:
        return COLORS.charcoal;
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

  const navigateToLocation = (location) => {
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 1000);
      
      setSelectedLocation(location);
      setShowLocationsList(false);
    }
  };

  const handleMapReady = () => {
    setMapReady(true);
    setTimeout(() => {
      fitToMarkers();
    }, 500);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.terracotta} />
        <Text style={styles.loadingText}>Loading locations...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={48} color={COLORS.terracotta} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={getCurrentLocation}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Minimalist Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={COLORS.charcoal} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Map View</Text>
            <View style={styles.headerRight}>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{nearbyLocations.length}</Text>
              </View>
              <TouchableOpacity 
                style={styles.listToggleButton}
                onPress={() => setShowLocationsList(!showLocationsList)}
              >
                <Icon name={showLocationsList ? "map" : "list"} size={22} color={COLORS.charcoal} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Map Container */}
      <View style={styles.mapWrapper}>
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
          showsCompass={false}
          showsScale={false}
        >
          {nearbyLocations.map((location) => (
            <Marker
              key={location.id}
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              onPress={() => handleMarkerPress(location)}
            >
              <View style={[styles.marker, { backgroundColor: getMarkerColor(location.type) }]}>
                <FontAwesome5 
                  name={getMarkerIcon(location.type)} 
                  size={14} 
                  color={COLORS.white} 
                />
              </View>
            </Marker>
          ))}
        </MapView>

        {/* Floating Control Buttons */}
        <View style={styles.floatingControls}>
          <TouchableOpacity style={styles.recenterButton} onPress={fitToMarkers}>
            <Icon name="my-location" size={20} color={COLORS.charcoal} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.listToggleFloating}
            onPress={() => setShowLocationsList(!showLocationsList)}
          >
            <Icon name={showLocationsList ? "map" : "list"} size={20} color={COLORS.charcoal} />
            <Text style={styles.listToggleText}>
              {showLocationsList ? "Map" : "List"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Vertical Locations List - Slides up from bottom */}
      {showLocationsList && (
        <View style={styles.locationsPanel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Nearby Places</Text>
            <TouchableOpacity 
              style={styles.closePanelButton}
              onPress={() => setShowLocationsList(false)}
            >
              <Icon name="close" size={20} color={COLORS.slate} />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            style={styles.locationsList}
            showsVerticalScrollIndicator={false}
          >
            {nearbyLocations.map((location) => (
              <TouchableOpacity
                key={location.id}
                style={[
                  styles.locationCard,
                  selectedLocation?.id === location.id && styles.locationCardActive
                ]}
                onPress={() => navigateToLocation(location)}
              >
                <View style={[styles.cardIcon, { backgroundColor: getMarkerColor(location.type) }]}>
                  <FontAwesome5 
                    name={getMarkerIcon(location.type)} 
                    size={16} 
                    color={COLORS.white} 
                  />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardName} numberOfLines={2}>
                    {location.name}
                  </Text>
                  <View style={styles.cardMeta}>
                    <FontAwesome5 name="star" size={10} color={COLORS.terracotta} />
                    <Text style={styles.cardRating}>{location.rating}</Text>
                    <Text style={styles.cardDot}>•</Text>
                    <Text style={styles.cardDistance}>{location.displayDistance}</Text>
                  </View>
                  <Text style={styles.cardAddress} numberOfLines={1}>
                    {location.address}
                  </Text>
                </View>
                <Icon name="chevron-right" size={18} color={COLORS.dustyBlue} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Selected Location Detail */}
      {selectedLocation && !showLocationsList && (
        <View style={styles.detailCard}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setSelectedLocation(null)}
          >
            <Icon name="close" size={20} color={COLORS.slate} />
          </TouchableOpacity>

          <View style={styles.detailHeader}>
            <View style={[styles.detailIcon, { backgroundColor: getMarkerColor(selectedLocation.type) }]}>
              <FontAwesome5 
                name={getMarkerIcon(selectedLocation.type)} 
                size={20} 
                color={COLORS.white} 
              />
            </View>
            <View style={styles.detailInfo}>
              <Text style={styles.detailName}>{selectedLocation.name}</Text>
              <View style={styles.detailMeta}>
                <FontAwesome5 name="star" size={11} color={COLORS.terracotta} />
                <Text style={styles.detailRating}>{selectedLocation.rating}</Text>
                <Text style={styles.detailDot}>•</Text>
                <Text style={styles.detailType}>{selectedLocation.type.replace('_', ' ')}</Text>
              </View>
            </View>
          </View>

          <View style={styles.detailBody}>
            <View style={styles.infoRow}>
              <FontAwesome5 name="map-marker-alt" size={12} color={COLORS.dustyBlue} />
              <Text style={styles.infoText}>{selectedLocation.address}</Text>
            </View>
            <View style={styles.infoRow}>
              <FontAwesome5 name="clock" size={12} color={COLORS.dustyBlue} />
              <Text style={styles.infoText}>{selectedLocation.hours}</Text>
            </View>
          </View>

          <View style={styles.detailActions}>
            <TouchableOpacity 
              style={styles.actionBtn}
              onPress={() => handleCall(selectedLocation.phone)}
            >
              <FontAwesome5 name="phone" size={16} color={COLORS.white} />
              <Text style={styles.actionBtnText}>Call</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionBtn, styles.actionBtnSecondary]}
              onPress={() => handleDirections(selectedLocation)}
            >
              <FontAwesome5 name="directions" size={16} color={COLORS.slate} />
              <Text style={styles.actionBtnTextSecondary}>Navigate</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Minimalist Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.terracotta }]} />
          <Text style={styles.legendLabel}>Dermatologist</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.slate }]} />
          <Text style={styles.legendLabel}>Clinic</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.dustyBlue }]} />
          <Text style={styles.legendLabel}>Shop</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.sand,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.sand,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: COLORS.slate,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.sand,
    padding: 32,
  },
  errorText: {
    marginTop: 16,
    fontSize: 14,
    color: COLORS.slate,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: COLORS.terracotta,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: COLORS.sand,
  },
  headerLeft: {
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: COLORS.charcoal,
    letterSpacing: -0.5,
  },
  countBadge: {
    backgroundColor: COLORS.terracotta,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  countText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
  },
  listToggleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  mapWrapper: {
    flex: 1,
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
    shadowColor: COLORS.charcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  floatingControls: {
    position: 'absolute',
    top: 12,
    right: 12,
    gap: 8,
  },
  recenterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.charcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  listToggleFloating: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.charcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  listToggleText: {
    fontSize: 9,
    color: COLORS.charcoal,
    fontWeight: '500',
    marginTop: 2,
  },
  // Locations Panel Styles
  locationsPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.6,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: COLORS.charcoal,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    paddingBottom: 20,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.charcoal,
  },
  closePanelButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  locationCardActive: {
    backgroundColor: COLORS.lightGray,
    borderWidth: 1.5,
    borderColor: COLORS.terracotta,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.charcoal,
    marginBottom: 4,
    lineHeight: 20,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  cardRating: {
    fontSize: 12,
    color: COLORS.slate,
    fontWeight: '500',
  },
  cardDot: {
    fontSize: 12,
    color: COLORS.dustyBlue,
  },
  cardDistance: {
    fontSize: 12,
    color: COLORS.slate,
    fontWeight: '500',
  },
  cardAddress: {
    fontSize: 11,
    color: COLORS.dustyBlue,
    marginTop: 2,
  },
  detailCard: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: COLORS.charcoal,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingRight: 32,
  },
  detailIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailInfo: {
    flex: 1,
  },
  detailName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.charcoal,
    marginBottom: 4,
  },
  detailMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailRating: {
    fontSize: 12,
    color: COLORS.slate,
    fontWeight: '600',
  },
  detailDot: {
    fontSize: 12,
    color: COLORS.dustyBlue,
  },
  detailType: {
    fontSize: 12,
    color: COLORS.slate,
    textTransform: 'capitalize',
  },
  detailBody: {
    marginBottom: 16,
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.slate,
    lineHeight: 16,
  },
  detailActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.terracotta,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  actionBtnSecondary: {
    backgroundColor: COLORS.lightGray,
  },
  actionBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  actionBtnTextSecondary: {
    color: COLORS.slate,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  legend: {
    position: 'absolute',
    top: 140,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 10,
    padding: 10,
    gap: 6,
    shadowColor: COLORS.charcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 11,
    color: COLORS.slate,
    fontWeight: '500',
  },
});

export default MiniMapScreen;