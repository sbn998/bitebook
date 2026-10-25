import { useFocusEffect, useNavigation } from "expo-router";
import { StackActions } from "expo-router/react-navigation";
import { useCallback } from "react";

// For screens inside a tab's own stack (e.g. Settings → Meal labels): when the user switches to another tab,
// the stack goes back to its first screen, so the tab opens there next time.
// A form opened over the tabs (like the goal form) doesn't count, since this tab stays selected.
export function useBackToTopOnTabChange() {
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      // Runs when the screen leaves view: compare the selected tab's stack with this screen's stack.
      return () => {
        const tabs = navigation.getParent()?.getState();
        const selectedTab = tabs?.routes[tabs.index];
        if (selectedTab?.state?.key !== navigation.getState()?.key) navigation.dispatch(StackActions.popToTop());
      };
    }, [navigation])
  );
}
