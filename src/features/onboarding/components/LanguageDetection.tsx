import { View, Text, StyleSheet } from 'react-native';
import React from 'react';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

const LanguageDetection: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text>Language Detection</Text>
    </View>
  );
};

export default LanguageDetection;
