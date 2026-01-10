import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { DashboardCard } from "@/components/dashboard-card";
import { DashboardChartBar } from "@/components/dashboard-chart-bar";
import { useAuth } from "@/lib/auth-context";
import { getCadastrosByAtc } from "@/lib/google-sheets-sync";
import { useColors } from "@/hooks/use-colors";
import { useToast } from "@/lib/toast";
import { processQueueOnce } from "@/lib/sync-queue";

export default function DashboardsScreen() {
  const { user } = useAuth();
  const colors = useColors();
  const toast = useToast();
  const [cadastros, setCadastros] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  async function load() {
    try {
      if (!user) return;
      const c = await getCadastrosByAtc(user.email);

      // If Sheets is empty or unreachable, fallback to local storage so ATC sees their own data
      if (!c || c.length === 0) {
        try {
          const mod = await import("@/lib/storage");
          const local = await mod.getCadastros();
          const filtered = local.filter((x: any) => x.atcEmail === user.email);
          if (filtered.length > 0) {
            console.warn(
              `getCadastrosByAtc returned 0 rows; falling back to ${filtered.length} local cadastros for ${user.email}`
            );
            setCadastros(filtered);
            return;
          }
        } catch (err) {
          console.warn("Fallback to local cadastros failed:", err);
        }
      }

      setCadastros(c);
    } catch (e) {
      console.error("Erro ao carregar cadastros do ATC:", e);
    }
  }

  async function handleSync() {
    setIsSyncing(true);
    try {
      const result = await processQueueOnce();
      await load(); // Recarregar após sincronizar
      toast.show(
        "success",
        "✅ Sincronizado",
        "Seus dados foram sincronizados com sucesso"
      );
    } catch (e) {
      console.error("Erro ao sincronizar:", e);
      toast.show("error", "❌ Erro na sincronização", String(e));
    } finally {
      setIsSyncing(false);
    }
  }

  useEffect(() => {
    load();
  }, [user]);

  // Compute KPIs
  const total = cadastros.length;
  const implantados = cadastros.filter((c) => c.implantado === "Sim").length;
  const potencial = cadastros.reduce((s, c) => s + (c.potencialValor || 0), 0);

  // Top products
  const productsMap: Record<string, number> = {};
  cadastros.forEach((c) => {
    const name = c.produtoNomeLivre || c.produtoRef || "(sem produto)";
    productsMap[name] = (productsMap[name] || 0) + 1;
  });
  const products = Object.entries(productsMap).map(([label, value]) => ({ label, value }));
  products.sort((a, b) => b.value - a.value);

  // Channels
  const channelsMap: Record<string, number> = {};
  cadastros.forEach((c) => {
    const ch = c.canal || "(sem canal)";
    channelsMap[ch] = (channelsMap[ch] || 0) + 1;
  });
  const channels = Object.entries(channelsMap).map(([label, value]) => ({ label, value }));
  channels.sort((a, b) => b.value - a.value);

  // Units
  const unitsMap: Record<string, number> = {};
  cadastros.forEach((c) => {
    const u = c.unidade || "(sem unidade)";
    unitsMap[u] = (unitsMap[u] || 0) + 1;
  });
  const units = Object.entries(unitsMap).map(([label, value]) => ({ label, value }));
  units.sort((a, b) => b.value - a.value);

  return (
    <ScreenContainer>
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground">Dashboards</Text>
          <Text className="text-sm text-muted mt-1">Visão rápida do seu desempenho</Text>
        </View>

        <TouchableOpacity
          onPress={handleSync}
          disabled={isSyncing}
          className={`mb-4 py-3 px-4 rounded-lg flex-row items-center justify-center ${
            isSyncing ? "bg-gray-300" : "bg-blue-500"
          }`}
        >
          {isSyncing ? (
            <>
              <ActivityIndicator color="white" size="small" />
              <Text className="text-white font-bold ml-2">Sincronizando...</Text>
            </>
          ) : (
            <Text className="text-white font-bold">🔄 Sincronizar com Sheets</Text>
          )}
        </TouchableOpacity>

        <View className="flex-row gap-3 mb-4">
          <DashboardCard title="Total Cadastros" value={total} />
          <DashboardCard title="Implantados" value={implantados} color="success" />
          <DashboardCard title="Potencial (valor)" value={potencial.toFixed(2)} color="warning" />
        </View>

        <View className="mb-4">
          <DashboardChartBar title="Top Produtos" items={products.slice(0, 8)} />
        </View>

        <View className="mb-4">
          <DashboardChartBar title="Por Canal" items={channels.slice(0, 8)} />
        </View>

        <View className="mb-4">
          <DashboardChartBar title="Por Unidade" items={units.slice(0, 8)} />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
