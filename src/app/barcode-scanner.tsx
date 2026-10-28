import { CameraView, useCameraPermissions } from "expo-camera";
import { router, Stack } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { AppState, Linking, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { Button } from "@/components/button";
import { Icon } from "@/components/icon";
import { fontSize, fonts, radius, spacing, type Theme } from "@/constants/theme";
import { useStyles, useTheme } from "@/hooks/use-theme";
import { useTranslation } from "@/i18n";

// The kinds of barcode printed on food packages.
const FOOD_BARCODES: ("ean13" | "ean8" | "upc_a" | "upc_e")[] = ["ean13", "ean8", "upc_a", "upc_e"];

export default function BarcodeScanner() {
  const styles = useStyles(makeStyles);
  const { colors } = useTheme();
  const { t } = useTranslation();
  // null while the phone is still checking.
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const [flashOn, setFlashOn] = useState(false);
  // The camera reports the same barcode many times a second: only the first one counts.
  const done = useRef(false);
  // A wide frame, the shape of a barcode.
  const frameWidth = useWindowDimensions().width * 0.8;

  // The first time, ask straight away: opening the scanner is the user asking to scan.
  useEffect(() => {
    if (permission?.status === "undetermined") requestPermission();
  }, [permission?.status, requestPermission]);

  // Coming back from the phone's settings, check again in case the camera was turned on there.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") getPermission();
    });
    return () => subscription.remove();
  }, [getPermission]);

  // Goes back to the Add food form with the barcode, which fills in the food from it.
  function finish(barcode: string) {
    if (done.current) return;
    done.current = true;
    // `scan` makes every scan new to the form, even of the same barcode twice in a row.
    router.dismissTo({ pathname: "/food-form", params: { barcode, scan: String(Date.now()) } });
  }

  const title = <Stack.Screen options={{ title: t.scanner.title }} />;

  // Nothing to show while checking, or while the phone's own permission popup is open.
  if (!permission || permission.status === "undetermined") {
    return <View style={styles.screen}>{title}</View>;
  }

  // Refused: ask again if the phone still allows it, otherwise only the phone's settings can turn it on.
  if (!permission.granted) {
    return (
      <View style={[styles.screen, styles.centered]}>
        {title}
        <Text style={styles.message}>{permission.canAskAgain ? t.scanner.needsCamera : t.scanner.cameraOff}</Text>
        {permission.canAskAgain ? (
          <Button title={t.scanner.allowCamera} onPress={requestPermission} />
        ) : (
          <Button title={t.scanner.openSettings} onPress={() => Linking.openSettings()} />
        )}
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {title}
      <CameraView
        style={StyleSheet.absoluteFill}
        enableTorch={flashOn}
        barcodeScannerSettings={{ barcodeTypes: FOOD_BARCODES }}
        onBarcodeScanned={({ data }) => finish(data)}
      />

      {/* Everything but the frame is dimmed, so it's clear where the barcode goes. */}
      <View style={styles.dim} />
      <View style={styles.frameRow}>
        <View style={styles.dim} />
        <View style={{ width: frameWidth, height: frameWidth * 0.55 }}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
        <View style={styles.dim} />
      </View>
      <View style={[styles.dim, styles.below]}>
        <Text style={styles.hint}>{t.scanner.pointCamera}</Text>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.flashButton, flashOn && styles.flashButtonOn, pressed && styles.pressed]}
          onPress={() => setFlashOn(!flashOn)}
          accessibilityLabel={flashOn ? t.scanner.flashOff : t.scanner.flashOn}
        >
          <Icon name={flashOn ? "flashOn" : "flashOff"} size={24} color={flashOn ? colors.onPrimary : colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

const CORNER_SIZE = 28;
const CORNER_WIDTH = 4;

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.lg,
  },
  message: {
    fontFamily: fonts.body,
    fontSize: fontSize.medium,
    color: colors.text,
    textAlign: "center",
  },
  dim: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  frameRow: {
    flexDirection: "row",
  },
  // Orange corner marks around the frame, rounded like the app's cards.
  corner: {
    position: "absolute",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: colors.primary,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderTopLeftRadius: radius.input,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderTopRightRadius: radius.input,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderBottomLeftRadius: radius.input,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderBottomRightRadius: radius.input,
  },
  below: {
    alignItems: "center",
    paddingTop: spacing.lg,
    gap: spacing.xl,
  },
  // On top of the camera picture, so it has its own background to stay readable on anything.
  hint: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    overflow: "hidden",
    backgroundColor: colors.primary,
    color: colors.onPrimary,
    fontFamily: fonts.body,
    fontSize: fontSize.body,
  },
  // A round button, as in camera apps: plain while the flash is off, orange while it's on.
  flashButton: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  flashButtonOn: {
    backgroundColor: colors.primary,
  },
  pressed: {
    opacity: 0.7,
  },
});
