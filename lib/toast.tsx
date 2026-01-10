import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { View, Text, Animated, TouchableOpacity } from "react-native";

type ToastType = "success" | "error" | "info";

type ToastContextValue = {
  show: (type: ToastType, title: string, message?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<ToastType>("info");
  const anim = new Animated.Value(0);

  const show = useCallback((t: ToastType, ttl: string, msg?: string) => {
    setType(t);
    setTitle(ttl);
    setMessage(msg || "");
    setVisible(true);
    Animated.timing(anim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    setTimeout(() => {
      Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
        setVisible(false);
      });
    }, 3000);
  }, [anim]);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {visible && (
        <Animated.View
          style={{
            position: "absolute",
            top: 24,
            left: 16,
            right: 16,
            transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
            zIndex: 9999,
          }}
        >
          <TouchableOpacity activeOpacity={0.9} onPress={() => { Animated.timing(anim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => setVisible(false)); }}>
            <View style={{ padding: 12, borderRadius: 8, backgroundColor: type === "success" ? "#16a34a" : type === "error" ? "#dc2626" : "#0ea5e9" }}>
              <Text style={{ color: "white", fontWeight: "700" }}>{title}</Text>
              {message ? <Text style={{ color: "white", marginTop: 6 }}>{message}</Text> : null}
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
