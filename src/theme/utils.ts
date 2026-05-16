import { Dimensions, PixelRatio } from 'react-native';

const guidelineBaseWidth = 390; // iPhone 14 width baseline
const { width: screenWidth } = Dimensions.get('window');

export const scale = (size: number) =>
  Math.round(PixelRatio.roundToNearestPixel((screenWidth / guidelineBaseWidth) * size));

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

