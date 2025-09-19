declare module "@react-native-clipboard/clipboard" {
  const Clipboard: {
    setString(text: string): Promise<void> | void;
  } & Record<string, unknown>;

  export default Clipboard;
}

declare module "expo-clipboard" {
  const ExpoClipboard: {
    setStringAsync(text: string): Promise<void>;
  } & Record<string, unknown>;

  export default ExpoClipboard;
}
