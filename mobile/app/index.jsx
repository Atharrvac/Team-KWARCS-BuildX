import { Redirect } from 'expo-router';

export default function Index() {
  // This will redirect to the appropriate screen based on auth state
  // The _layout.jsx handles the actual routing logic
  return <Redirect href="/language-selection" />;
}
