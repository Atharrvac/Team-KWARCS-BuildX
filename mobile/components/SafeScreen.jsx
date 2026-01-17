import { View, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SafeScreen = ({ children }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ paddingTop: insets.top, flex: 1, backgroundColor: '#F8F9FA' }}>
      <StatusBar 
        barStyle="dark-content"
        backgroundColor="#F8F9FA"
      />
      {children}
    </View>
  );
};
export default SafeScreen;
