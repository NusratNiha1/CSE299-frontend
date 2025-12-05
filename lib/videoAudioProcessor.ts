import * as FileSystem from 'expo-file-system/legacy';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';

export interface AudioChunk {
    uri: string;
    startTime: number;
    endTime: number;
    duration: number;
    arrayBuffer?: ArrayBuffer;
}

/**
 * Extracts and processes audio from video files for cry detection
 */
export class VideoAudioProcessor {
    /**
     * Get video/audio duration in milliseconds
     */
    static async getVideoDuration(videoUri: string): Promise<number> {
        try {
            // On Web, try using HTML Audio element if expo-av fails or as a fallback
            if (Platform.OS === 'web') {
                return new Promise((resolve, reject) => {
                    const audio = new window.Audio(videoUri);
                    audio.onloadedmetadata = () => {
                        if (audio.duration === Infinity || isNaN(audio.duration)) {
                            // Fallback to expo-av if HTML Audio fails to get duration
                            this.getVideoDurationExpo(videoUri).then(resolve).catch(reject);
                        } else {
                            resolve(audio.duration * 1000);
                        }
                    };
                    audio.onerror = () => {
                        // Fallback to expo-av
                        this.getVideoDurationExpo(videoUri).then(resolve).catch(reject);
                    };
                });
            }

            return await this.getVideoDurationExpo(videoUri);
        } catch (error) {
            console.error('Error getting video duration:', error);
            throw error;
        }
    }

    private static async getVideoDurationExpo(videoUri: string): Promise<number> {
        const { sound } = await Audio.Sound.createAsync(
            { uri: videoUri },
            { shouldPlay: false }
        );

        const status = await sound.getStatusAsync();
        await sound.unloadAsync();

        if (status.isLoaded && status.durationMillis) {
            return status.durationMillis;
        }

        throw new Error('Could not determine video duration');
    }

    /**
     * Split audio into 4-second chunks metadata
     */
    static async splitIntoChunks(
        videoUri: string,
        chunkDurationMs: number = 4000
    ): Promise<AudioChunk[]> {
        const totalDuration = await this.getVideoDuration(videoUri);
        const numChunks = Math.ceil(totalDuration / chunkDurationMs);
        const chunks: AudioChunk[] = [];

        for (let i = 0; i < numChunks; i++) {
            const startTime = i * chunkDurationMs;
            const endTime = Math.min((i + 1) * chunkDurationMs, totalDuration);

            chunks.push({
                uri: videoUri,
                startTime,
                endTime,
                duration: endTime - startTime,
            });
        }

        return chunks;
    }

    /**
     * Extract a specific audio chunk from video at time range
     * Returns ArrayBuffer suitable for sending to API
     */
    static async extractAudioChunk(
        videoUri: string,
        startMs: number,
        endMs: number
    ): Promise<ArrayBuffer> {
        try {
            // On Web, we can't use FileSystem.readAsStringAsync for blobs
            if (Platform.OS === 'web') {
                const response = await fetch(videoUri);
                const buffer = await response.arrayBuffer();
                return buffer;
            }

            // On Native, use FileSystem
            const fileInfo = await FileSystem.getInfoAsync(videoUri);

            if (!fileInfo.exists) {
                throw new Error('Video file not found');
            }

            // LIMITATION: Without ffmpeg-kit, we cannot properly split video files into valid audio chunks.
            // Reading the whole file causes OOM and network errors.
            // For now, we read a small portion of the file to test connectivity and basic processing.
            // In a real app, you MUST use ffmpeg-kit-react-native or send the whole video to the backend.

            // Read only the first 512KB to avoid "Failed to fetch" due to payload size
            const MAX_BYTES = 512 * 1024;
            const base64 = await FileSystem.readAsStringAsync(videoUri, {
                encoding: 'base64',
                length: Math.min(MAX_BYTES, fileInfo.size || MAX_BYTES)
            });

            // Convert base64 to ArrayBuffer
            const binaryString = atob(base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            return bytes.buffer;
        } catch (error) {
            console.error('Error extracting audio chunk:', error);
            throw error;
        }
    }

    /**
     * Extract full audio from video file
     * Returns ArrayBuffer suitable for sending to API
     * NOTE: This reads the entire video file - for actual audio extraction,
     * you would need ffmpeg or similar tool. This is a simplified version.
     */
    static async extractFullAudio(videoUri: string): Promise<ArrayBuffer> {
        try {
            // On Web, fetch the entire file
            if (Platform.OS === 'web') {
                const response = await fetch(videoUri);
                const buffer = await response.arrayBuffer();
                return buffer;
            }

            // On Native, read the file
            const fileInfo = await FileSystem.getInfoAsync(videoUri);

            if (!fileInfo.exists) {
                throw new Error('Video file not found');
            }

            // Read the entire file as base64
            const base64 = await FileSystem.readAsStringAsync(videoUri, {
                encoding: 'base64'
            });

            // Convert base64 to ArrayBuffer
            const binaryString = atob(base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            return bytes.buffer;
        } catch (error) {
            console.error('Error extracting full audio:', error);
            throw error;
        }
    }

    /**
     * Extract the last N seconds of audio from a video file (for live recording)
     * Used during live camera recording to extract recent segments
     */
    static async extractLastNSecondsAudio(
        videoUri: string,
        durationSeconds: number = 10
    ): Promise<ArrayBuffer> {
        try {
            // On Web, fetch the entire file
            if (Platform.OS === 'web') {
                const response = await fetch(videoUri);
                const buffer = await response.arrayBuffer();
                return buffer;
            }

            // On Native, read the file
            const fileInfo = await FileSystem.getInfoAsync(videoUri);

            if (!fileInfo.exists) {
                throw new Error('Video file not found');
            }

            // For live recording, read the entire accumulated file
            // (In a real implementation with proper video handling, 
            // you would extract only the last N seconds, but without ffmpeg
            // we read what we have)
            const base64 = await FileSystem.readAsStringAsync(videoUri, {
                encoding: 'base64'
            });

            // Convert base64 to ArrayBuffer
            const binaryString = atob(base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            return bytes.buffer;
        } catch (error) {
            console.error('Error extracting audio from live recording:', error);
            throw error;
        }
    }

    /**
     * Convert ArrayBuffer to Blob for upload
     */
    static arrayBufferToBlob(buffer: ArrayBuffer, mimeType: string = 'audio/wav'): Blob {
        return new Blob([buffer], { type: mimeType });
    }
}
