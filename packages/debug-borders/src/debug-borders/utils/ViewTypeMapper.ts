/**
 * ViewTypeMapper
 *
 * Maps native view class names (e.g., "RCTView", "RCTText") to their
 * developer-friendly React Native component names (e.g., "View", "Text").
 *
 * This makes the render tracking UI more understandable since developers
 * work with component names, not native class names.
 *
 * Sources:
 * - React Native core: packages/react-native/Libraries/Components/*
 * - React Native Android: ReactAndroid/src/main/java/com/facebook/react/views/*
 * - FabricNameComponentMapping.kt
 * - Common third-party libraries (react-native-svg, gesture-handler, etc.)
 */

"use strict";

/**
 * Mapping from native view class names to React component names.
 *
 * Format: { "NativeClassName": "ComponentName" }
 */
export const VIEW_TYPE_MAP: Record<string, string> = {
  // ==========================================================================
  // REACT NATIVE CORE - Views
  // ==========================================================================
  RCTView: "View",
  RCTSafeAreaView: "SafeAreaView",
  RCTModalHostView: "Modal",

  // ==========================================================================
  // REACT NATIVE CORE - Text
  // ==========================================================================
  RCTText: "Text",
  RCTRawText: "RawText",
  RCTVirtualText: "VirtualText",
  RCTTextInlineImage: "TextInlineImage",

  // ==========================================================================
  // REACT NATIVE CORE - Images
  // ==========================================================================
  RCTImageView: "Image",
  RCTImage: "Image",

  // ==========================================================================
  // REACT NATIVE CORE - ScrollView
  // ==========================================================================
  RCTScrollView: "ScrollView",
  RCTScrollContentView: "ScrollContentView",
  AndroidHorizontalScrollView: "HorizontalScrollView",
  AndroidHorizontalScrollContentView: "HorizontalScrollContentView",

  // ==========================================================================
  // REACT NATIVE CORE - TextInput
  // ==========================================================================
  RCTSinglelineTextInputView: "TextInput",
  RCTMultilineTextInputView: "TextInput (Multiline)",
  AndroidTextInput: "TextInput",
  RCTInputAccessoryView: "InputAccessoryView",

  // ==========================================================================
  // REACT NATIVE CORE - Lists (FlatList/SectionList internals)
  // ==========================================================================
  RCTRefreshControl: "RefreshControl",
  AndroidSwipeRefreshLayout: "RefreshControl",
  PullToRefreshView: "RefreshControl",

  // ==========================================================================
  // REACT NATIVE CORE - Buttons & Touchables
  // ==========================================================================
  RCTSwitch: "Switch",
  AndroidSwitch: "Switch",
  RCTSlider: "Slider",

  // ==========================================================================
  // REACT NATIVE CORE - Activity Indicators
  // ==========================================================================
  RCTActivityIndicatorView: "ActivityIndicator",
  AndroidProgressBar: "ActivityIndicator",

  // ==========================================================================
  // REACT NATIVE CORE - Android-specific
  // ==========================================================================
  AndroidDrawerLayout: "DrawerLayout",
  VirtualView: "VirtualView",
  VirtualViewExperimental: "VirtualView",

  // ==========================================================================
  // REACT NATIVE CORE - Debugging & Internal
  // ==========================================================================
  DebuggingOverlay: "DebuggingOverlay",
  LayoutConformance: "LayoutConformance",
  UnimplementedNativeView: "UnimplementedView",

  // ==========================================================================
  // REACT NATIVE CORE - Legacy/Deprecated
  // ==========================================================================
  RKShimmeringView: "ShimmeringView",
  RCTTemplateView: "TemplateView",
  RCTAxialGradientView: "AxialGradientView",
  // "RCTVideo": "Video",
  RCTMap: "Map",
  RCTWebView: "WebView",
  RCTKeyframes: "Keyframes",
  RCTImpressionTrackingView: "ImpressionTrackingView",

  // ==========================================================================
  // REACT-NATIVE-SVG
  // ==========================================================================
  RNSVGSvgView: "Svg",
  RNSVGGroup: "G",
  RNSVGPath: "Path",
  RNSVGText: "SvgText",
  RNSVGTSpan: "TSpan",
  RNSVGTextPath: "TextPath",
  RNSVGImage: "SvgImage",
  RNSVGCircle: "Circle",
  RNSVGEllipse: "Ellipse",
  RNSVGLine: "Line",
  RNSVGRect: "Rect",
  RNSVGClipPath: "ClipPath",
  RNSVGDefs: "Defs",
  RNSVGUse: "Use",
  RNSVGSymbol: "Symbol",
  RNSVGPattern: "Pattern",
  RNSVGMask: "Mask",
  RNSVGForeignObject: "ForeignObject",
  RNSVGMarker: "Marker",
  RNSVGLinearGradient: "LinearGradient",
  RNSVGRadialGradient: "RadialGradient",
  RNSVGFilter: "Filter",
  RNSVGFeBlend: "FeBlend",
  RNSVGFeColorMatrix: "FeColorMatrix",
  RNSVGFeComposite: "FeComposite",
  RNSVGFeFlood: "FeFlood",
  RNSVGFeGaussianBlur: "FeGaussianBlur",
  RNSVGFeMerge: "FeMerge",
  RNSVGFeOffset: "FeOffset",
  RNSVGPolygon: "Polygon",
  RNSVGPolyline: "Polyline",
  RNSVGStop: "Stop",

  // ==========================================================================
  // REACT-NATIVE-GESTURE-HANDLER
  // ==========================================================================
  RNGestureHandlerRootView: "GestureHandlerRootView",
  RNGestureHandlerButton: "GestureHandlerButton",

  // ==========================================================================
  // REACT-NATIVE-SAFE-AREA-CONTEXT
  // ==========================================================================
  RNCSafeAreaProvider: "SafeAreaProvider",
  RNCSafeAreaView: "SafeAreaView",

  // ==========================================================================
  // REACT-NATIVE-SCREENS (React Navigation)
  // ==========================================================================
  RNSScreen: "Screen",
  RNSScreenContainer: "ScreenContainer",
  RNSScreenStack: "ScreenStack",
  RNSScreenStackHeaderConfig: "ScreenStackHeaderConfig",
  RNSScreenStackHeaderSubview: "ScreenStackHeaderSubview",
  RNSSearchBar: "SearchBar",
  RNSFullWindowOverlay: "FullWindowOverlay",
  RNSModalScreen: "ModalScreen",

  // ==========================================================================
  // REACT-NATIVE-REANIMATED
  // ==========================================================================
  ReanimatedView: "Animated.View",

  // ==========================================================================
  // EXPO MODULES
  // ==========================================================================
  ExpoView: "ExpoView",
  ExpoBlurView: "BlurView",
  ExpoLinearGradient: "LinearGradient",
  ExpoImage: "ExpoImage",
  ExpoVideoView: "VideoView",
  ExpoCamera: "Camera",
  ExpoBarCodeScannerView: "BarCodeScanner",

  // ==========================================================================
  // REACT-NATIVE-WEBVIEW
  // ==========================================================================
  RNCWebView: "WebView",

  // ==========================================================================
  // REACT-NATIVE-MAPS
  // ==========================================================================
  AIRMap: "MapView",
  AIRMapMarker: "Marker",
  AIRMapPolyline: "Polyline",
  AIRMapPolygon: "Polygon",
  AIRMapCircle: "Circle",
  AIRMapCallout: "Callout",

  // ==========================================================================
  // REACT-NATIVE-VIDEO
  // ==========================================================================
  RCTVideo: "Video",

  // ==========================================================================
  // LOTTIE-REACT-NATIVE
  // ==========================================================================
  LottieAnimationView: "LottieView",

  // ==========================================================================
  // REACT-NATIVE-FAST-IMAGE
  // ==========================================================================
  FastImageView: "FastImage",
};

/**
 * Get the developer-friendly component name for a native view type.
 * Returns the original viewType if no mapping exists.
 *
 * @param viewType - The native view class name (e.g., "RCTView")
 * @returns The component name (e.g., "View")
 */
export function getComponentDisplayName(viewType: string): string {
  return VIEW_TYPE_MAP[viewType] || viewType;
}

/**
 * Get the native view class name for a component name (reverse lookup).
 * Returns null if no mapping exists.
 *
 * @param componentName - The component name (e.g., "View")
 * @returns The native view class name (e.g., "RCTView") or null
 */
export function getNativeViewType(componentName: string): string | null {
  for (const [native, display] of Object.entries(VIEW_TYPE_MAP)) {
    if (display === componentName) {
      return native;
    }
  }
  return null;
}

/**
 * Check if a view type is a known native component.
 *
 * @param viewType - The native view class name
 * @returns true if it's a known component
 */
export function isKnownViewType(viewType: string): boolean {
  return viewType in VIEW_TYPE_MAP;
}

/**
 * Get all known view types (useful for autocomplete/suggestions).
 *
 * @returns Array of all native view class names
 */
export function getAllNativeViewTypes(): string[] {
  return Object.keys(VIEW_TYPE_MAP);
}

/**
 * Get all known component names (useful for autocomplete/suggestions).
 *
 * @returns Array of all component display names
 */
export function getAllComponentNames(): string[] {
  return [...new Set(Object.values(VIEW_TYPE_MAP))];
}

export default {
  VIEW_TYPE_MAP,
  getComponentDisplayName,
  getNativeViewType,
  isKnownViewType,
  getAllNativeViewTypes,
  getAllComponentNames,
};
