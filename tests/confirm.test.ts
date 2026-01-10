import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock react-native's Alert to avoid bundler parsing issues in tests
vi.mock("react-native", () => ({
  Alert: { alert: vi.fn() },
}));

import { confirmAction } from "@/lib/confirm";
import { Alert } from "react-native";

describe("confirmAction util", () => {
  const originalWindow = (global as any).window;

  afterEach(() => {
    // restore window
    (global as any).window = originalWindow;
    vi.restoreAllMocks();
  });

  it("uses window.confirm when available and returns true", async () => {
    (global as any).window = { confirm: vi.fn(() => true) };
    const res = await confirmAction("Tem certeza?");
    expect(res).toBe(true);
    expect((global as any).window.confirm).toHaveBeenCalled();
  });

  it("uses window.confirm when available and returns false", async () => {
    (global as any).window = { confirm: vi.fn(() => false) };
    const res = await confirmAction("Tem certeza?");
    expect(res).toBe(false);
    expect((global as any).window.confirm).toHaveBeenCalled();
  });

  it("falls back to Alert.alert when window.confirm is not available", async () => {
    // Ensure no window.confirm
    (global as any).window = undefined;

    // Mock Alert.alert to simulate user pressing the confirm button
    const impl = ((title: any, message: any, buttons: any) => {
      // Simulate pressing the Confirm (second) button
      if (Array.isArray(buttons) && buttons[1] && typeof buttons[1].onPress === "function") {
        buttons[1].onPress();
      }
    }) as any;
    const alertMock = vi.spyOn(Alert, "alert").mockImplementation(impl);

    const res = await confirmAction("Tem certeza?", "Confirmar");
    expect(res).toBe(true);
    expect(alertMock).toHaveBeenCalled();
  });
});
