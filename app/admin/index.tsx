import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";
import { useColors } from "@/hooks/use-colors";
import {
  getUsuarios,
  getProdutos,
  getCanais,
  getUnidades,
  getCadastros,
  setCadastros as setCadastrosLocal,
} from "@/lib/storage";
import {
  getDashboardMetricas,
  syncCadastrosFromSheets,
  syncAllCadastrosToSheets,
  pullCadastrosFromSheets,
} from "@/lib/google-sheets-sync";
import type { Usuario, Produto, Canal, Unidade, Cadastro } from "@/types/models";
import { DashboardCard } from "@/components/dashboard-card";
import { DashboardChartBar } from "@/components/dashboard-chart-bar";
import { DashboardList } from "@/components/dashboard-list";
import { useToast } from "@/lib/toast";

type Tab = "dashboard" | "usuarios" | "produtos" | "canais" | "unidades" | "cadastros";

export default function AdminScreen() {
  const { isCoord } = useAuth();
  const colors = useColors();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Dados
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [canais, setCanais] = useState<Canal[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [cadastros, setCadastros] = useState<Cadastro[]>([]);
  const [metricas, setMetricas] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);

  // Carregar dados
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [usuariosData, produtosData, canaisData, unidadesData, cadastrosData] =
        await Promise.all([
          getUsuarios(),
          getProdutos(),
          getCanais(),
          getUnidades(),
          getCadastros(),
        ]);
      
      // Buscar métricas passando dados locais como fallback
      const metricasData = await getDashboardMetricas(cadastrosData, usuariosData);
      
      setUsuarios(usuariosData);
      setProdutos(produtosData);
      setCanais(canaisData);
      setUnidades(unidadesData);
      setCadastros(cadastrosData);
      setMetricas(metricasData);

      // Background reconciliation: ensure local cadastros are present in Sheets
      (async () => {
        try {
          const sheetCadastros = await syncCadastrosFromSheets();

          // Helper to find a sheet row matching a local cadastro by stable fields
          const findMatchingSheetRow = (local: Cadastro) => {
            return sheetCadastros.findIndex((s) =>
              s.criadoEm === local.criadoEm &&
              (s.atcEmail || s.atcNome) === (local.atcEmail || local.atcNome) &&
              (s.produtoRef || '') === (local.produtoRef || '') &&
              (s.unidade || '') === (local.unidade || '')
            );
          };

          const { sendCadastroToSheets } = await import("@/lib/google-sheets-sync");

          for (const local of cadastrosData) {
            const idx = findMatchingSheetRow(local);
            if (idx === -1) {
              // Not present at all — send
              try {
                const res = await sendCadastroToSheets(local);
                if (!res.success) console.warn(`Failed to send ${local.cadastroId}:`, res.error || res.message);
                else console.log(`Synced missing cadastro ${local.cadastroId} to Sheets`);
              } catch (err) {
                console.warn(`Error sending cadastro ${local.cadastroId}:`, err);
              }
            } else {
              const sheetRow = sheetCadastros[idx];
              if (sheetRow.cadastroId !== local.cadastroId) {
                // Update sheet row to use local ID (preserve position)
                try {
                  const update = { ...local };
                  // Use API to replace the row - find row number by querying the sheet again
                  const sa = await import('@/lib/google-sheets-sync');
                  // We'll rely on sendCadastroToSheets writing a new row — as an upgrade step prefer updating in place
                  console.log(`Found matching row in Sheets but id differs (sheet=${sheetRow.cadastroId} local=${local.cadastroId}) — updating by writing local row`);
                  const res = await sendCadastroToSheets(local);
                  if (!res.success) console.warn(`Failed to update row for ${local.cadastroId}:`, res.error || res.message);
                  else console.log(`Updated sheet with local cadastroId ${local.cadastroId}`);
                } catch (err) {
                  console.warn('Error while updating sheet row id:', err);
                }
              }
            }
          }
        } catch (err) {
          console.warn('Could not reconcile local cadastros with Sheets:', err);
        }
      })();
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await syncAllCadastrosToSheets(cadastros);
      if (result.success) {
        toast.show("success", "✅ Sincronizado", result.message);
      } else {
        toast.show("error", "❌ Erro", result.message);
      }
    } catch (e) {
      console.error("Erro ao sincronizar:", e);
      toast.show("error", "❌ Erro na sincronização", String(e));
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePull = async () => {
    setIsPulling(true);
    try {
      const result = await pullCadastrosFromSheets();
      if (result.success) {
        // Merge pulled cadastros with existing ones (deduplicate by cadastroId)
        const merged = [...cadastros];
        for (const pulled of result.cadastros) {
          const idx = merged.findIndex((c) => c.cadastroId === pulled.cadastroId);
          if (idx === -1) {
            merged.push(pulled);
          } else {
            merged[idx] = pulled; // Update with latest from Sheets
          }
        }
        
        // Save merged cadastros locally
        await setCadastrosLocal(merged);
        setCadastros(merged);
        
        // Reload metrics
        const newMetricas = await getDashboardMetricas(merged);
        setMetricas(newMetricas);
        
        toast.show("success", "✅ Atualizado", result.message);
      } else {
        toast.show("error", "❌ Erro", result.message);
      }
    } catch (e) {
      console.error("Erro ao fazer pull:", e);
      toast.show("error", "❌ Erro no pull", String(e));
    } finally {
      setIsPulling(false);
    }
  }

  // Redirecionar se não for coordenador
  if (!isCoord) {
    return (
      <ScreenContainer className="justify-center items-center p-6">
        <Text className="text-base text-muted text-center">
          Acesso restrito a coordenadores
        </Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-2xl font-bold text-foreground">
            Administração
          </Text>
          <Text className="text-sm text-muted mt-1">
            Monitoramento em tempo real
          </Text>
        </View>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-6 mb-4"
          contentContainerStyle={{ gap: 8 }}
        >
          {(["dashboard", "usuarios", "produtos", "canais", "unidades", "cadastros"] as Tab[]).map(
            (tab) => (
              <TouchableOpacity
                key={tab}
                className={`px-4 py-2 rounded-lg ${
                  activeTab === tab ? "bg-primary" : "bg-surface border border-border"
                }`}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}
              >
                <Text
                  className={`text-sm font-semibold ${
                    activeTab === tab ? "text-white" : "text-foreground"
                  }`}
                >
                  {tab === "dashboard"
                    ? "📊 Dashboard"
                    : tab === "usuarios"
                    ? "👥 Usuários"
                    : tab === "produtos"
                    ? "📦 Produtos"
                    : tab === "canais"
                    ? "🛣️ Canais"
                    : tab === "unidades"
                    ? "🏢 Unidades"
                    : "📋 Cadastros"}
                </Text>
              </TouchableOpacity>
            )
          )}
        </ScrollView>

        {/* Conteúdo */}
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-muted mt-4">Carregando dados...</Text>
          </View>
        ) : (
          <ScrollView
            className="flex-1 px-6"
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
            }
          >
            {/* Dashboard */}
            {activeTab === "dashboard" && metricas && (
              <View className="gap-4 pb-6">
                {/* Sync/Pull Buttons */}
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={handleSync}
                    disabled={isSyncing}
                    className={`flex-1 py-3 px-4 rounded-lg flex-row items-center justify-center ${
                      isSyncing ? "bg-gray-300" : "bg-blue-500"
                    }`}
                  >
                    {isSyncing ? (
                      <>
                        <ActivityIndicator color="white" size="small" />
                        <Text className="text-white font-bold ml-2">Sincronizando...</Text>
                      </>
                    ) : (
                      <Text className="text-white font-bold">📤 Enviar</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handlePull}
                    disabled={isPulling}
                    className={`flex-1 py-3 px-4 rounded-lg flex-row items-center justify-center ${
                      isPulling ? "bg-gray-300" : "bg-green-500"
                    }`}
                  >
                    {isPulling ? (
                      <>
                        <ActivityIndicator color="white" size="small" />
                        <Text className="text-white font-bold ml-2">Baixando...</Text>
                      </>
                    ) : (
                      <Text className="text-white font-bold">📥 Atualizar</Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* KPIs Principais */}
                <View className="gap-3">
                  <View className="flex-row gap-3">
                    <DashboardCard
                      title="Total de Cadastros"
                      value={metricas.totalCadastros}
                      color="primary"
                    />
                    <DashboardCard
                      title="ATCs Ativos"
                      value={metricas.totalAtcs}
                      color="success"
                    />
                  </View>
                  <View className="flex-row gap-3">
                    <DashboardCard
                      title="Implantados"
                      value={metricas.totalImplantados}
                      color="warning"
                    />
                    <DashboardCard
                      title="Potencial Total"
                      value={`${metricas.potencialTotal.toFixed(0)}`}
                      subtitle="unidades"
                      color="danger"
                    />
                  </View>
                </View>

                {/* Gráficos */}
                <DashboardChartBar
                  title="Cadastros por Categoria"
                  items={Object.entries(metricas.cadastrosPorCategoria).map(
                    ([label, value]) => ({
                      label,
                      value: value as number,
                    })
                  )}
                />

                <DashboardChartBar
                  title="Cadastros por ATC"
                  items={Object.entries(metricas.cadastrosPorAtc).map(
                    ([label, value]) => ({
                      label,
                      value: value as number,
                    })
                  )}
                />

                <DashboardList
                  title="Top 5 Produtos"
                  items={Object.entries(metricas.cadastrosPorProduto)
                    .sort((a, b) => (b[1] as number) - (a[1] as number))
                    .slice(0, 5)
                    .map(([label, value]) => ({
                      label,
                      value: value as number,
                    }))}
                />

                <DashboardList
                  title="Cadastros por Unidade"
                  items={Object.entries(metricas.cadastrosPorUnidade)
                    .sort((a, b) => (b[1] as number) - (a[1] as number))
                    .map(([label, value]) => ({
                      label,
                      value: value as number,
                    }))}
                />
              </View>
            )}

            {/* Usuários */}
            {activeTab === "usuarios" && (
              <View className="gap-3 pb-6">
                <Text className="text-base font-semibold text-foreground mb-2">
                  Usuários ({usuarios.length})
                </Text>
                {usuarios.map((usuario) => (
                  <View
                    key={usuario.email}
                    className="bg-surface rounded-lg p-4 border border-border"
                  >
                    <Text className="text-base font-semibold text-foreground">
                      {usuario.nome}
                    </Text>
                    <Text className="text-sm text-muted mt-1">
                      {usuario.email}
                    </Text>
                    <View className="flex-row items-center gap-2 mt-2">
                      <View className="bg-primary px-2 py-1 rounded">
                        <Text className="text-xs font-semibold text-white">
                          {usuario.role}
                        </Text>
                      </View>
                      <View
                        className={`px-2 py-1 rounded ${
                          usuario.ativo ? "bg-green-500" : "bg-red-500"
                        }`}
                      >
                        <Text className="text-xs font-semibold text-white">
                          {usuario.ativo ? "Ativo" : "Inativo"}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Produtos */}
            {activeTab === "produtos" && (
              <View className="gap-3 pb-6">
                <Text className="text-base font-semibold text-foreground mb-2">
                  Produtos ({produtos.length})
                </Text>
                {produtos.map((produto) => (
                  <View
                    key={produto.produtoId}
                    className="bg-surface rounded-lg p-4 border border-border"
                  >
                    <Text className="text-base font-semibold text-foreground">
                      {produto.produto}
                    </Text>
                    <Text className="text-xs text-primary mt-1">
                      {produto.categoria}
                    </Text>
                    <View className="flex-row items-center gap-2 mt-2">
                      <Text className="text-sm text-muted">
                        Unidade: {produto.unidadePotencial}
                      </Text>
                      <View
                        className={`px-2 py-1 rounded ${
                          produto.ativo ? "bg-green-500" : "bg-red-500"
                        }`}
                      >
                        <Text className="text-xs font-semibold text-white">
                          {produto.ativo ? "Ativo" : "Inativo"}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Canais */}
            {activeTab === "canais" && (
              <View className="gap-3 pb-6">
                <Text className="text-base font-semibold text-foreground mb-2">
                  Canais ({canais.length})
                </Text>
                {canais.map((canal) => (
                  <View
                    key={canal.canalId}
                    className="bg-surface rounded-lg p-4 border border-border"
                  >
                    <Text className="text-base font-semibold text-foreground">
                      {canal.canal}
                    </Text>
                    <View className="mt-2">
                      <View
                        className={`px-2 py-1 rounded self-start ${
                          canal.ativo ? "bg-green-500" : "bg-red-500"
                        }`}
                      >
                        <Text className="text-xs font-semibold text-white">
                          {canal.ativo ? "Ativo" : "Inativo"}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Unidades */}
            {activeTab === "unidades" && (
              <View className="gap-3 pb-6">
                <Text className="text-base font-semibold text-foreground mb-2">
                  Unidades ({unidades.length})
                </Text>
                {unidades.map((unidade) => (
                  <View
                    key={unidade.unidadeId}
                    className="bg-surface rounded-lg p-4 border border-border"
                  >
                    <Text className="text-base font-semibold text-foreground">
                      {unidade.unidade}
                    </Text>
                    {unidade.estadoUf && (
                      <Text className="text-sm text-muted mt-1">
                        Estado: {unidade.estadoUf}
                      </Text>
                    )}
                    <View className="mt-2">
                      <View
                        className={`px-2 py-1 rounded self-start ${
                          unidade.ativo ? "bg-green-500" : "bg-red-500"
                        }`}
                      >
                        <Text className="text-xs font-semibold text-white">
                          {unidade.ativo ? "Ativo" : "Inativo"}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Cadastros */}
            {activeTab === "cadastros" && (
              <View className="gap-3 pb-6">
                <Text className="text-base font-semibold text-foreground mb-2">
                  Cadastros ({cadastros.length})
                </Text>
                {cadastros.length === 0 ? (
                  <View className="bg-surface rounded-lg p-6 items-center">
                    <Text className="text-muted">Nenhum cadastro encontrado</Text>
                  </View>
                ) : (
                  cadastros.map((cadastro) => (
                    <View
                      key={cadastro.cadastroId}
                      className="bg-surface rounded-lg p-4 border border-border"
                    >
                      <Text className="text-base font-semibold text-foreground">
                        {cadastro.produtoNomeLivre || cadastro.produtoRef}
                      </Text>
                      <View className="gap-1 mt-2">
                        <Text className="text-xs text-muted">
                          ATC: {cadastro.atcNome}
                        </Text>
                        <Text className="text-xs text-muted">
                          Canal: {cadastro.canal}
                        </Text>
                        <Text className="text-xs text-muted">
                          Unidade: {cadastro.unidade}
                        </Text>
                        <Text className="text-xs text-muted">
                          Implantado: {cadastro.implantado}
                        </Text>
                        <Text className="text-xs text-muted">
                          Potencial: {cadastro.potencialValor} {cadastro.unidadePotencial}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </ScreenContainer>
  );
}
