
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { ArrowLeft, Camera, FolderOpen, Video as VideoIcon, Terminal, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Video, AVPlaybackStatus } from 'expo-av';
import { GlassCard } from '@/components/GlassCard';
import { ButtonPrimary } from '@/components/ButtonPrimary';
import { theme } from '@/constants/theme';
import { detectCry, CryDetectionResponse } from '@/lib/cryDetectionApi';
import { VideoAudioProcessor } from '@/lib/videoAudioProcessor';
import { LineChart } from 'react-native-chart-kit';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ChunkResult extends CryDetectionResponse {
  chunkIndex: number;
  timestamp: number;
}

export default function MonitoringScreen() {
  const router = useRouter();
  const videoRef = useRef<Video>(null);

  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [chunkResults, setChunkResults] = useState<ChunkResult[]>([]);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [currentChunkProcessing, setCurrentChunkProcessing] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  // Animation values
  const waveOpacity = useSharedValue(0.3);

  useEffect(() => {
    waveOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1000, easing: Easing.ease }),
        withTiming(0.3, { duration: 1000, easing: Easing.ease })
      ),
      -1,
      false
    );
  }, [waveOpacity]);
  const waveStyle = { opacity: waveOpacity };
  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev]);
  };

  // Pick an audio file for direct cry detection test


  const handleRecordVideo = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera access to record video.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 0.8,
        videoMaxDuration: 60,
      });

      if (!result.canceled && result.assets[0]) {
        setVideoUri(result.assets[0].uri);
        resetState();
      }
    } catch (error: any) {
      addLog(`Error recording video: ${error.message}`);
      Alert.alert('Error', 'Failed to record video: ' + error.message);
    }
  };

  const handleSelectVideo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant photo library access to select a video.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setVideoUri(result.assets[0].uri);
        resetState();
      }
    } catch (error: any) {
      addLog(`Error selecting video: ${error.message}`);
      Alert.alert('Error', 'Failed to select video: ' + error.message);
    }
  };

  const resetState = () => {
    setChunkResults([]);
    setHasAnalyzed(false);
    setCurrentChunkIndex(0);
    setLogs([]);
    setProcessingProgress(0);
    setCurrentChunkProcessing(0);
  };

  const analyzeVideo = async () => {
    if (!videoUri) {
      Alert.alert('Error', 'Please select a video first');
      return;
    }

    setIsProcessing(true);
    resetState();
    addLog('Starting analysis (v2.0)...');

    // Defer processing to allow UI to update
    setTimeout(async () => {
      try {
        addLog('Getting video duration...');
        const videoDuration = await VideoAudioProcessor.getVideoDuration(videoUri);
        setDuration(videoDuration);
        addLog(`Video duration: ${videoDuration}ms`);

        if (videoDuration === 0) {
          throw new Error('Video duration is 0. File might be corrupted.');
        }

        addLog('Splitting video into chunks...');
        const chunks = await VideoAudioProcessor.splitIntoChunks(videoUri, 4000);
        addLog(`Split into ${chunks.length} chunks`);

        const results: ChunkResult[] = [];
        let successCount = 0;

        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          setCurrentChunkProcessing(i + 1);
          setProcessingProgress(((i + 1) / chunks.length) * 100);

          addLog(`Processing chunk ${i + 1}/${chunks.length} (${chunk.startTime}-${chunk.endTime}ms)`);

          try {
            addLog('Extracting audio...');
            const audioBuffer = await VideoAudioProcessor.extractAudioChunk(
              videoUri,
              chunk.startTime,
              chunk.endTime
            );
            addLog(`Audio extracted: ${audioBuffer.byteLength} bytes`);

            addLog('Sending to API...');
            const result = await detectCry(audioBuffer);
            addLog(`API Response: Cry=${result.any_cry}, Ratio=${result.cry_ratio.toFixed(2)}`);

            results.push({
              ...result,
              chunkIndex: i,
              timestamp: chunk.startTime,
            });

            successCount++;
            setChunkResults([...results]);

            // Add a small delay to ensure UI updates and processing feels sequential
            await new Promise(resolve => setTimeout(resolve, 500));

          } catch (error: any) {
            addLog(`❌ Error chunk ${i + 1}: ${error.message}`);
            addLog('⚠️ Stopping analysis due to error. Please check your connection or API URL.');
            console.error(error);
            break; // Stop processing further chunks if one fails
          }
        }

        setHasAnalyzed(true);
        addLog(`Analysis complete. Success: ${successCount}/${chunks.length}`);

        if (results.length === 0) {
          Alert.alert('Analysis Failed', 'Could not process any chunks.');
        } else {
          // Auto-open logs if there were errors
          if (successCount < chunks.length) {
            setShowLogs(true);
          }
        }
      } catch (error: any) {
        addLog(`❌ Fatal Error: ${error.message}`);
        Alert.alert('Analysis Error', error.message);
      } finally {
        setIsProcessing(false);
      }
    }, 500);
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setCurrentTime(status.positionMillis);
      setDuration(status.durationMillis || 0);
      setIsPlaying(status.isPlaying);

      const chunkIndex = Math.floor(status.positionMillis / 4000);
      setCurrentChunkIndex(chunkIndex);
    }
  };

  const togglePlayPause = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
    }
  };

  const currentChunk = chunkResults.find(r => r.chunkIndex === currentChunkIndex);

  const getGraphData = () => {
    if (chunkResults.length === 0) {
      return {
        labels: ['0s'],
        datasets: [{ data: [0] }],
      };
    }

    const labels = chunkResults.map((_, i) => `${i * 4}s`);
    const data = chunkResults.map(r => r.cry_ratio * 100);

    return {
      labels: labels.length > 10 ? labels.filter((_, i) => i % 2 === 0) : labels,
      datasets: [{
        data,
        color: (opacity = 1) => `rgba(1, 204, 102, ${opacity})`,
        strokeWidth: 2,
      }],
    };
  };

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <LinearGradient
      colors={[theme.colors.background, theme.colors.secondary]}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cry Monitoring</Text>
        <TouchableOpacity onPress={() => setShowLogs(true)} style={styles.logButton}>
          <Terminal size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {!videoUri ? (
          <GlassCard style={styles.selectionCard}>
            <Animated.View style={[styles.iconContainer, waveStyle]}>
              <VideoIcon size={64} color={theme.colors.primary} />
            </Animated.View>

            <Text style={styles.selectionTitle}>Select Video Source</Text>
            <Text style={styles.selectionDescription}>
              Record a new video or select an existing one to analyze for baby crying
            </Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.sourceButton}
                onPress={handleRecordVideo}
              >
                <Camera size={32} color={theme.colors.primary} />
                <Text style={styles.sourceButtonText}>Record Video</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sourceButton}
                onPress={handleSelectVideo}
              >
                <FolderOpen size={32} color={theme.colors.primary} />
                <Text style={styles.sourceButtonText}>Select Video</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        ) : (
          <>
            {/* Video Player */}
            <GlassCard style={styles.videoCard}>
              <Video
                ref={videoRef}
                source={{ uri: videoUri }}
                style={styles.video}
                useNativeControls={false}
                resizeMode={"cover" as any}
                onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
              />

              <View style={styles.controls}>
                <TouchableOpacity onPress={togglePlayPause} style={styles.playButton}>
                  <Text style={styles.playButtonText}>{isPlaying ? '⏸' : '▶'}</Text>
                </TouchableOpacity>
                <Text style={styles.timeText}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </Text>
              </View>

              {!hasAnalyzed && (
                <ButtonPrimary
                  title={isProcessing ? 'Analyzing...' : 'Analyze Video'}
                  onPress={analyzeVideo}
                  loading={isProcessing}
                  style={styles.analyzeButton}
                />
              )}

              <TouchableOpacity
                onPress={() => setVideoUri(null)}
                style={styles.resetButton}
              >
                <Text style={styles.resetButtonText}>Select Different Video</Text>
              </TouchableOpacity>
            </GlassCard>

            {/* Results Graph */}
            {chunkResults.length > 0 && (
              <GlassCard style={styles.graphCard}>
                <Text style={styles.sectionTitle}>Cry Detection Over Time</Text>

                <LineChart
                  data={getGraphData()}
                  width={SCREEN_WIDTH - 64}
                  height={220}
                  chartConfig={{
                    backgroundColor: 'transparent',
                    backgroundGradientFrom: 'rgba(0, 0, 0, 0.1)',
                    backgroundGradientTo: 'rgba(0, 0, 0, 0.1)',
                    decimalPlaces: 1,
                    color: (opacity = 1) => `rgba(1, 204, 102, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    style: { borderRadius: 16 },
                    propsForDots: {
                      r: '4',
                      strokeWidth: '2',
                      stroke: theme.colors.primary,
                    },
                  }}
                  bezier
                  style={styles.chart}
                />

                <View style={styles.currentIndicator}>
                  <View style={styles.indicatorDot} />
                  <Text style={styles.indicatorText}>
                    Current: Chunk {currentChunkIndex + 1}
                  </Text>
                </View>
              </GlassCard>
            )}

            {/* Current Chunk Details */}
            {currentChunk && (
              <GlassCard style={styles.detailsCard}>
                <Text style={styles.sectionTitle}>Current Chunk Analysis</Text>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Crying Detected:</Text>
                  <Text style={[
                    styles.detailValue,
                    { color: currentChunk.any_cry ? theme.colors.error : theme.colors.success }
                  ]}>
                    {currentChunk.any_cry ? 'YES' : 'NO'}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Cry Ratio:</Text>
                  <Text style={styles.detailValue}>
                    {(currentChunk.cry_ratio * 100).toFixed(1)}%
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Cry Segments:</Text>
                  <Text style={styles.detailValue}>{currentChunk.segments.length}</Text>
                </View>

                {currentChunk.segments.length > 0 && (
                  <View style={styles.segmentsContainer}>
                    <Text style={styles.segmentsTitle}>Cry Segments:</Text>
                    {currentChunk.segments.map((segment, index) => (
                      <View key={index} style={styles.segment}>
                        <Text style={styles.segmentText}>
                          {segment.start.toFixed(2)}s - {segment.end.toFixed(2)}s
                          ({segment.duration.toFixed(2)}s)
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                <Text style={styles.rawJsonTitle}>Raw Backend Response:</Text>
                <ScrollView style={styles.rawJsonBox} nestedScrollEnabled>
                  <Text style={styles.rawJsonText}>
                    {JSON.stringify(currentChunk, null, 2)}
                  </Text>
                </ScrollView>
              </GlassCard>
            )}

            {/* Overall Statistics */}
            {chunkResults.length > 0 && (
              <GlassCard style={styles.statsCard}>
                <Text style={styles.sectionTitle}>Overall Statistics</Text>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Chunks:</Text>
                  <Text style={styles.detailValue}>{chunkResults.length}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Chunks with Crying:</Text>
                  <Text style={styles.detailValue}>
                    {chunkResults.filter(r => r.any_cry).length}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Average Cry Ratio:</Text>
                  <Text style={styles.detailValue}>
                    {(chunkResults.reduce((sum, r) => sum + r.cry_ratio, 0) / chunkResults.length * 100).toFixed(1)}%
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Cry Segments:</Text>
                  <Text style={styles.detailValue}>
                    {chunkResults.reduce((sum, r) => sum + r.segments.length, 0)}
                  </Text>
                </View>
              </GlassCard>
            )}
          </>
        )}
      </ScrollView>

      {/* Loading Overlay */}
      <Modal
        transparent
        visible={isProcessing}
        animationType="fade"
      >
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingTitle}>Analyzing Video...</Text>
            <Text style={styles.loadingSubtitle}>
              Processing chunk {currentChunkProcessing}
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${processingProgress}%` }]} />
            </View>
            <Text style={styles.loadingPercentage}>{processingProgress.toFixed(0)}%</Text>

            <ScrollView style={styles.loadingLogs} nestedScrollEnabled>
              {logs.map((log, i) => (
                <Text key={i} style={styles.logText}>{log}</Text>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Logs Modal */}
      <Modal
        visible={showLogs}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.logsContainer}>
          <View style={styles.logsHeader}>
            <Text style={styles.logsTitle}>Analysis Logs</Text>
            <TouchableOpacity onPress={() => setShowLogs(false)}>
              <X size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.logsContent}>
            {logs.map((log, i) => (
              <Text key={i} style={styles.logTextFull}>{log}</Text>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 60,
    paddingBottom: theme.spacing.md,
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  logButton: {
    padding: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 100,
  },
  selectionCard: {
    paddingVertical: theme.spacing.xxl,
    marginBottom: theme.spacing.lg,
  },
  videoPreview: {
    width: '100%',
    height: 200,
    backgroundColor: '#000',
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(1, 204, 102, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  selectionTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  selectionDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    width: '100%',
  },
  sourceButton: {
    flex: 1,
    backgroundColor: 'rgba(1, 204, 102, 0.1)',
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    padding: theme.spacing.lg,
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  sourceButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  videoCard: {
    marginBottom: theme.spacing.lg,
  },
  video: {
    width: '100%',
    height: 200,
    backgroundColor: '#000',
    borderRadius: theme.borderRadius.md,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
  },
  playButton: {
    backgroundColor: theme.colors.primary,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonText: {
    fontSize: 20,
    color: theme.colors.background,
  },
  timeText: {
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  analyzeButton: {
    marginTop: theme.spacing.md,
  },
  resetButton: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.sm,
    alignItems: 'center',
  },
  resetButtonText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
  },
  graphCard: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  chart: {
    marginVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  currentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginRight: theme.spacing.sm,
  },
  indicatorText: {
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  detailsCard: {
    marginBottom: theme.spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  detailValue: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  segmentsContainer: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  segmentsTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  segment: {
    backgroundColor: 'rgba(1, 204, 102, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  segmentText: {
    color: theme.colors.text,
    fontSize: theme.fontSize.xs,
    fontFamily: 'monospace',
  },
  rawJsonTitle: {
    marginTop: theme.spacing.lg,
    fontSize: theme.fontSize.sm,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  rawJsonBox: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    maxHeight: 200,
  },
  rawJsonText: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontFamily: 'monospace',
  },
  statsCard: {
    marginBottom: theme.spacing.lg,
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  loadingCard: {
    width: '100%',
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    maxHeight: '80%',
  },
  loadingTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: theme.spacing.md,
  },
  loadingSubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: theme.borderRadius.full,
    marginTop: theme.spacing.lg,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  loadingPercentage: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    marginTop: theme.spacing.xs,
    fontWeight: 'bold',
  },
  loadingLogs: {
    width: '100%',
    marginTop: theme.spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    height: 150,
  },
  logText: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  logsContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: 50,
  },
  logsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  logsTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  logsContent: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  logTextFull: {
    fontSize: 12,
    color: theme.colors.text,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  graphContainer: {
    marginTop: theme.spacing.md,
    width: '100%',
  },
  graphTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  segmentsList: {
    marginTop: theme.spacing.md,
    width: '100%',
  },
  segmentsHeader: {
    fontSize: theme.fontSize.sm,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  segmentItem: {
    marginBottom: theme.spacing.sm,
  },
  segmentTime: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  segmentTimeText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text,
    fontFamily: 'monospace',
  },
  segmentDuration: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  segmentBarContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  segmentBar: {
    height: '100%',
    backgroundColor: theme.colors.error,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
});
