import { Text } from '@react-navigation/elements';
import { StyleSheet, View } from 'react-native';

export default function TesteScreen() {
  return (
    <View style={styles.container}>
      <Text>Aba de funcionários</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

