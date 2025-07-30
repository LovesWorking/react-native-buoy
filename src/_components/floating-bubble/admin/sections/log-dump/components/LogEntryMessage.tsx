import { StyleSheet, Text } from 'react-native';

interface LogEntryMessageProps {
  message: string | Error;
}

export const LogEntryMessage = ({ message }: LogEntryMessageProps) => {
  return (
    <Text style={styles.message} numberOfLines={3}>
      {String(message)}
    </Text>
  );
};

const styles = StyleSheet.create({
  message: {
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
  },
});
