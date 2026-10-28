import { NativeTabs } from "expo-router/native-tabs";

import { fonts } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useTranslation } from "@/i18n";

// Tabs appear in the order listed here, so Main sits in the middle.
export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <NativeTabs
      backgroundColor={colors.background}
      iconColor={{ default: colors.textMuted, selected: colors.primary }}
      labelStyle={{
        default: { color: colors.textSecondary, fontFamily: fonts.bodyMedium },
        selected: { color: colors.text, fontFamily: fonts.bodyBold },
      }}
      // The pill behind the selected icon has the same color as the empty part of the calorie gauge on Main.
      indicatorColor={colors.heroTrack}
      // No ripple "pulse" when tapping a tab on Android.
      rippleColor="transparent"
    >
      <NativeTabs.Trigger name="foods">
        <NativeTabs.Trigger.Label>{t.tabs.foods}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="fork.knife" md="restaurant" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{t.tabs.main}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>{t.tabs.settings}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gearshape.fill" md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
