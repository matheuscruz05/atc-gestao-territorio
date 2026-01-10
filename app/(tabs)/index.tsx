import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";
import { useColors } from "@/hooks/use-colors";
import { getCadastros } from "@/lib/storage";
import type { Cadastro } from "@/types/models";

export default function HomeScreen() {
  const { user, isCoord } = useAuth();
  const colors = useColors();
  const router = useRouter();
  const [cadastros, setCadastros] = useState<Cadastro[]>([]);
  const [filteredCadastros, setFilteredCadastros] = useState<Cadastro[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingCount, setPendingCount] = useState<number>(0);

  const loadCadastros = useCallback(async () => {
    try {
      const allCadastros = await getCadastros();
      
      // Filtrar por ATC se não for coordenador
      const filtered = isCoord
        ? allCadastros
        : allCadastros.filter((c) => c.atcEmail === user?.email);
      
      setCadastros(filtered);
      setFilteredCadastros(filtered);
    } catch (error) {
      console.error("Error loading cadastros:", error);
    }
  }, [user, isCoord]);

  useEffect(() => {
    loadCadastros();

    // Subscribe to pending count changes
    let unsub: (() => void) | null = null;
    (async () => {
      const mod = await import("@/lib/sync-queue");
      const count = await mod.getPendingCount();
      setPendingCount(count);
      unsub = mod.subscribePendingCount((c: number) => setPendingCount(c));
    })();

    return () => unsub && unsub();
  }, [loadCadastros]);

  // Filtrar por busca
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCadastros(cadastros);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = cadastros.filter(
      (c) =>
        c.produtoRef.toLowerCase().includes(query) ||
        c.produtoNomeLivre?.toLowerCase().includes(query) ||
        c.canal.toLowerCase().includes(query) ||
        c.unidade.toLowerCase().includes(query) ||
        c.estado.toLowerCase().includes(query)
    );
    setFilteredCadastros(filtered);
  }, [searchQuery, cadastros]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadCadastros();
    setIsRefreshing(false);
  };

  const renderCadastroCard = ({ item }: { item: Cadastro }) => {
    const produtoNome = item.produtoNomeLivre || item.produtoRef;
    const isImplantado = item.implantado === "Sim";

    return (
      <View className="bg-surface rounded-lg p-4 border border-border mb-3">
        <View className="gap-2">
          {/* Produto */}
          <Text className="text-lg font-semibold text-primary">
            {produtoNome}
          </Text>

          {/* Canal e Unidade */}
          <Text className="text-sm text-foreground">
            {item.canal} • {item.unidade}
          </Text>

          {/* Estado */}
          <Text className="text-sm text-foreground">
            {item.estado}
          </Text>

          {/* Status e Potencial */}
          <View className="flex-row items-center gap-2 mt-2">
            <View
              className={`px-3 py-1 rounded-full ${
                isImplantado ? "bg-success" : "bg-border"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  isImplantado ? "text-white" : "text-muted"
                }`}
              >
                {item.implantado}
              </Text>
            </View>

            <Text className="text-sm font-medium text-foreground">
              {item.potencialValor} {item.unidadePotencial}
            </Text>
          </View>

          {/* ATC (apenas para coordenador) */}
          {isCoord && (
            <Text className="text-xs text-muted mt-2">
              ATC: {item.atcNome}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer>
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 pt-6 pb-4 gap-4">
          <View>
            <Text className="text-2xl font-bold text-foreground">
              {isCoord ? "Dashboard" : "Meus Cadastros"}
            </Text>
            <Text className="text-base text-muted mt-1">
              Olá, {user?.nome}
            </Text>
          </View>

          {/* Busca */}
          <TextInput
            className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
            placeholder="Buscar por produto, canal, unidade..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {/* Contador */}
          <Text className="text-sm text-muted">
            {filteredCadastros.length} cadastro(s){pendingCount ? ` • ${pendingCount} pendente(s)` : ""}
          </Text>
        </View>

        {/* Lista */}
        <FlatList
          data={filteredCadastros}
          renderItem={renderCadastroCard}
          keyExtractor={(item) => item.cadastroId}
          contentContainerStyle={{ padding: 24, paddingTop: 0 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <Text className="text-base text-muted text-center">
                {searchQuery
                  ? "Nenhum cadastro encontrado"
                  : "Nenhum cadastro ainda.\nToque no + para adicionar."}
              </Text>
            </View>
          }
        />

        {/* Botão Flutuante - apenas para ATC */}
        {!isCoord && (
          <TouchableOpacity
            className="absolute bottom-6 right-6 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg"
            onPress={() => router.push("/novo-cadastro" as any)}
            activeOpacity={0.8}
          >
            <Text className="text-white text-3xl font-light">+</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScreenContainer>
  );
}
