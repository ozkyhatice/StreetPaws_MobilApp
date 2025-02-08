import type React from "react"
import { createStackNavigator } from "@react-navigation/stack"
import LoginScreen from "../screens/LoginScreen"
import RegisterScreen from "../screens/RegisterScreen"
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen"
import BottomTabNavigator from "./BottomTabNavigator"
import HomeScreen from "../screens/HomeScreen"
import ProfileScreen from "../screens/ProfileScreen"
import TasksScreen from "../screens/TasksScreen"
import TaskDetailScreen from "../screens/TaskDetailScreen"
import NotificationsScreen from "../screens/NotificationsScreen"
import SettingsScreen from "../screens/SettingsScreen"
import AddEmergencyScreen from "../screens/AddEmergencyScreen"
import EmergencyScreen from "../screens/EmergencyScreen"

export type RootStackParamList = {
  Login: undefined
  Register: undefined
  ForgotPassword: undefined
  Home: undefined
}

const Stack = createStackNavigator<RootStackParamList>()

const StackNavigator: React.FC = () => {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name='Profile' component={ProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Tasks" component={TasksScreen} options={{ headerShown: false }} />
      <Stack.Screen name="TaskDetail" component={TaskDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AddEmergency" component={AddEmergencyScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EmergencyDetail" component={EmergencyScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  )
}

export default StackNavigator

