import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/constants/colors";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

export const unstable_settings = {
  initialRouteName: "index",
};

function RastroTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 10);

  return (
    <View style={[styles.bar, { paddingBottom: bottomPad }]}>
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
              <View style={[styles.homeBtn, focused && styles.homeBtnFocused]}>
                <Ionicons name="home" size={26} color="#fff" />
              </View>
            </Pressable>
          );
        }

        const iconColor = focused ? colors.cta : colors.textMuted;

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
              <MaterialIcons name="history" size={26} color={iconColor} />
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
  return (
    <Tabs
      initialRouteName="index"
      tabBar={(props) => <RastroTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
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
    backgroundColor: colors.bgElevated,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 10,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
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
    backgroundColor: colors.cta,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: colors.bgElevated,
    shadowColor: colors.cta,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  homeBtnFocused: {
    backgroundColor: colors.homeFocus,
    shadowColor: colors.homeFocus,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
});
