import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState, type ComponentProps } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type ThemeColors } from "@/constants/colors";
import { makeShadows } from "@/constants/shadows";
import { fonts, makeTypography } from "@/constants/typography";
import { useAuth } from "@/contexts/AuthContext";
import { useRastroTheme, useThemedStyles } from "@/contexts/ThemeContext";
import {
  CATEGORIA_LABEL,
  type DenunciaCategoria,
} from "@/lib/denuncias";
import { reverseGeocodeGoogle } from "@/lib/google-geocode";
import {
  findNearbyActiveDenuncia,
  SKIP_ANTI_DUPE_CHECK,
  submitDenuncia,
} from "@/lib/submit-denuncia";

type CategoryOption = {
  id: DenunciaCategoria;
  label: string;
  icon: ComponentProps<typeof MaterialCommunityIcons>["name"] | "help-circle-outline";
  pack: "mci" | "ion";
};

const CATEGORIAS: CategoryOption[] = [
  { id: "descarte_irregular", label: CATEGORIA_LABEL.descarte_irregular, icon: "sofa", pack: "mci" },
  { id: "conteiner_cheio", label: CATEGORIA_LABEL.conteiner_cheio, icon: "trash-can", pack: "mci" },
  {
    id: "contaminacao_reciclavel",
    label: CATEGORIA_LABEL.contaminacao_reciclavel,
    icon: "recycle",
    pack: "mci",
  },
  { id: "entulho_obra", label: CATEGORIA_LABEL.entulho_obra, icon: "hard-hat", pack: "mci" },
  { id: "residuo_verde", label: CATEGORIA_LABEL.residuo_verde, icon: "leaf", pack: "mci" },
  { id: "outros", label: CATEGORIA_LABEL.outros, icon: "help-circle-outline", pack: "ion" },
];

export default function RegistroScreen() {
  const { colors } = useRastroTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const { ensureAnonymous } = useAuth();
  const scrollRef = useRef<ScrollView>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [categoria, setCategoria] = useState<DenunciaCategoria | null>(null);
  const [observacao, setObservacao] = useState("");
  const [outrosTexto, setOutrosTexto] = useState("");
  const [addressLine, setAddressLine] = useState("Obtendo localização…");
  const [bairro, setBairro] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const onHide = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

  const scrollDescIntoView = useCallback(() => {
    const delay = Platform.OS === "ios" ? 80 : 180;
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, delay);
  }, []);

  // Depois que o padding do teclado redimensiona a tela, garante que o campo fique visível
  useEffect(() => {
    if (keyboardHeight <= 0) return;
    const t = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 50);
    return () => clearTimeout(t);
  }, [keyboardHeight]);

  useEffect(() => {
    void (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setAddressLine("Localização indisponível");
          return;
        }

        const last = await Location.getLastKnownPositionAsync();
        if (last) {
          setCoords({
            lat: last.coords.latitude,
            lng: last.coords.longitude,
          });
        }

        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });

        const place = await reverseGeocodeGoogle(lat, lng);
        if (place) {
          setAddressLine(place.address || "Endereço aproximado");
          setBairro(place.bairro);
          setMunicipio(place.municipio);
        } else {
          setAddressLine("Endereço aproximado");
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
    if (!categoria) {
      Alert.alert("Categoria", "Selecione o tipo de ocorrência.");
      return;
    }
    if (categoria === "outros" && !outrosTexto.trim()) {
      Alert.alert("Descrição", "Descreva o tipo de resíduo em poucas palavras.");
      return;
    }

    const observacaoFinal =
      categoria === "outros"
        ? outrosTexto.trim()
        : observacao.trim() || undefined;

    setSubmitting(true);
    try {
      await ensureAnonymous();
      if (!SKIP_ANTI_DUPE_CHECK) {
        const nearby = await findNearbyActiveDenuncia(coords.lat, coords.lng);
        if (nearby) {
          Alert.alert(
            "Já existe um registro próximo",
            `Há uma ocorrência ativa a cerca de ${Math.round(nearby.distanceM)} m. Evite duplicar o mesmo chamado.`,
          );
          setSubmitting(false);
          return;
        }
      }

      await submitDenuncia({
        categoria,
        observacao: observacaoFinal,
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
    outrosTexto,
    photos,
  ]);

  const hasPhoto = photos.length > 0;
  const canSubmit =
    hasPhoto &&
    !!categoria &&
    !submitting &&
    (categoria !== "outros" || !!outrosTexto.trim());

  const keyboardOpen = keyboardHeight > 0;

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top + 8,
          // Empurra o formulário (e o rodapé) para cima do teclado
          paddingBottom: keyboardHeight,
        },
      ]}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel="Voltar"
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Nova ocorrência</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scrollFlex}
        contentContainerStyle={[styles.scroll, { paddingBottom: 32 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        {hasPhoto ? (
          <View style={styles.photoFilled}>
            <View style={styles.photosRow}>
              {photos.map((uri) => (
                <View key={uri} style={styles.thumbWrap}>
                  <Image source={{ uri }} style={styles.thumb} contentFit="cover" />
                  <Pressable style={styles.thumbRemove} onPress={() => removePhoto(uri)}>
                    <Ionicons name="close-circle" size={24} color="#fff" />
                  </Pressable>
                </View>
              ))}
            </View>

            {photos.length < 2 ? (
              <View style={styles.photoBtnRow}>
                <Pressable
                  style={({ pressed }) => [styles.photoBtn, pressed && styles.photoBtnPressed]}
                  onPress={() => void takePhoto()}
                >
                  <Ionicons name="camera" size={18} color={colors.cta} />
                  <Text style={styles.photoBtnText}>Tirar outra</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.photoBtn, pressed && styles.photoBtnPressed]}
                  onPress={() => void pickFromGallery()}
                >
                  <Ionicons name="images" size={18} color={colors.cta} />
                  <Text style={styles.photoBtnText}>Galeria</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.photoEmpty}>
            <Pressable style={styles.photoEmptyTap} onPress={() => void takePhoto()}>
              <View style={styles.cameraIconWrap}>
                <Ionicons name="camera" size={28} color={colors.cta} />
              </View>
              <Text style={styles.photoTitle}>Tirar foto do descarte</Text>
              <Text style={styles.photoHint}>Toque para abrir a câmera ou</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.photoBtn,
                styles.galleryBtnEmpty,
                pressed && styles.photoBtnPressed,
              ]}
              onPress={() => void pickFromGallery()}
            >
              <Ionicons name="images" size={18} color={colors.cta} />
              <Text style={styles.photoBtnText}>Escolher da galeria</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.locCard}>
          <View style={styles.locIcon}>
            <Ionicons name="location" size={20} color={colors.cta} />
          </View>
          <View style={styles.locTextWrap}>
            <Text style={styles.locTitle}>
              {coords ? "Localização capturada" : "Obtendo localização…"}
            </Text>
            <Text style={styles.locAddress}>{addressLine}</Text>
          </View>
          <View style={styles.gpsBadge}>
            <Text style={styles.gpsText}>GPS</Text>
          </View>
        </View>

        <Text style={styles.section}>Tipo de resíduo</Text>
        <View style={styles.chips}>
          {CATEGORIAS.map((c) => {
            const active = categoria === c.id;
            const iconColor = active ? colors.ctaText : colors.textMuted;
            return (
              <Pressable
                key={c.id}
                onPress={() => setCategoria(c.id)}
                style={[styles.chip, active && styles.chipActive]}
              >
                {c.pack === "ion" ? (
                  <Ionicons name="help-circle-outline" size={15} color={iconColor} />
                ) : (
                  <MaterialCommunityIcons name={c.icon as "sofa"} size={15} color={iconColor} />
                )}
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {categoria === "outros" ? (
          <View style={styles.outrosWrap}>
            <Text style={styles.section}>Descreva o tipo</Text>
            <TextInput
              style={styles.outrosInput}
              placeholder="Ex.: entulho de demolição com restos de madeira"
              placeholderTextColor={colors.textMuted}
              value={outrosTexto}
              onChangeText={setOutrosTexto}
              maxLength={120}
              onFocus={scrollDescIntoView}
            />
          </View>
        ) : (
          <>
            <Text style={styles.section}>
              Descrição <Text style={styles.optional}>(opcional)</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Ex.: sacos de lixo acumulados na calçada há alguns dias."
              placeholderTextColor={colors.textMuted}
              value={observacao}
              onChangeText={setObservacao}
              multiline
              maxLength={400}
              onFocus={scrollDescIntoView}
            />
          </>
        )}
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: keyboardOpen ? 12 : Math.max(insets.bottom, 16) },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.sendBtn,
            pressed && canSubmit && styles.sendBtnPressed,
            !canSubmit && styles.sendBtnDisabled,
          ]}
          onPress={() => void onSubmit()}
          disabled={!canSubmit}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.sendText}>Enviar ocorrência</Text>
          )}
        </Pressable>
        {!hasPhoto ? (
          <Text style={styles.footerHint}>Adicione uma foto para enviar o registro</Text>
        ) : null}
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors, isDark: boolean) {
  const typography = makeTypography(colors);
  const shadows = makeShadows(colors, isDark);
  const PAGE_BG = colors.bg;
  const SURFACE = colors.bgElevated;
  return StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    ...typography.title,
    fontSize: 18,
  },
  scrollFlex: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
    gap: 20,
  },
  photoEmpty: {
    aspectRatio: 16 / 10,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.border,
    backgroundColor: SURFACE,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 16,
  },
  photoEmptyTap: {
    alignItems: "center",
    gap: 6,
  },
  photoFilled: {
    gap: 14,
    alignItems: "center",
  },
  photosRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    width: "100%",
  },
  cameraIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.ctaSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  photoTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  photoHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
  },
  photoBtnRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    width: "100%",
  },
  photoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: colors.ctaSoft,
    borderWidth: 1,
    borderColor: colors.cta,
  },
  photoBtnPressed: {
    opacity: 0.85,
  },
  photoBtnText: {
    fontFamily: fonts.bodySemi,
    color: colors.cta,
    fontWeight: "600",
    fontSize: 13,
  },
  galleryBtnEmpty: {
    marginTop: 2,
  },
  thumbWrap: {
    width: 140,
    height: 140,
    borderRadius: 18,
    overflow: "hidden",
    position: "relative",
    backgroundColor: SURFACE,
  },
  thumb: {
    width: "100%",
    height: "100%",
  },
  thumbRemove: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 12,
  },
  locCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    ...shadows.cardSoft,
  },
  locIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.ctaSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  locTextWrap: {
    flex: 1,
  },
  locTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  locAddress: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  gpsBadge: {
    backgroundColor: colors.ctaSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  gpsText: {
    ...typography.data,
    fontSize: 11,
    color: colors.cta,
  },
  section: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: -8,
  },
  optional: {
    fontWeight: "400",
    color: colors.textMuted,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.cta,
    borderColor: colors.cta,
  },
  chipText: {
    fontFamily: fonts.bodySemi,
    color: colors.textMuted,
    fontWeight: "600",
    fontSize: 12,
  },
  chipTextActive: {
    color: colors.ctaText,
  },
  outrosWrap: {
    gap: 12,
  },
  outrosInput: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: SURFACE,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: fonts.body,
    color: colors.text,
    fontSize: 14,
  },
  input: {
    minHeight: 96,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: SURFACE,
    padding: 16,
    textAlignVertical: "top",
    fontFamily: fonts.body,
    color: colors.text,
    fontSize: 14,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sendBtn: {
    backgroundColor: colors.cta,
    paddingVertical: 18,
    borderRadius: 999,
    alignItems: "center",
  },
  sendBtnPressed: {
    backgroundColor: colors.ctaPressed,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendText: {
    fontFamily: fonts.bodySemi,
    color: colors.ctaText,
    fontSize: 16,
    fontWeight: "600",
  },
  footerHint: {
    marginTop: 8,
    textAlign: "center",
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
  },
  });
}
