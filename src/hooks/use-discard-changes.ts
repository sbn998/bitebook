import { usePreventRemove } from "expo-router";
import { useState } from "react";

// For forms: while `hasChanges` is true, leaving the screen (back button, back gesture or header arrow)
// stops and shows the "Discard changes?" popup instead. Show it with the returned `dialog`.
// Call `allowLeaving` right before leaving on purpose, e.g. after Save or Delete.
export function useDiscardChanges(hasChanges: boolean) {
  // True once leaving is allowed, so the screen isn't protected again before it closes.
  const [leaving, setLeaving] = useState(false);
  // The blocked "leave", waiting for the user's answer. Stored in a function, so it's wrapped in another one.
  const [blockedLeave, setBlockedLeave] = useState<(() => void) | null>(null);

  const disablePrevention = usePreventRemove(hasChanges && !leaving, ({ repeat }) => setBlockedLeave(() => repeat));

  function allowLeaving() {
    setLeaving(true);
    disablePrevention();
  }

  const dialog = {
    visible: blockedLeave !== null,
    onDiscard: () => {
      allowLeaving();
      setBlockedLeave(null);
      blockedLeave?.();
    },
    onKeepEditing: () => setBlockedLeave(null),
  };

  return { allowLeaving, dialog };
}
