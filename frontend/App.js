import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import HomeScreen from "./screens/HomeScreen";
import UpdateProfileScreen from "./screens/UpdateProfileScreen";
import SkincareScreen from "./screens/SkincareScreen";
import HistoryScreen from "./screens/HIstoryScreen";
import MapScreen from "./screens/MapScreen";
import MiniMapScreen from "./screens/MiniMapScreen";
import TipsScreen from "./screens/TipsScreen";
import AboutusScreen from "./screens/AboutusScreen";
import InstructionScreen from "./screens/InstructionScreen";
import PrivacyScreen from "./screens/PrivacyScreen";

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Profile" component={UpdateProfileScreen} />
        <Stack.Screen name="Skincare" component={SkincareScreen} />
        <Stack.Screen name="History" component={HistoryScreen} />
        <Stack.Screen name="Map" component={MapScreen} />
        <Stack.Screen name="MiniMap" component={MiniMapScreen} />
        <Stack.Screen name="Tips" component={TipsScreen} />
        <Stack.Screen name="Aboutus" component={AboutusScreen} />
        <Stack.Screen name="Help" component={InstructionScreen} />
        <Stack.Screen name="Privacy" component={PrivacyScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
