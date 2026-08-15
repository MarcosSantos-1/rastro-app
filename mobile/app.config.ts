import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  const googleMapsApiKey =
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
    process.env.GOOGLE_MAPS_API_KEY?.trim() ||
    // Fallback igual ao Firebase em `extra`: a key do Maps vai no APK de qualquer forma.
    // Evita AndroidManifest sem meta-data se o env do EAS falhar na resolução do config.
    "AIzaSyCdghUbODg0QlzEAR_9wQtEgL3D8Rvivw8";

  if (!googleMapsApiKey) {
    throw new Error(
      "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY vazia ao resolver app.config — " +
        "defina no EAS (environment preview) e no .env local.",
    );
  }

  return {
    ...config,
    name: "Rastro",
    // Deve bater com o projeto EAS (projectId abaixo); o slug remoto é "mobile" e não pode ser alterado.
    slug: "mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "rastro",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      bundleIdentifier: "com.marcosv.rastro",
      supportsTablet: true,
      icon: "./assets/images/icon.png",
      infoPlist: {
        NSCameraUsageDescription:
          "O Rastro usa a câmera para fotografar descartes irregulares e problemas de zeladoria.",
        NSPhotoLibraryUsageDescription:
          "O Rastro acessa a galeria para anexar fotos ao registro.",
        NSLocationWhenInUseUsageDescription:
          "O Rastro usa sua localização para mostrar ocorrências próximas e registrar denúncias georreferenciadas.",
        ITSAppUsesNonExemptEncryption: false,
      },
      config: {
        googleMapsApiKey,
      },
    },
    android: {
      icon: "./assets/images/icon.png",
      adaptiveIcon: {
        backgroundColor: "#F3F6F4",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      allowBackup: false,
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
          // Só fundo + letter (sem ícone adaptativo cheio). No Android 12+
          // o SO ainda mostra o adaptive icon em círculo por um instante;
          // em seguida o BrandedLoading cobre com o logo inteiro, sem corte.
          image: "./assets/images/rastro_letter_splash.png",
          imageWidth: 180,
          resizeMode: "contain",
          backgroundColor: "#F3F6F4",
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
