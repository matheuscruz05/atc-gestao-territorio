import { Alert } from "react-native";

/**
 * Confirm action across platforms.
 * On web, uses window.confirm when available.
 * On native, falls back to Alert.alert with buttons.
 */
export async function confirmAction(
  message: string,
  title = "Confirmar"
): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      if (typeof window !== "undefined" && typeof window.confirm === "function") {
        // Web fallback
        const confirmed = window.confirm(message);
        resolve(confirmed);
        return;
      }

      // Native Alert fallback
      Alert.alert(title, message, [
        { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
        { text: "Confirmar", onPress: () => resolve(true) },
      ]);
    } catch (error) {
      // In case anything unexpected happens, do not confirm
      console.warn("confirmAction fallback error:", error);
      resolve(false);
    }
  });
}
