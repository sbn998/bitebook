import { CameraView, useCameraPermissions } from "expo-camera";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { AppState, Linking, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/button";
import { fontSize, fonts, radius, spacing, type Theme } from "@/constants/theme";
import { useStyles } from "@/hooks/use-theme";
import { useTranslation } from "@/i18n";

// The kinds of barcode printed on food packages.
const FOOD_BARCODES: ("ean13" | "ean8" | "upc_a" | "upc_e")[] = ["ean13", "ean8", "upc_a", "upc_e"];

export default function BarcodeScanner() {
  const styles = useStyles(makeStyles);
  const { t } = useTranslation();
  // null while the phone is still checking.
  const [permission, requestPermission, getPermission] = useCameraPermissions();

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
      <CameraView style={styles.camera} barcodeScannerSettings={{ barcodeTypes: FOOD_BARCODES }} />
      <Text style={styles.hint}>{t.scanner.pointCamera}</Text>
    </View>
  );
}

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
  camera: {
    flex: 1,
  },
  // On top of the camera picture, so it has its own background to stay readable on anything.
  hint: {
    position: "absolute",
    bottom: spacing.xxl,
    alignSelf: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    overflow: "hidden",
    backgroundColor: colors.primary,
    color: colors.onPrimary,
    fontFamily: fonts.body,
    fontSize: fontSize.body,
  },
});
