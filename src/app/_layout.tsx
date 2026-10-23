import { NativeTabs } from "expo-router/native-tabs";
import { SQLiteProvider } from "expo-sqlite";

import { migrateDbIfNeeded } from "@/db/migrations";

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="macro-tracker.db" onInit={migrateDbIfNeeded}>
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Label>Main</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="foods">
          <NativeTabs.Trigger.Label>Foods</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="fork.knife" md="restaurant" />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="settings">
          <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="gearshape.fill" md="settings" />
        </NativeTabs.Trigger>
      </NativeTabs>
    </SQLiteProvider>
  );
}
