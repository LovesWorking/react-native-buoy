import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  ViewProps,
} from 'react-native';

export interface CardProps extends ViewProps {
  children: React.ReactNode;
  padding?: number;
  margin?: number;
  borderRadius?: number;
  backgroundColor?: string;
  shadow?: boolean;
}

export function Card({
  children,
  padding = 16,
  margin = 0,
  borderRadius = 12,
  backgroundColor = '#FFFFFF',
  shadow = true,
  style,
  ...props
}: CardProps) {
  const cardStyles: ViewStyle[] = [
    styles.card,
    {
      padding,
      margin,
      borderRadius,
      backgroundColor,
    },
    ...(shadow ? [styles.shadow] : []),
    ...(style ? [style as ViewStyle] : []),
  ];

  return (
    <View style={cardStyles} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});