import { Text } from '@react-navigation/elements';
import { StyleSheet, View } from 'react-native';

export default function TabTwoScreen() {
  return (
    <View style={styles.container}>
      <Text>Upload</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ff7676',
  },
});

