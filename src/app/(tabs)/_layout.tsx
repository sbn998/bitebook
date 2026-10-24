import { NativeTabs } from "expo-router/native-tabs";

import { colors, fonts } from "@/constants/theme";
import { useTranslation } from "@/i18n";

// Tabs appear in the order listed here, so Main sits in the middle.
export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <NativeTabs
      backgroundColor={colors.background}
      iconColor={{ default: colors.textMuted, selected: colors.primary }}
      labelStyle={{
        default: { color: colors.textMuted, fontFamily: fonts.bodyMedium },
        selected: { color: colors.text, fontFamily: fonts.bodyBold },
      }}
      indicatorColor={colors.primaryTint}
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
