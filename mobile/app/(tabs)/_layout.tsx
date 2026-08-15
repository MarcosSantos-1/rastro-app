import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { makeShadows } from "@/constants/shadows";
import { useRastroTheme } from "@/contexts/ThemeContext";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

export const unstable_settings = {
  initialRouteName: "index",
};

function RastroTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 10);
  const { colors, isDark } = useRastroTheme();
  const shadows = makeShadows(colors, isDark);

  return (
    <View
      style={[
        styles.bar,
        {
          paddingBottom: bottomPad,
          backgroundColor: isDark ? "rgba(7,19,13,0.92)" : "rgba(255,255,255,0.9)",
          borderTopColor: colors.border,
          ...shadows.cardSoft,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const focused = state.index === index;
        const isHome = route.name === "index";
        const label =
          options.title ??
          (typeof options.tabBarLabel === "string" ? options.tabBarLabel : route.name);

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };
        const iconName =
          route.name === "mapa"
            ? focused
              ? "map"
              : "map-outline"
            : focused
              ? "home"
              : "home-outline";

        if (isHome) {
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={label}
              style={styles.homeSlot}
            >
              <View
                style={[
                  styles.homeBtn,
                  shadows.fab,
                  {
                    backgroundColor: focused ? colors.homeFocus : colors.cta,
                    borderColor: isDark ? colors.bg : "#fff",
                  },
                ]}
              >
                <Ionicons name="home" size={26} color="#fff" />
              </View>
            </Pressable>
          );
        }

        const iconColor = focused ? colors.homeFocus : colors.textMuted;

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={label}
            style={styles.sideSlot}
          >
            {route.name === "atividade" ? (
              <Ionicons
                name={focused ? "document-text" : "document-text-outline"}
                size={24}
                color={iconColor}
              />
            ) : (
              <Ionicons
                name={iconName as keyof typeof Ionicons.glyphMap}
                size={24}
                color={iconColor}
              />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  const { colors } = useRastroTheme();
  return (
    <Tabs
      initialRouteName="index"
      tabBar={(props) => <RastroTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="mapa"
        options={{
          title: "Mapa",
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
        }}
      />
      <Tabs.Screen
        name="atividade"
        options={{
          title: "Atividade",
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    borderTopWidth: 1,
    paddingTop: 10,
    paddingHorizontal: 12,
  },
  sideSlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    minHeight: 48,
  },
  homeSlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: -28,
  },
  homeBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
  },
});
