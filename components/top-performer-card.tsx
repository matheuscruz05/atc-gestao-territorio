import { View, Text } from "react-native";

interface TopPerformerCardProps {
  icon: string;
  title: string;
  value: string;
  subtitle?: string;
  color?: "primary" | "success" | "warning" | "error";
}

export function TopPerformerCard({ 
  icon, 
  title, 
  value, 
  subtitle,
  color = "primary" 
}: TopPerformerCardProps) {
  const getColorClasses = () => {
    switch (color) {
      case "success":
        return "from-emerald-500 to-emerald-600 bg-emerald-100 dark:bg-emerald-900/20";
      case "warning":
        return "from-amber-500 to-amber-600 bg-amber-100 dark:bg-amber-900/20";
      case "error":
        return "from-red-500 to-red-600 bg-red-100 dark:bg-red-900/20";
      default:
        return "from-blue-500 to-blue-600 bg-blue-100 dark:bg-blue-900/20";
    }
  };

  const [gradientClass, bgClass] = getColorClasses().split(" ");

  return (
    <View className={`rounded-lg border border-border overflow-hidden bg-gradient-to-br ${gradientClass} p-0.5`}>
      <View className={`rounded-lg p-4 gap-3 ${bgClass}`}>
        {/* Header com ícone e badge */}
        <View className="flex-row items-center justify-between">
          <Text className="text-3xl">{icon}</Text>
          <View className={`bg-gradient-to-br ${gradientClass} rounded-full px-2.5 py-1`}>
            <Text className="text-xs font-bold text-white">TOP</Text>
          </View>
        </View>

        {/* Título */}
        <View className="gap-1">
          <Text className="text-xs font-semibold text-muted uppercase tracking-wide">
            {title}
          </Text>
          <Text className="text-lg font-bold text-foreground truncate">
            {value}
          </Text>
          {subtitle && (
            <Text className="text-sm text-foreground font-semibold">
              {subtitle}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
