
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
import { ArrowLeft, Camera, FolderOpen, Video as VideoIcon, Terminal, X, Square } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Video, AVPlaybackStatus } from 'expo-av';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
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
  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  // Video upload mode state
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
  const [isReplaying, setIsReplaying] = useState(false); // Track real-time replay mode

  // Live camera mode state
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isRecordingLive, setIsRecordingLive] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [liveRecordingUri, setLiveRecordingUri] = useState<string | null>(null); // Used to track recording location
  const [liveChunkResults, setLiveChunkResults] = useState<ChunkResult[]>([]);
  const [liveRecordingTime, setLiveRecordingTime] = useState(0);
  const extractIntervalRef = useRef<NodeJS.Timeout | number | null>(null);
  const extractCountRef = useRef(0);

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

  // LIVE CAMERA MODE FUNCTIONS
  const handleStartLive = async () => {
    try {
      const permStatus = cameraPermission?.granted;
      if (!permStatus) {
        const result = await requestCameraPermission();
        if (!result.granted) {
          Alert.alert('Permission Required', 'Please grant camera access to use live monitoring.');
          return;
        }
      }

      // Create a file path for the live recording - camera will create the file
      const fileName = `live_recording_${Date.now()}.mp4`;
      const filePath = `file://${FileSystem.documentDirectory}${fileName}`.replace(/\/{3,}/g, '//');
      
      addLog('Starting live camera recording...');
      setIsLiveMode(true);
      setIsRecordingLive(true);
      setLiveRecordingUri(filePath);
      setLiveChunkResults([]);
      setLiveRecordingTime(0);
      extractCountRef.current = 0;

      // Start the camera recording
      if (cameraRef.current) {
        const recordingPromise = cameraRef.current.recordAsync({
          maxDuration: 3600, // 1 hour max
          maxFileSize: 1000 * 1024 * 1024, // 1GB
        }) as Promise<{uri: string} | undefined>;

        // Start the 10-second extraction timer
        startLiveAudioExtraction(filePath);

        // Wait for recording to complete (won't happen unless stopped)
        const recording = await recordingPromise;
        if (recording?.uri) {
          setLiveRecordingUri(recording.uri);
          addLog(`Recording completed: ${recording.uri}`);
        }
      }
    } catch (error: any) {
      addLog(`Error starting live recording: ${error.message}`);
      Alert.alert('Error', 'Failed to start live recording: ' + error.message);
      setIsLiveMode(false);
      setIsRecordingLive(false);
    }
  };

  const startLiveAudioExtraction = (recordingPath: string) => {
    addLog('Starting 10-second audio extraction timer...');
    
    // Clear any existing timer
    if (extractIntervalRef.current) {
      clearInterval(extractIntervalRef.current);
    }

    extractIntervalRef.current = setInterval(async () => {
      try {
        extractCountRef.current += 1;
        addLog(`Extracting audio segment #${extractCountRef.current}...`);

        // Extract audio from the recording file
        const audioBuffer = await VideoAudioProcessor.extractLastNSecondsAudio(
          recordingPath,
          10
        );
        addLog(`Audio extracted: ${(audioBuffer.byteLength / 1024).toFixed(2)} KB`);

        // Send to API
        addLog(`Sending segment #${extractCountRef.current} to API...`);
        try {
          const result = await detectCry({
            uri: recordingPath,
            name: `live-segment-${extractCountRef.current}.wav`,
            type: 'audio/wav',
          });

          addLog(`✅ API Response received for segment #${extractCountRef.current}`);
          addLog(`Crying detected: ${result.any_cry ? 'YES' : 'NO'}`);
          addLog(`Cry ratio: ${(result.cry_ratio * 100).toFixed(2)}%`);

          // Add to live results
          const newChunk: ChunkResult = {
            ...result,
            chunkIndex: extractCountRef.current - 1,
            timestamp: (extractCountRef.current - 1) * 10000, // 10 seconds in ms
          };

          setLiveChunkResults(prev => [...prev, newChunk]);
          setLiveRecordingTime(extractCountRef.current * 10);
          addLog(`Total recording time: ${extractCountRef.current * 10}s`);
        } catch (apiError: any) {
          addLog(`⚠️ API Error: ${apiError.message}`);
        }
      } catch (error: any) {
        addLog(`Error in extraction timer: ${error.message}`);
      }
    }, 10000); // Extract every 10 seconds
  };

  const handleStopLive = async () => {
    try {
      addLog('Stopping live recording...');
      
      // Clear the extraction timer
      if (extractIntervalRef.current) {
        clearInterval(extractIntervalRef.current);
        extractIntervalRef.current = null;
      }

      // Stop the camera recording
      if (cameraRef.current) {
        try {
          await (cameraRef.current as any).stopRecording?.();
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_e) {
          // Silently handle stop errors
        }
      }

      setIsRecordingLive(false);
      addLog('✅ Live recording stopped');
    } catch (error: any) {
      addLog(`Error stopping live recording: ${error.message}`);
      Alert.alert('Error', 'Failed to stop recording: ' + error.message);
    }
  };

  const exitLiveMode = () => {
    // Clear timer
    if (extractIntervalRef.current) {
      clearInterval(extractIntervalRef.current);
      extractIntervalRef.current = null;
    }

    // Clean up
    setIsLiveMode(false);
    setIsRecordingLive(false);
    setLiveRecordingUri(null);
    setLiveChunkResults([]);
    setLiveRecordingTime(0);
    extractCountRef.current = 0;
    setLogs([]);
  };

  const analyzeVideo = async () => {
    if (!videoUri) {
      Alert.alert('Error', 'Please select a video first');
      return;
    }

    setIsProcessing(true);
    resetState();
    addLog('Starting analysis...');

    // Defer processing to allow UI to update
    setTimeout(async () => {
      try {
        addLog('Getting video duration...');
        const videoDuration = await VideoAudioProcessor.getVideoDuration(videoUri);
        setDuration(videoDuration);
        addLog(`Video duration: ${videoDuration}ms (${(videoDuration / 1000).toFixed(2)}s)`);

        if (videoDuration === 0) {
          throw new Error('Video duration is 0. File might be corrupted.');
        }

        addLog('Extracting full audio from video...');
        setProcessingProgress(25);

        // Extract full audio without chunking
        const audioBuffer = await VideoAudioProcessor.extractFullAudio(videoUri);
        addLog(`Audio extracted: ${(audioBuffer.byteLength / 1024 / 1024).toFixed(2)} MB`);
        setProcessingProgress(50);

        addLog('Sending to API for analysis...');
        setProcessingProgress(75);

        try {
          // Send full audio to API - use the video URI directly as a React Native file object
          const result = await detectCry({
            uri: videoUri,
            name: 'video-audio.wav',
            type: 'audio/wav',
          });

          addLog(`✅ API Response received`);
          addLog(`Crying detected: ${result.any_cry ? 'YES' : 'NO'}`);
          addLog(`Cry ratio: ${(result.cry_ratio * 100).toFixed(2)}%`);
          addLog(`Cry segments found: ${result.segments.length}`);

          // Store result as a single chunk with index 0 (represents whole video)
          const singleChunk: ChunkResult = {
            ...result,
            chunkIndex: 0,
            timestamp: 0,
          };

          setChunkResults([singleChunk]);
          setCurrentChunkIndex(0);
          setHasAnalyzed(true);
          setProcessingProgress(100);

          addLog('✅ Analysis complete!');

          // Start real-time replay visualization
          addLog('Starting real-time replay visualization...');
          setIsReplaying(true);

          // Seek to start and play
          if (videoRef.current) {
            await videoRef.current.pauseAsync();
            await videoRef.current.setPositionAsync(0);
            await new Promise(resolve => setTimeout(resolve, 200)); // Give video time to seek
            await videoRef.current.playAsync();
            addLog('Playback started - syncing with analysis');
          }
        } catch (error: any) {
          addLog(`❌ API Error: ${error.message}`);
          addLog('⚠️ Please check your connection and API URL');
          console.error('API Error:', error);
          Alert.alert('Analysis Error', `Failed to analyze video: ${error.message}`);
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

      // Check if video has finished playing
      if (status.didJustFinish && isReplaying) {
        addLog('Playback complete - real-time visualization finished');
        setIsReplaying(false);
      }
    }
  };

  // Smooth data using moving average for wave-like curves
  const smoothData = (data: number[], windowSize: number = 5): number[] => {
    if (data.length === 0) return data;
    const smoothed: number[] = [];
    const halfWindow = Math.floor(windowSize / 2);

    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - halfWindow);
      const end = Math.min(data.length, i + halfWindow + 1);
      const slice = data.slice(start, end);
      const average = slice.reduce((a, b) => a + b, 0) / slice.length;
      smoothed.push(average);
    }

    return smoothed;
  };

  const togglePlayPause = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
        setIsReplaying(false);
      } else {
        // Check if video is at the end, if so restart from beginning
        if (currentTime >= duration - 100) { // Allow small margin for floating point
          addLog('Restarting video replay...');
          await videoRef.current.pauseAsync();
          await videoRef.current.setPositionAsync(0);
          await new Promise(resolve => setTimeout(resolve, 200));
          setIsReplaying(true);
          await videoRef.current.playAsync();
        } else {
          // Resume from current position
          setIsReplaying(true);
          await videoRef.current.playAsync();
        }
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

    // For single full-video analysis, use frame_times_sec and frame_probabilities from the response
    const chunk = chunkResults[0];
    if (!chunk.frame_times_sec || !chunk.frame_probabilities || chunk.frame_probabilities.length === 0) {
      // Fallback: show chunk-based data (for backward compatibility)
      const labels = chunkResults.map((_, i) => `${i}s`);
      const data = chunkResults.map(r => r.cry_ratio * 100);
      return {
        labels: labels.length > 10 ? labels.filter((_, i) => i % 2 === 0) : labels,
        datasets: [{
          data,
          color: (opacity = 1) => `rgba(1, 204, 102, ${opacity})`,
          strokeWidth: 2,
        }],
      };
    }

    // Smooth the frame probabilities for wave-like curves
    const scaledProbs = chunk.frame_probabilities.map(p => p * 100);
    const smoothedProbs = smoothData(scaledProbs, 7); // Smooth with window size 7

    // Downsample for mobile (limit to ~40-50 points to avoid stretching)
    const maxPoints = 45;
    const step = Math.ceil(smoothedProbs.length / maxPoints);

    const dataPoints = smoothedProbs.filter((_, i) => i % step === 0);
    const labels = chunk.frame_times_sec
      .filter((_, i) => i % step === 0)
      .map(t => `${t.toFixed(1)}s`);

    // Create threshold line (constant value)
    const thresholdValue = (chunk.threshold || 0.5) * 100;
    const thresholdData = new Array(dataPoints.length).fill(thresholdValue);

    return {
      labels: labels.length > 10 ? labels.filter((_, i) => i % Math.ceil(labels.length / 6) === 0) : labels,
      datasets: [
        {
          data: dataPoints,
          color: (opacity = 1) => `rgba(1, 204, 102, ${opacity})`,
          strokeWidth: 2.5,
          withDots: false, // Remove dots for smoother look
        },
        {
          data: thresholdData,
          color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`,
          strokeWidth: 1.5,
          withDots: false,
          strokeDashArray: [5, 5],
        }
      ],
    };
  };

  const getReplayGraphData = () => {
    if (chunkResults.length === 0) {
      return {
        labels: ['0s'],
        datasets: [{ data: [0] }],
      };
    }

    // For replay mode with frame-based data, show only frames up to current playback time
    const chunk = chunkResults[0];
    if (!chunk.frame_times_sec || !chunk.frame_probabilities || chunk.frame_probabilities.length === 0) {
      // Fallback: show chunk-based data
      return getGraphData();
    }

    const currentTimeSeconds = currentTime / 1000;

    // Filter frames up to current playback time
    const visibleIndices = chunk.frame_times_sec
      .map((time, idx) => ({ time, idx }))
      .filter(({ time }) => time <= currentTimeSeconds)
      .map(({ idx }) => idx);

    if (visibleIndices.length === 0) {
      return {
        labels: ['0s'],
        datasets: [{ data: [0] }],
      };
    }

    // Get the visible frame data and smooth it
    const visibleProbs = visibleIndices.map(idx => chunk.frame_probabilities[idx] * 100);
    const smoothedProbs = smoothData(visibleProbs, 7); // Smooth for wave-like curves

    // Downsample visible points for mobile (limit to ~40-50 points)
    const maxPoints = 45;
    const step = Math.ceil(smoothedProbs.length / maxPoints);

    const dataPoints = smoothedProbs.filter((_, i) => i % step === 0);

    const labels = visibleIndices
      .filter((_, i) => i % step === 0)
      .map(idx => `${chunk.frame_times_sec[idx].toFixed(1)}s`);

    // Create threshold line
    const thresholdValue = (chunk.threshold || 0.5) * 100;
    const thresholdData = new Array(dataPoints.length).fill(thresholdValue);

    return {
      labels: labels.length > 10 ? labels.filter((_, i) => i % Math.ceil(labels.length / 6) === 0) : labels,
      datasets: [
        {
          data: dataPoints,
          color: (opacity = 1) => `rgba(1, 204, 102, ${opacity})`,
          strokeWidth: 2.5,
          withDots: false,
        },
        {
          data: thresholdData,
          color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`,
          strokeWidth: 1.5,
          withDots: false,
          strokeDashArray: [5, 5],
        }
      ],
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

            {/* Live Monitoring Button - Hidden for now */}
            {false && (
              <TouchableOpacity
                style={[styles.sourceButton, styles.liveButton]}
                onPress={handleStartLive}
              >
                <VideoIcon size={32} color={theme.colors.error} />
                <Text style={[styles.sourceButtonText, { color: theme.colors.error }]}>Start Live Monitoring</Text>
              </TouchableOpacity>
            )}
          </GlassCard>
        ) : !isLiveMode ? (
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
                <View style={styles.graphHeaderContainer}>
                  <Text style={styles.sectionTitle}>Cry Detection Over Time</Text>
                  {isReplaying && (
                    <View style={styles.replayIndicator}>
                      <Animated.View style={[styles.replayPulse, waveStyle]} />
                      <Text style={styles.replayText}>● LIVE</Text>
                    </View>
                  )}
                </View>

                <LineChart
                  data={isReplaying ? getReplayGraphData() : getGraphData()}
                  width={SCREEN_WIDTH - 48}
                  height={240}
                  chartConfig={{
                    backgroundColor: 'transparent',
                    backgroundGradientFrom: 'rgba(0, 0, 0, 0.1)',
                    backgroundGradientTo: 'rgba(0, 0, 0, 0.1)',
                    decimalPlaces: 1,
                    color: (opacity = 1) => `rgba(1, 204, 102, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    style: { borderRadius: 16 },
                    propsForDots: {
                      r: '0',
                      strokeWidth: '0',
                    },
                    propsForBackgroundLines: {
                      strokeDasharray: '0',
                      stroke: 'rgba(255, 255, 255, 0.1)',
                      strokeWidth: 0.5,
                    },
                  }}
                  bezier
                  style={styles.chart}
                />

                {/* Legend */}
                <View style={styles.legendContainer}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: theme.colors.primary }]} />
                    <Text style={styles.legendText}>Cry Probability</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: '#ff6b6b', borderWidth: 1, borderStyle: 'dashed', borderColor: '#ff6b6b' }]} />
                    <Text style={styles.legendText}>Threshold</Text>
                  </View>
                </View>

                <View style={styles.currentIndicator}>
                  {isReplaying && (
                    <Animated.View style={[styles.indicatorDot, waveStyle]} />
                  )}
                  {!isReplaying && (
                    <View style={styles.indicatorDot} />
                  )}
                  <Text style={styles.indicatorText}>
                    {isReplaying ? `Playing: ${formatTime(currentTime)} / ${formatTime(duration)}` : `Current: Chunk ${currentChunkIndex + 1}`}
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

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Threshold:</Text>
                  <Text style={styles.detailValue}>
                    {((currentChunk.threshold || 0.5) * 100).toFixed(1)}%
                  </Text>
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
        ) : (
          <>
            {/* LIVE CAMERA MODE */}
            <View style={styles.liveCameraContainer}>
              <CameraView
                ref={cameraRef}
                style={styles.liveCamera}
                facing="back"
              />

              {/* Live Camera Controls */}
              <View style={styles.liveCameraControls}>
                <TouchableOpacity
                  style={[styles.liveControlButton, { backgroundColor: theme.colors.error }]}
                  onPress={isRecordingLive ? handleStopLive : handleStartLive}
                >
                  <Square
                    size={28}
                    color="white"
                    fill={isRecordingLive ? theme.colors.error : undefined}
                  />
                  <Text style={styles.liveControlText}>
                    {isRecordingLive ? 'Stop Recording' : 'Start Recording'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.liveControlButton}
                  onPress={exitLiveMode}
                >
                  <X size={28} color={theme.colors.text} />
                  <Text style={styles.liveControlText}>Exit Live</Text>
                </TouchableOpacity>
              </View>

              {/* Recording Stats */}
              {isRecordingLive && (
                <View style={styles.liveStatsContainer}>
                  <View style={styles.recordingIndicator}>
                    <View style={styles.recordingDot} />
                    <Text style={styles.recordingText}>RECORDING</Text>
                  </View>
                  <Text style={styles.liveStatsText}>
                    Time: {liveRecordingTime}s | Segments: {liveChunkResults.length}
                  </Text>
                </View>
              )}
            </View>

            {/* Live Graph Display */}
            {liveChunkResults.length > 0 && (
              <GlassCard style={styles.videoCard}>
                <Text style={styles.sectionTitle}>Live Detection Results</Text>
                
                {/* Stats */}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Segments Analyzed:</Text>
                  <Text style={styles.detailValue}>{liveChunkResults.length}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Segments with Crying:</Text>
                  <Text style={styles.detailValue}>
                    {liveChunkResults.filter(r => r.any_cry).length}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Average Cry Ratio:</Text>
                  <Text style={styles.detailValue}>
                    {(liveChunkResults.reduce((sum, r) => sum + r.cry_ratio, 0) / liveChunkResults.length * 100).toFixed(1)}%
                  </Text>
                </View>

                {/* Live Graph */}
                {liveChunkResults.length > 0 && (
                  <View style={styles.graphContainer}>
                    <LineChart
                      data={{
                        labels: liveChunkResults.map((_, i) => `${i * 10}s`),
                        datasets: [
                          {
                            data: liveChunkResults.map(r => r.cry_ratio * 100),
                            color: (opacity = 1) => `rgba(1, 204, 102, ${opacity})`,
                            strokeWidth: 2.5,
                            withDots: false,
                          },
                          {
                            data: liveChunkResults.map(r => (r.threshold || 0.5) * 100),
                            color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`,
                            strokeWidth: 1.5,
                            withDots: false,
                            strokeDashArray: [5, 5],
                          }
                        ],
                      }}
                      width={SCREEN_WIDTH - 48}
                      height={240}
                      fromZero={true}
                      yAxisLabel=""
                      yAxisSuffix="%"
                      chartConfig={{
                        backgroundColor: 'transparent',
                        backgroundGradientFrom: 'transparent',
                        backgroundGradientTo: 'transparent',
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.5})`,
                        labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.7})`,
                        style: {
                          borderRadius: 16,
                        },
                        propsForDots: {
                          r: '0',
                          strokeWidth: '0',
                        },
                      }}
                      bezier
                      style={styles.chart}
                    />

                    {/* Legend */}
                    <View style={styles.legendContainer}>
                      <View style={styles.legendItem}>
                        <View style={[styles.legendColor, { backgroundColor: theme.colors.primary }]} />
                        <Text style={styles.legendText}>Cry Probability</Text>
                      </View>
                      <View style={styles.legendItem}>
                        <View style={[styles.legendColor, { backgroundColor: '#ff6b6b', borderWidth: 1, borderStyle: 'dashed', borderColor: '#ff6b6b' }]} />
                        <Text style={styles.legendText}>Threshold</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Recent Detections */}
                <View style={styles.segmentsContainer}>
                  <Text style={styles.segmentsTitle}>Recent Segments:</Text>
                  {liveChunkResults.slice(-5).reverse().map((result, index) => (
                    <View key={index} style={styles.detailRow}>
                      <Text style={styles.detailLabel}>
                        Segment {result.chunkIndex + 1} ({result.chunkIndex * 10}s):
                      </Text>
                      <Text style={[
                        styles.detailValue,
                        { color: result.any_cry ? theme.colors.error : theme.colors.success }
                      ]}>
                        {result.any_cry ? 'CRY' : 'OK'} ({(result.cry_ratio * 100).toFixed(1)}%)
                      </Text>
                    </View>
                  ))}
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
  graphHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  replayIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(1, 204, 102, 0.2)',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  replayPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  replayText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 1,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.lg,
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
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
  // Live Camera Styles
  liveButton: {
    marginTop: theme.spacing.md,
    width: '100%',
  },
  liveCameraContainer: {
    position: 'relative',
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  liveCamera: {
    width: '100%',
    height: 400,
    backgroundColor: '#000',
  },
  liveCameraControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
  },
  liveControlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  liveControlText: {
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  liveStatsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.error,
  },
  recordingText: {
    color: theme.colors.error,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 1,
  },
  liveStatsText: {
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
});
