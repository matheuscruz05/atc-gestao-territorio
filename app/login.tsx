import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";
import { useColors } from "@/hooks/use-colors";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const colors = useColors();

  const handleLogin = async () => {
    if (!email.trim() || !senha.trim()) {
      Alert.alert("Erro", "Por favor, preencha email e senha");
      return;
    }

    if (authLoading) {
      // Evita múltiplos cliques enquanto auth inicia/sincroniza
      return;
    }

    setIsLoading(true);
    try {
      const success = await login(email.trim(), senha);
      if (success) {
        router.replace("/(tabs)");
      } else {
        Alert.alert(
          "Erro",
          "Email ou senha inválidos. Se for sua primeira vez, use coord@atc.com / 123456 ou as credenciais cadastradas na planilha."
        );
      }
    } catch (error) {
      Alert.alert("Erro", "Ocorreu um erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer className="justify-center p-6">
      <View className="gap-8">
        {/* Logo e Título */}
        <View className="items-center gap-4">
          <Image
            source={require("@/assets/images/icon.png")}
            style={{ width: 100, height: 100 }}
            resizeMode="contain"
          />
          <View className="items-center">
            <Text className="text-3xl font-bold text-foreground">
              Mosaic - Gestão de Território
            </Text>
            <Text className="text-base text-muted mt-2">
              Time PR/SC
            </Text>
          </View>
        </View>

        {/* Formulário */}
        <View className="gap-4">
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">
              Email
            </Text>
            <TextInput
              className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
              placeholder="seu@email.com"
              placeholderTextColor={colors.muted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-foreground mb-2">
              Senha
            </Text>
            <TextInput
              className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
              placeholder="••••••••"
              placeholderTextColor={colors.muted}
              value={senha}
              onChangeText={setSenha}
              secureTextEntry
              editable={!isLoading}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
          </View>

          <TouchableOpacity
            className="bg-primary rounded-lg py-4 items-center mt-4"
            onPress={handleLogin}
            disabled={isLoading || authLoading}
            activeOpacity={0.8}
          >
            {isLoading || authLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Entrar
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}
