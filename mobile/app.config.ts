import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";

  return {
    ...config,
    name: "Rastro",
    slug: "rastro",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "rastro",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      icon: "./assets/images/icon.png",
      infoPlist: {
        NSCameraUsageDescription:
          "O Rastro usa a câmera para fotografar descartes irregulares e problemas de zeladoria.",
        NSPhotoLibraryUsageDescription:
          "O Rastro acessa a galeria para anexar fotos ao registro.",
      },
    },
    android: {
      icon: "./assets/images/icon.png",
      adaptiveIcon: {
        backgroundColor: "#e8f7f0",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      permissions: [
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.CAMERA",
        "android.permission.READ_MEDIA_IMAGES",
      ],
      package: "com.rastro.app",
      config: {
        googleMaps: {
          apiKey: googleMapsApiKey,
        },
      },
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 280,
          resizeMode: "contain",
          backgroundColor: "#e8f7f0",
        },
      ],
      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "O Rastro usa sua localização para mostrar ocorrências próximas e registrar denúncias georreferenciadas.",
        },
      ],
      [
        "expo-image-picker",
        {
          photosPermission: "O Rastro acessa a galeria para anexar fotos ao registro.",
          cameraPermission: "O Rastro usa a câmera para fotografar descartes irregulares.",
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      firebaseApiKey: "AIzaSyBF8GcIcz_UifWK6GEPVFabip2p-MKIj9E",
      firebaseAuthDomain: "rastro-1f47f.firebaseapp.com",
      firebaseProjectId: "rastro-1f47f",
      firebaseStorageBucket: "rastro-1f47f.firebasestorage.app",
      firebaseMessagingSenderId: "306341155584",
      firebaseAppId: "1:306341155584:web:5f1c367412934e25a359e5",
      googleMapsApiKey,
      router: {},
      eas: {
        projectId: "8c2d9406-07b8-4e80-9675-4db6b99373c3",
      },
    },
  };
};
