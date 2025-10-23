import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { PokemonScreen } from "../screens/pokemon/Pokemon";

export default function Index() {
  return (
    <View style={styles.container}>
      <PokemonScreen />
      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
});
