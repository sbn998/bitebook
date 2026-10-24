import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import type { SQLiteDatabase } from "expo-sqlite";
import { Platform } from "react-native";

import { createBackup } from "@/db/backup";
import { todayString } from "@/utils/date";

// Writes all the data to a JSON file (e.g. macro-tracker-2026-10-24.json) and opens the phone's share sheet,
// where the user picks where to keep it: Google Drive, Files, email... Throws if anything fails.
export async function shareBackup(db: SQLiteDatabase, dialogTitle: string) {
  if (!(await Sharing.isAvailableAsync())) throw new Error("Sharing isn't available on this device");

  const backup = await createBackup(db);
  // A temporary copy in the app's cache; the share sheet saves or sends it from there.
  const file = new File(Paths.cache, `macro-tracker-${todayString()}.json`);
  if (file.exists) file.delete();
  file.create();
  await file.write(JSON.stringify(backup, null, 2));

  // On iOS, a mimeType would add a second extension to the file name, so it's Android only.
  await Sharing.shareAsync(file.uri, {
    dialogTitle,
    ...(Platform.OS === "android" ? { mimeType: "application/json" } : {}),
  });
}
