import { type ReactNode, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

const AnimatedPath = Animated.createAnimatedComponent(Path);

// A half circle, like a gauge, that fills from left to right up to `progress` (0 to 1).
// `children` sit in the middle, under the top of the arc.
// When `progress` changes, the arc slides from the old value to the new one.
export function ProgressArc({
  progress,
  width,
  strokeWidth,
  color,
  trackColor,
  children,
}: {
  progress: number;
  width: number;
  strokeWidth: number;
  color: string;
  trackColor: string;
  children: ReactNode;
}) {
  const radius = (width - strokeWidth) / 2;
  const height = radius + strokeWidth;
  const length = Math.PI * radius;
  // From the left end, over the top, to the right end.
  const path = `M ${strokeWidth / 2} ${height - strokeWidth / 2} A ${radius} ${radius} 0 0 1 ${width - strokeWidth / 2} ${height - strokeWidth / 2}`;
  const animated = useSharedValue(0);

  useEffect(() => {
    animated.set(withTiming(Math.min(Math.max(progress, 0), 1), { duration: 900, easing: Easing.out(Easing.cubic) }));
  }, [animated, progress]);

  // The colored line is drawn as one long dash; moving the dash's start (offset) shows more or less of it.
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: length * (1 - animated.get()),
    // A round line end of length zero would still show a dot, so hide the line when empty.
    strokeOpacity: animated.get() > 0.001 ? 1 : 0,
  }));

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Path d={path} stroke={trackColor} strokeWidth={strokeWidth} strokeLinecap="round" fill="none" />
        <AnimatedPath
          d={path}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={length}
          fill="none"
          animatedProps={animatedProps}
        />
      </Svg>
      <View style={styles.center}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFill,
    justifyContent: "flex-end",
    alignItems: "center",
  },
});
