import { useCallback, useEffect, useState } from 'react';
import { Dimensions, LayoutChangeEvent } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface ContentMeasurements {
  envLabelWidth: number;
  statusWidth: number;
}

export function useBubbleWidth() {
  const [bubbleWidth, setBubbleWidth] = useState(200);
  const [contentMeasurements, setContentMeasurements] = useState<ContentMeasurements>({
    envLabelWidth: 0,
    statusWidth: 0,
  });

  const calculateTotalWidth = useCallback(() => {
    const handleWidth = 24;
    const wifiWidth = 24;
    const dividerWidth = 1;
    const horizontalPadding = 8;
    const dividerMargin = 8 * 2;
    const minContentWidth = Math.max(contentMeasurements.envLabelWidth, contentMeasurements.statusWidth);

    const numDividers = 2;
    const totalWidth =
      handleWidth + minContentWidth + (dividerWidth + dividerMargin) * numDividers + wifiWidth + horizontalPadding * 2;

    const minWidth = 200;
    const maxWidth = screenWidth - 32;

    return Math.min(Math.max(totalWidth, minWidth), maxWidth);
  }, [contentMeasurements]);

  useEffect(() => {
    const newWidth = calculateTotalWidth();
    if (newWidth !== bubbleWidth) {
      setBubbleWidth(newWidth);
    }
  }, [contentMeasurements, bubbleWidth, calculateTotalWidth]);

  const handleEnvLabelLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0 && width !== contentMeasurements.envLabelWidth) {
      setContentMeasurements((prev) => ({ ...prev, envLabelWidth: width }));
    }
  };

  const handleStatusLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0 && width !== contentMeasurements.statusWidth) {
      setContentMeasurements((prev) => ({ ...prev, statusWidth: width }));
    }
  };

  return {
    bubbleWidth,
    handleEnvLabelLayout,
    handleStatusLayout,
  };
}
