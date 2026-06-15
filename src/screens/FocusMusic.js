import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Audio } from 'expo-av';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import Slider from '@react-native-community/slider';
import { useAppTheme } from '../theme/useAppTheme';
import ScreenHeader from '../components/common/ScreenHeader';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const TRACKS = [
  {
    id: 'lofi_hiphop',
    title: 'Lofi Study Beats',
    subtitle: 'Smooth instrumental hip-hop to keep you focused',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    icon: 'headphones',
    color: ['#FF7E5F', '#FEB47B'],
  },
  {
    id: 'rain_thunder',
    title: 'Cozy Rain & Thunder',
    subtitle: 'Soothing rain drops with gentle rumbling thunder',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    icon: 'weather-rainy',
    color: ['#4facfe', '#00f2fe'],
  },
  {
    id: 'coffee_shop',
    title: 'Cafe Ambience',
    subtitle: 'Soft chatter and coffee machine clatter',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    icon: 'coffee',
    color: ['#a18cd1', '#fbc2eb'],
  },
  {
    id: 'deep_focus',
    title: 'Deep Focus Synth',
    subtitle: 'Binaural beats and deep synthesizers',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    icon: 'sine-wave',
    color: ['#30cfd0', '#330867'],
  },
  {
    id: 'nature_forest',
    title: 'Forest Whisper',
    subtitle: 'Gentle wind through leaves and distant birds singing',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    icon: 'leaf',
    color: ['#5c258d', '#4389a2'],
  },
];

export default function FocusMusic({ navigation }) {
  const { theme } = useAppTheme();
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(TRACKS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(1);

  const isUpdatingStatus = useRef(false);

  useEffect(() => {
    // Enable audio mode for background playback & silent mode override
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldRouteThroughEarpieceIOS: false,
    });

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      if (!isUpdatingStatus.current) {
        setPosition(status.positionMillis);
        setDuration(status.durationMillis || 1);
      }
      setIsPlaying(status.isPlaying);
      if (status.didJustFinish && !status.isLooping) {
        handleNext();
      }
    }
  };

  const loadAndPlayTrack = async (track, shouldPlay = true) => {
    setIsLoading(true);
    try {
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: track.url },
        { 
          shouldPlay, 
          volume, 
          isLooping: true 
        },
        onPlaybackStatusUpdate
      );

      setSound(newSound);
      setCurrentTrack(track);
      setIsPlaying(shouldPlay);
    } catch (error) {
      console.error('Error loading sound:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayPause = async () => {
    if (!sound) {
      await loadAndPlayTrack(currentTrack, true);
      return;
    }

    if (isPlaying) {
      await sound.pauseAsync();
      setIsPlaying(false);
    } else {
      await sound.playAsync();
      setIsPlaying(true);
    }
  };

  const handleNext = () => {
    const currentIndex = TRACKS.findIndex((t) => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % TRACKS.length;
    loadAndPlayTrack(TRACKS[nextIndex], true);
  };

  const handlePrev = () => {
    const currentIndex = TRACKS.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + TRACKS.length) % TRACKS.length;
    loadAndPlayTrack(TRACKS[prevIndex], true);
  };

  const handleVolumeChange = async (value) => {
    setVolume(value);
    if (sound) {
      await sound.setVolumeAsync(value);
    }
  };

  const handleSeek = async (value) => {
    if (sound) {
      isUpdatingStatus.current = true;
      await sound.setPositionAsync(value);
      setPosition(value);
      isUpdatingStatus.current = false;
    }
  };

  const formatTime = (millis) => {
    const totalSeconds = millis / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />
      <ScreenHeader 
        title="Focus Music" 
        onBack={() => navigation.goBack()} 
        theme={theme}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Main Player Card */}
        <LinearGradient
          colors={currentTrack.color}
          style={styles.playerCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.artworkContainer}>
            <View style={styles.artworkBg}>
              <Icon 
                name={currentTrack.icon} 
                size={80} 
                color="#FFF" 
                style={[
                  styles.artworkIcon,
                  isPlaying && styles.pulseIcon
                ]} 
              />
            </View>
          </View>

          <Text style={styles.trackTitle} numberOfLines={1}>{currentTrack.title}</Text>
          <Text style={styles.trackSubtitle} numberOfLines={2}>{currentTrack.subtitle}</Text>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <Slider
              style={styles.progressBar}
              value={position}
              minimumValue={0}
              maximumValue={duration}
              minimumTrackTintColor="#FFF"
              maximumTrackTintColor="rgba(255,255,255,0.3)"
              thumbTintColor="#FFF"
              onSlidingComplete={handleSeek}
            />
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{formatTime(position)}</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          </View>

          {/* Audio Controls */}
          <View style={styles.controlsRow}>
            <TouchableOpacity onPress={handlePrev} style={styles.iconBtn}>
              <Icon name="skip-previous" size={36} color="#FFF" />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handlePlayPause} 
              style={styles.playBtn}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={currentTrack.color[0]} />
              ) : (
                <Icon name={isPlaying ? "pause" : "play"} size={44} color={currentTrack.color[0]} />
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleNext} style={styles.iconBtn}>
              <Icon name="skip-next" size={36} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Volume Control */}
          <View style={styles.volumeRow}>
            <Icon name="volume-low" size={18} color="#FFF" />
            <Slider
              style={styles.volumeBar}
              value={volume}
              minimumValue={0}
              maximumValue={1}
              minimumTrackTintColor="#FFF"
              maximumTrackTintColor="rgba(255,255,255,0.3)"
              thumbTintColor="#FFF"
              onValueChange={handleVolumeChange}
            />
            <Icon name="volume-high" size={18} color="#FFF" />
          </View>
        </LinearGradient>

        {/* Tracks List */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Playlist</Text>
        <View style={styles.playlistContainer}>
          {TRACKS.map((track) => {
            const isCurrent = track.id === currentTrack.id;
            return (
              <TouchableOpacity
                key={track.id}
                style={[
                  styles.trackItem,
                  { backgroundColor: theme.colors.card },
                  isCurrent && { borderColor: theme.colors.primary, borderWidth: 1.5 }
                ]}
                onPress={() => loadAndPlayTrack(track, true)}
              >
                <LinearGradient
                  colors={track.color}
                  style={styles.trackIconContainer}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Icon name={track.icon} size={20} color="#FFF" />
                </LinearGradient>
                <View style={styles.trackInfo}>
                  <Text 
                    style={[
                      styles.playlistTrackTitle, 
                      { color: theme.colors.text },
                      isCurrent && { color: theme.colors.primary, fontWeight: 'bold' }
                    ]}
                    numberOfLines={1}
                  >
                    {track.title}
                  </Text>
                  <Text style={[styles.playlistTrackSubtitle, { color: theme.colors.secondaryText }]} numberOfLines={1}>
                    {track.subtitle}
                  </Text>
                </View>
                {isCurrent && isPlaying ? (
                  <Icon name="volume-high" size={20} color={theme.colors.primary} />
                ) : (
                  <Icon name="play-circle-outline" size={24} color={theme.colors.border} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  playerCard: {
    borderRadius: 30,
    padding: 24,
    alignItems: 'center',
    marginBottom: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  artworkContainer: {
    marginBottom: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  artworkBg: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  artworkIcon: {},
  pulseIcon: {
    // Rotating or pulsing effect can be simulated here
  },
  trackTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  trackSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 10,
    lineHeight: 18,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 20,
  },
  progressBar: {
    width: '100%',
    height: 40,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginTop: -8,
  },
  timeText: {
    color: '#FFF',
    fontSize: 11,
    opacity: 0.8,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 30,
    marginBottom: 24,
  },
  iconBtn: {
    padding: 8,
  },
  playBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 10,
    gap: 10,
  },
  volumeBar: {
    flex: 1,
    height: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  playlistContainer: {
    gap: 12,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  trackIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackInfo: {
    flex: 1,
    marginLeft: 16,
    marginRight: 8,
  },
  playlistTrackTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  playlistTrackSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
});