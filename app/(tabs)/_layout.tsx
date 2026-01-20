import { Tabs, useRouter, useSegments } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect } from "react";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/lib/auth-context";

import { getVisibleTabTitles } from "@/lib/tab-utils";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, isLoading, isCoord } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;

  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, segments]);

  // Mostrar tela vazia enquanto carrega
  if (isLoading || !user) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
        },
      }}
    >
      {/* Home - diferente para ATC e COORD */}
      <Tabs.Screen
        name="index"
        options={{
          title: isCoord ? "Dashboard" : "Meus Cadastros",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />

      {/* Cadastros - apenas para COORD */}
      <Tabs.Screen
        name="cadastros"
        options={{
          title: "Cadastros",
          href: isCoord ? undefined : null,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="paperplane.fill" color={color} />
          ),
        }}
      /> 

      {/* Admin - apenas para COORD */}
      <Tabs.Screen
        name="admin"
        options={{
          title: "Admin",
          href: isCoord ? undefined : null,
          tabBarIcon: ({ color }) => (
            <IconSymbol
              size={28}
              name="chevron.left.forwardslash.chevron.right"
              color={color}
            />
          ),
        }}
      /> 

      {/* Dashboards - apenas para ATC */}
      {!isCoord && (
        <Tabs.Screen
          name="dashboards"
          options={{
            title: "📊 Dashboards",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="chart.bar.fill" color={color} />
            ),
            tabBarLabel: "📊 Dashboards",
          }}
        />
      )}

      {/* Timeline - visível para ATC, oculto para COORD (que acessa via Admin) */}
      <Tabs.Screen
        name="timeline"
        options={{
          href: !isCoord ? undefined : null,
          title: "📈 Timeline",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="chart.line.uptrend.xyaxis" color={color} />
          ),
        }}
      />

      {/* Perfil - todos */}
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />

      {/* tab-utils - não deve aparecer como aba */}
      <Tabs.Screen
        name="tab-utils"
        options={{
          href: null,
          title: "tab-utils",
        }}
      />
    </Tabs>
  );
}
