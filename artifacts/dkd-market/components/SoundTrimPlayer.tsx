import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  PanResponder,
  LayoutChangeEvent,
} from "react-native";
import { Audio, AVPlaybackStatus } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";

const MAX_TRIM = 60000; // 60s max
const MIN_TRIM = 1000;  // 1s min

function fmt(ms: number): string {
  if (!ms || isNaN(ms) || ms < 0) return "00:00";
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export type SoundTrimPlayerRef = {
  stop: () => Promise<void>;
};

type Props = {
  uri: string;
  title: string;
  onTrimChange: (startMs: number, endMs: number) => void;
};

const SoundTrimPlayer = forwardRef(function SoundTrimPlayer(
  { uri, title, onTrimChange }: Props,
  ref: React.ForwardedRef<SoundTrimPlayerRef>
) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [sliderWidth, setSliderWidth] = useState(0);
  const [loading, setLoading] = useState(true);

  // Refs (always current inside PanResponders)
  const soundRef = useRef<Audio.Sound | null>(null);
  const durationRef = useRef(0);
  const trimStartRef = useRef(0);
  const trimEndRef = useRef(0);
  const isPlayingRef = useRef(false);
  const sliderWidthRef = useRef(0);
  // Anchor values at gesture start
  const leftAnchorRef = useRef(0);
  const rightAnchorRef = useRef(0);

  // Load / reload when uri changes
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setIsPlaying(false);
    isPlayingRef.current = false;
    setPosition(0);
    setTrimStart(0);
    setTrimEnd(0);
    trimStartRef.current = 0;
    trimEndRef.current = 0;

    (async () => {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const { sound: s } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: false, progressUpdateIntervalMillis: 80 }
        );
        if (!mounted) { await s.unloadAsync(); return; }

        s.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
          if (!status.isLoaded) return;
          const pos = status.positionMillis ?? 0;
          const dur = status.durationMillis ?? 0;

          if (dur > 0 && durationRef.current === 0) {
            durationRef.current = dur;
            const initialEnd = Math.min(MAX_TRIM, dur);
            trimEndRef.current = initialEnd;
            if (mounted) {
              setDuration(dur);
              setTrimEnd(initialEnd);
              onTrimChange(0, initialEnd);
            }
          } else if (dur > 0 && durationRef.current !== dur) {
            durationRef.current = dur;
            if (mounted) setDuration(dur);
          }

          if (mounted) setPosition(pos);

          // Auto-stop when reaching trimEnd
          if (status.isPlaying && pos >= trimEndRef.current) {
            s.pauseAsync();
            s.setPositionAsync(trimStartRef.current);
            isPlayingRef.current = false;
            if (mounted) setIsPlaying(false);
          }
        });

        soundRef.current = s;
        setLoading(false);
      } catch {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      soundRef.current?.unloadAsync();
      soundRef.current = null;
      // Reset audio mode so video playback works after this component unmounts
      Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
        staysActiveInBackground: false,
        shouldDuckAndroid: false,
      }).catch(() => {});
    };
  }, [uri]);

  const pauseIfPlaying = useCallback(async () => {
    if (isPlayingRef.current && soundRef.current) {
      await soundRef.current.pauseAsync();
      isPlayingRef.current = false;
      setIsPlaying(false);
    }
  }, []);

  const togglePlay = useCallback(async () => {
    const s = soundRef.current;
    if (!s || loading) return;
    if (isPlayingRef.current) {
      await s.pauseAsync();
      isPlayingRef.current = false;
      setIsPlaying(false);
    } else {
      // If beyond trimEnd, reset to trimStart
      const status = await s.getStatusAsync();
      if (status.isLoaded && status.positionMillis >= trimEndRef.current) {
        await s.setPositionAsync(trimStartRef.current);
      }
      await s.playAsync();
      isPlayingRef.current = true;
      setIsPlaying(true);
    }
  }, [loading]);

  // Expose stop() so parent can halt playback before navigation
  useImperativeHandle(ref, () => ({
    stop: async () => {
      if (isPlayingRef.current && soundRef.current) {
        await soundRef.current.pauseAsync();
        isPlayingRef.current = false;
        setIsPlaying(false);
      }
    },
  }), []);

  // Auto-stop when screen loses focus (back button or Suivant)
  useFocusEffect(
    useCallback(() => {
      return () => {
        if (isPlayingRef.current && soundRef.current) {
          soundRef.current.pauseAsync();
          isPlayingRef.current = false;
          setIsPlaying(false);
        }
      };
    }, [])
  );

  // Left handle (start)
  const leftPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pauseIfPlaying();
        leftAnchorRef.current = trimStartRef.current;
      },
      onPanResponderMove: (_, gs) => {
        const w = sliderWidthRef.current;
        const dur = durationRef.current;
        if (!w || !dur) return;
        const deltaMs = (gs.dx / w) * dur;
        const raw = leftAnchorRef.current + deltaMs;
        const clamped = Math.max(0, Math.min(raw, trimEndRef.current - MIN_TRIM));
        trimStartRef.current = clamped;
        setTrimStart(clamped);
        soundRef.current?.setPositionAsync(clamped);
        onTrimChange(clamped, trimEndRef.current);
      },
    })
  ).current;

  // Right handle (end)
  const rightPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pauseIfPlaying();
        rightAnchorRef.current = trimEndRef.current;
      },
      onPanResponderMove: (_, gs) => {
        const w = sliderWidthRef.current;
        const dur = durationRef.current;
        if (!w || !dur) return;
        const deltaMs = (gs.dx / w) * dur;
        const raw = rightAnchorRef.current + deltaMs;
        const maxEnd = Math.min(dur, trimStartRef.current + MAX_TRIM);
        const clamped = Math.max(trimStartRef.current + MIN_TRIM, Math.min(raw, maxEnd));
        trimEndRef.current = clamped;
        setTrimEnd(clamped);
        onTrimChange(trimStartRef.current, clamped);
      },
    })
  ).current;

  const onTrackLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    sliderWidthRef.current = w;
    setSliderWidth(w);
  };

  // Derived ratios
  const dur = Math.max(duration, 1);
  const startRatio = trimStart / dur;
  const endRatio = Math.min(1, trimEnd / dur);
  const posRatio = Math.min(1, position / dur);
  const selectedDuration = Math.max(0, trimEnd - trimStart);

  return (
    <View style={styles.container}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <Ionicons name="cut-outline" size={13} color="#FF6B00" />
        <Text style={styles.label}>Choisir extrait · max 60s</Text>
        <Text style={styles.rangeText}>
          {fmt(trimStart)} → {fmt(trimEnd)}
          {duration > 0 ? (
            <Text style={styles.durText}> ({fmt(selectedDuration)})</Text>
          ) : null}
        </Text>
      </View>

      {/* Track area */}
      <View style={styles.trackArea} onLayout={onTrackLayout}>
        {/* Background rail */}
        <View style={styles.rail} />

        {/* Selected zone */}
        {sliderWidth > 0 && duration > 0 && (
          <View
            style={[
              styles.selectedZone,
              {
                left: startRatio * sliderWidth,
                width: (endRatio - startRatio) * sliderWidth,
              },
            ]}
          />
        )}

        {/* Playhead */}
        {sliderWidth > 0 && duration > 0 && (
          <View style={[styles.playhead, { left: posRatio * sliderWidth - 1 }]} />
        )}

        {/* Left handle */}
        {sliderWidth > 0 && duration > 0 && (
          <View
            style={[styles.handle, { left: startRatio * sliderWidth - 10 }]}
            {...leftPan.panHandlers}
          >
            <View style={styles.handleInner} />
          </View>
        )}

        {/* Right handle */}
        {sliderWidth > 0 && duration > 0 && (
          <View
            style={[styles.handle, { left: endRatio * sliderWidth - 10 }]}
            {...rightPan.panHandlers}
          >
            <View style={styles.handleInner} />
          </View>
        )}
      </View>

      {/* Times + play button */}
      <View style={styles.controlRow}>
        <Text style={styles.timeText}>{fmt(position)}</Text>
        <TouchableOpacity
          style={[styles.playBtn, loading && styles.playBtnDisabled]}
          onPress={togglePlay}
          activeOpacity={0.8}
          disabled={loading}
        >
          <Ionicons
            name={isPlaying ? "pause" : "play"}
            size={22}
            color="#fff"
            style={isPlaying ? undefined : { marginLeft: 2 }}
          />
        </TouchableOpacity>
        <Text style={styles.timeText}>{fmt(duration)}</Text>
      </View>

      <Text style={styles.hint}>
        Glissez les poignées pour définir votre extrait · {fmt(selectedDuration)} sélectionnées
      </Text>
    </View>
  );
});

export default SoundTrimPlayer;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#161616",
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#2D2D2D",
    gap: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  label: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: "#FF6B00",
    flex: 1,
  },
  rangeText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "#9CA3AF",
  },
  durText: {
    color: "#FF6B00",
    fontFamily: "Poppins_600SemiBold",
  },

  trackArea: {
    height: 44,
    justifyContent: "center",
    position: "relative",
  },
  rail: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#2D2D2D",
  },
  selectedZone: {
    position: "absolute",
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FF6B00",
    opacity: 0.85,
  },
  playhead: {
    position: "absolute",
    width: 2,
    height: 18,
    borderRadius: 1,
    backgroundColor: "rgba(255,255,255,0.7)",
    top: 13,
  },
  handle: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 3,
    borderColor: "#FF6B00",
    top: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 6,
  },
  handleInner: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FF6B00",
  },

  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timeText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#6B7280",
    minWidth: 44,
  },
  playBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FF6B00",
    alignItems: "center",
    justifyContent: "center",
  },
  playBtnDisabled: {
    opacity: 0.4,
  },

  hint: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: "#4B5563",
    textAlign: "center",
  },
});
