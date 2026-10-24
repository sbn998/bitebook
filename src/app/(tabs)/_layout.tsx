import { NativeTabs } from "expo-router/native-tabs";

import { colors } from "@/constants/theme";

// Tabs appear in the order listed here, so Main sits in the middle.
export default function TabsLayout() {
  return (
    <NativeTabs
      backgroundColor={colors.surface}
      iconColor={{ default: colors.textMuted, selected: colors.primary }}
      labelStyle={{ default: { color: colors.textMuted }, selected: { color: colors.primaryText } }}
      indicatorColor={colors.primaryTint}
      // No ripple "pulse" when tapping a tab on Android.
      rippleColor="transparent"
    >
      <NativeTabs.Trigger name="foods">
        <NativeTabs.Trigger.Label>Foods</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="fork.knife" md="restaurant" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Main</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gearshape.fill" md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
