import { Home, Map, Heart, AlertTriangle, User } from "lucide-react-native"

export type TabParamList = {
  Home: undefined
  Map: undefined
  Donations: undefined
  Emergency: undefined
  Profile: undefined
}

export const tabScreens = [
  {
    name: "Home",
    component: "HomeScreen",
    icon: Home,
  },
  {
    name: "Map",
    component: "MapScreen",
    icon: Map,
  },
  {
    name: "Donations",
    component: "DonationsScreen",
    icon: Heart,
  },
  {
    name: "Emergency",
    component: "EmergencyScreen",
    icon: AlertTriangle,
  },
  {
    name: "Profile",
    component: "ProfileScreen",
    icon: User,
  },
]

