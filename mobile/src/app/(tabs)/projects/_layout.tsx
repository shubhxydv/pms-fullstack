// Stack navigator for the projects list and project detail screens.
import { Stack } from 'expo-router';

// Registers the projects list and detail routes
export default function ProjectsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Projects' }} />
      <Stack.Screen name="[id]" options={{ title: 'Project' }} />
    </Stack>
  );
}
