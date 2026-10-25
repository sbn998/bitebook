import type { ReactNode } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { Button, buttonRowStyles } from "@/components/button";
import { Card } from "@/components/card";
import { fontSize, fonts, spacing, type Theme } from "@/constants/theme";
import { useStyles } from "@/hooks/use-theme";
import { useTranslation } from "@/i18n";

// A small popup card in the middle of the screen, over a dimmed background.
export function Dialog({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const styles = useStyles(makeStyles);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Moves the dialog up when the keyboard opens, so its buttons stay visible. */}
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        {/* Tapping outside the dialog closes it. */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Card style={styles.dialog}>
          <Text style={styles.title}>{title}</Text>
          {children}
        </Card>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// The inside of a "Are you sure?" dialog: a message, a red confirm button and Cancel.
// Separate from ConfirmDialog so an already open dialog can switch to it.
export function ConfirmBody({
  message,
  confirmTitle,
  onConfirm,
  onCancel,
}: {
  message: string;
  confirmTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const styles = useStyles(makeStyles);
  const { t } = useTranslation();

  return (
    <>
      <Text style={styles.message}>{message}</Text>
      <View style={buttonRowStyles.row}>
        <Button title={t.common.cancel} variant="secondary" onPress={onCancel} style={buttonRowStyles.button} />
        <Button title={confirmTitle} variant="danger" onPress={onConfirm} style={buttonRowStyles.button} />
      </View>
    </>
  );
}

// A styled replacement for the phone's own confirmation popup.
export function ConfirmDialog({
  visible,
  title,
  ...body
}: { visible: boolean; title: string } & Parameters<typeof ConfirmBody>[0]) {
  return (
    <Dialog visible={visible} title={title} onClose={body.onCancel}>
      <ConfirmBody {...body} />
    </Dialog>
  );
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  message: {
    fontSize: fontSize.medium,
    fontFamily: fonts.body,
    color: colors.textSecondary,
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl,
    backgroundColor: colors.overlay,
  },
  dialog: {
    gap: spacing.lg,
  },
  title: {
    fontSize: fontSize.title,
    fontFamily: fonts.title,
    color: colors.text,
  },
});
