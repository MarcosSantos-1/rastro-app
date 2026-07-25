import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import {
  CATEGORIA_LABEL,
  type DenunciaCategoria,
} from "@/lib/denuncias";
import { formatAddressFromGeocode } from "@/lib/format-address";
import {
  findNearbyActiveDenuncia,
  submitDenuncia,
} from "@/lib/submit-denuncia";

const CATEGORIAS: DenunciaCategoria[] = [
  "descarte_irregular",
  "conteiner_cheio",
  "contaminacao_reciclavel",
  "outros",
];

export default function RegistroScreen() {
  const insets = useSafeAreaInsets();
  const { ensureAnonymous } = useAuth();
  const [photos, setPhotos] = useState<string[]>([]);
  const [categoria, setCategoria] = useState<DenunciaCategoria>("descarte_irregular");
  const [observacao, setObservacao] = useState("");
  const [addressLine, setAddressLine] = useState("Obtendo localização…");
  const [bairro, setBairro] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setAddressLine("Localização indisponível");
          return;
        }
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        const places = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        const first = places[0];
        if (first) {
          setAddressLine(formatAddressFromGeocode(first) || "Endereço aproximado");
          setBairro(first.district || first.subregion || "");
          setMunicipio(first.city || first.subregion || first.region || "");
        } else {
          setAddressLine(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }
      } catch {
        setAddressLine("Não foi possível obter o endereço");
      }
    })();
  }, []);

  const pickFromGallery = useCallback(async () => {
    if (photos.length >= 2) {
      Alert.alert("Limite", "Você pode anexar no máximo 2 fotos.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsMultipleSelection: false,
    });
    if (!res.canceled && res.assets[0]?.uri) {
      setPhotos((p) => [...p, res.assets[0].uri].slice(0, 2));
    }
  }, [photos.length]);

  const takePhoto = useCallback(async () => {
    if (photos.length >= 2) {
      Alert.alert("Limite", "Você pode anexar no máximo 2 fotos.");
      return;
    }
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Câmera", "Permita o uso da câmera para tirar a foto.");
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      quality: 0.85,
      allowsEditing: false,
    });
    if (!res.canceled && res.assets[0]?.uri) {
      setPhotos((p) => [...p, res.assets[0].uri].slice(0, 2));
    }
  }, [photos.length]);

  const removePhoto = useCallback((uri: string) => {
    setPhotos((p) => p.filter((x) => x !== uri));
  }, []);

  const onSubmit = useCallback(async () => {
    if (!coords) {
      Alert.alert("Localização", "Aguarde a localização GPS ou verifique a permissão.");
      return;
    }
    if (!photos.length) {
      Alert.alert("Foto", "Adicione pelo menos uma foto do local.");
      return;
    }
    if (categoria === "outros" && !observacao.trim()) {
      Alert.alert("Descrição", "Em Outros, descreva o problema em poucas palavras.");
      return;
    }

    setSubmitting(true);
    try {
      await ensureAnonymous();
      const nearby = await findNearbyActiveDenuncia(coords.lat, coords.lng);
      if (nearby) {
        Alert.alert(
          "Já existe um registro próximo",
          `Há uma ocorrência ativa a cerca de ${Math.round(nearby.distanceM)} m. Evite duplicar o mesmo chamado.`,
        );
        setSubmitting(false);
        return;
      }

      await submitDenuncia({
        categoria,
        observacao: categoria === "outros" ? observacao : observacao.trim() || undefined,
        lat: coords.lat,
        lng: coords.lng,
        endereco: addressLine,
        bairro: bairro || undefined,
        municipio: municipio || undefined,
        photoUris: photos,
      });

      router.replace({
        pathname: "/enviado",
        params: { municipio: municipio || "local" },
      });
    } catch (e) {
      Alert.alert("Erro ao enviar", e instanceof Error ? e.message : "Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }, [
    addressLine,
    bairro,
    categoria,
    coords,
    ensureAnonymous,
    municipio,
    observacao,
    photos,
  ]);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Novo registro</Text>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityLabel="Fechar"
          style={styles.closeBtn}
        >
          <Ionicons name="close" size={28} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 120 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.photoRow}>
          {photos.map((uri) => (
            <View key={uri} style={styles.thumbWrap}>
              <Image source={{ uri }} style={styles.thumb} contentFit="cover" />
              <Pressable style={styles.thumbRemove} onPress={() => removePhoto(uri)}>
                <Ionicons name="close-circle" size={22} color="#fff" />
              </Pressable>
            </View>
          ))}
          {photos.length < 2 ? (
            <Pressable style={styles.cameraBtn} onPress={() => void takePhoto()}>
              <Ionicons name="camera" size={40} color={colors.cta} />
              <Text style={styles.cameraLabel}>Tirar foto</Text>
            </Pressable>
          ) : null}
        </View>
        {photos.length < 2 ? (
          <Pressable onPress={() => void pickFromGallery()}>
            <Text style={styles.galleryLink}>ou escolher da galeria</Text>
          </Pressable>
        ) : null}

        <Text style={styles.section}>Tipo de ocorrência</Text>
        <View style={styles.chips}>
          {CATEGORIAS.map((c) => {
            const active = categoria === c;
            return (
              <Pressable
                key={c}
                onPress={() => setCategoria(c)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {CATEGORIA_LABEL[c]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {categoria === "outros" ? (
          <TextInput
            style={styles.input}
            placeholder="Descreva o problema…"
            placeholderTextColor={colors.textMuted}
            value={observacao}
            onChangeText={setObservacao}
            multiline
            maxLength={400}
          />
        ) : null}

        <View style={styles.locRow}>
          <Ionicons name="location" size={22} color={colors.cta} />
          <Text style={styles.locText}>{addressLine}</Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable
          style={({ pressed }) => [
            styles.sendBtn,
            pressed && styles.sendBtnPressed,
            submitting && styles.sendBtnDisabled,
          ]}
          onPress={() => void onSubmit()}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.sendText}>Enviar</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  closeBtn: {
    position: "absolute",
    right: 16,
  },
  scroll: {
    paddingHorizontal: 20,
    gap: 16,
  },
  photoRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  cameraBtn: {
    width: 160,
    height: 160,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: "dashed",
    backgroundColor: colors.bgElevated,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  cameraLabel: {
    color: colors.cta,
    fontWeight: "600",
  },
  galleryLink: {
    textAlign: "center",
    color: colors.cta,
    fontWeight: "600",
    fontSize: 15,
  },
  thumbWrap: {
    width: 140,
    height: 140,
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
  },
  thumb: {
    width: "100%",
    height: "100%",
  },
  thumbRemove: {
    position: "absolute",
    top: 6,
    right: 6,
  },
  section: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginTop: 8,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.cta,
    borderColor: colors.cta,
  },
  chipText: {
    color: colors.text,
    fontWeight: "600",
    fontSize: 14,
  },
  chipTextActive: {
    color: colors.ctaText,
  },
  input: {
    minHeight: 88,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgElevated,
    padding: 14,
    textAlignVertical: "top",
    color: colors.text,
    fontSize: 15,
  },
  locRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locText: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sendBtn: {
    backgroundColor: colors.cta,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
  },
  sendBtnPressed: {
    backgroundColor: colors.ctaPressed,
  },
  sendBtnDisabled: {
    opacity: 0.7,
  },
  sendText: {
    color: colors.ctaText,
    fontSize: 18,
    fontWeight: "700",
  },
});
