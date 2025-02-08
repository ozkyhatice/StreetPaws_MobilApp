import type React from "react"
import { View, StyleSheet, TouchableOpacity } from "react-native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { tabScreens, type TabParamList } from "./TabNavigationStructure"

const Tab = createBottomTabNavigator<TabParamList>()

const CustomTabBar: React.FC<{
  state: any
  descriptors: any
  navigation: any
}> = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.tabBar}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key]
        const isFocused = state.index === index

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          })

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name)
          }
        }

        const IconComponent = tabScreens.find((screen) => screen.name === route.name)?.icon

        return (
          <TouchableOpacity key={index} onPress={onPress} style={[styles.tabItem, isFocused && styles.tabItemFocused]}>
            {IconComponent && <IconComponent color={isFocused ? "#FF6B6B" : "#666"} size={24} />}
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const BottomTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      {tabScreens.map((screen) => (
        <Tab.Screen
          key={screen.name}
          name={screen.name}
          getComponent={() => require(`../screens/${screen.component}`).default}
          options={{
            tabBarIcon: ({ color, size }) => {
              const IconComponent = screen.icon
              return <IconComponent color={color} size={size} />
            },
          }}
        />
      ))}
    </Tab.Navigator>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    height: 60,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
  },
  tabItemFocused: {
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    borderRadius: 16,
    margin: 8,
  },
})

export default BottomTabNavigator

