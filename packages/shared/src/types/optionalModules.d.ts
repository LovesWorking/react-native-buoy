declare module "@react-native-clipboard/clipboard" {
  const Clipboard: {
    setString(text: string): Promise<void> | void;
    getString(): Promise<string>;
  } & Record<string, unknown>;

  export default Clipboard;
}

declare module "expo-clipboard" {
  export function setStringAsync(text: string): Promise<void>;
  export function getStringAsync(): Promise<string>;

  // Also support default import pattern
  const ExpoClipboard: {
    setStringAsync(text: string): Promise<void>;
    getStringAsync(): Promise<string>;
  } & Record<string, unknown>;

  export default ExpoClipboard;
}
