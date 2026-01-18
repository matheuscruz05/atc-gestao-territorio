import { View, Text } from "react-native";
import { useColors } from "@/hooks/use-colors";

interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  color?: "primary" | "success" | "warning" | "danger";
}

export function DashboardCard({
  title,
  value,
  subtitle,
  color = "primary",
}: DashboardCardProps) {
  const colors = useColors();
  
  const colorClasses = {
    primary: "bg-blue-500",
    success: "bg-green-500",
    warning: "bg-amber-500",
    danger: "bg-red-500",
  };

  return (
    <View className={`${colorClasses[color]} rounded-lg p-2.5 flex-1 min-h-14`}>
      <Text className="text-white text-xs font-semibold opacity-90">{title}</Text>
      <Text className="text-white text-xl font-bold mt-0.5">{value}</Text>
      {subtitle && (
        <Text className="text-white text-xs mt-0.5 opacity-75">{subtitle}</Text>
      )}
    </View>
  );
}
