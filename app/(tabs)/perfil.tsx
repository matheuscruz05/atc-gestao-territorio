import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";

export default function PerfilScreen() {
  const { user, logout, isCoord } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    console.log("[DEBUG] handleLogout clicked");

    // On web, Alert.alert may not support multiple-button dialogs reliably.
    // Use a simple confirm fallback so it's reproducible in browser devtools.
    const isWeb = typeof window !== "undefined" && (window as any).document;

    if (isWeb) {
      const confirm = window.confirm("Deseja realmente sair do aplicativo?");
      if (confirm) {
        (async () => {
          try {
            console.log("[DEBUG] web confirm accepted");
            await logout();
            console.log("[DEBUG] logout finished");
            router.replace("/login");
          } catch (error) {
            console.error("Logout error (web):", error);
            Alert.alert("Erro", "Ocorreu um erro ao sair");
          }
        })();
      }
      return;
    }

    Alert.alert(
      "Sair",
      "Deseja realmente sair do aplicativo?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          style: "destructive",
          onPress: async () => {
            try {
              console.log("[DEBUG] native alert accepted");
              await logout();
              console.log("[DEBUG] logout finished");
              router.replace("/login");
            } catch (error) {
              console.error("Logout error:", error);
              Alert.alert("Erro", "Ocorreu um erro ao sair");
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer className="p-6">
      <View className="gap-6">
        {/* Header */}
        <View className="items-center gap-2 py-6">
          <View className="w-20 h-20 bg-primary rounded-full items-center justify-center">
            <Text className="text-3xl font-bold text-white">
              {user?.nome.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text className="text-2xl font-bold text-foreground">
            {user?.nome}
          </Text>
          <Text className="text-base text-muted">
            {user?.email}
          </Text>
        </View>

        {/* Informações */}
        <View className="bg-surface rounded-lg p-4 border border-border gap-3">
          <View className="flex-row justify-between items-center">
            <Text className="text-sm text-muted">Perfil</Text>
            <Text className="text-base font-semibold text-foreground">
              {isCoord ? "Coordenador" : "ATC"}
            </Text>
          </View>
          
          <View className="h-px bg-border" />
          
          <View className="flex-row justify-between items-center">
            <Text className="text-sm text-muted">Status</Text>
            <View className="bg-success px-3 py-1 rounded-full">
              <Text className="text-xs font-semibold text-white">
                Ativo
              </Text>
            </View>
          </View>
        </View>

        {/* Botão de Logout */}
        <TouchableOpacity
          className="bg-error rounded-lg py-4 items-center mt-4"
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text className="text-white font-semibold text-base">
            Sair
          </Text>
        </TouchableOpacity>

        {/* Versão */}
        <Text className="text-xs text-muted text-center mt-8">
          Versão 1.0.0
        </Text>
      </View>
    </ScreenContainer>
  );
}
