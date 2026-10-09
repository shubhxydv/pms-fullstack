// Bottom tab navigator for the signed-in part of the app (Dashboard, Projects, Tasks, Settings).
import { Tabs } from 'expo-router';
import { Text, type ColorValue } from 'react-native';

// Renders an emoji as a tab icon
function TabIcon({ emoji, color }: { emoji: string; color: ColorValue }) {
  return <Text style={{ fontSize: 20, color }}>{emoji}</Text>;
}

// Defines the four main tabs
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTitleStyle: { color: '#0F172A' },
        tabBarActiveTintColor: '#0F172A',
        tabBarInactiveTintColor: '#94A3B8',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <TabIcon emoji="📊" color={color} />,
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: 'Projects',
          headerShown: false,
          tabBarIcon: ({ color }) => <TabIcon emoji="📁" color={color} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'All Tasks',
          tabBarIcon: ({ color }) => <TabIcon emoji="✅" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <TabIcon emoji="⚙️" color={color} />,
        }}
      />
    </Tabs>
  );
}
