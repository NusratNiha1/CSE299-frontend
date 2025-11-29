// API client for cry detection backend
const CRY_DETECTION_API_URL = 'https://julissa-unimpressive-felicia.ngrok-free.dev/predict';

export interface CryDetectionResponse {
    any_cry: boolean;
    cry_ratio: number;
    frame_predictions: number[];
    frame_probabilities: number[];
    frame_times_sec: number[];
    model: string;
    num_frames: number;
    segments: Array<{
        duration: number;
        end: number;
        start: number;
    }>;
    threshold: number;
}

/**
 * Sends an audio chunk to the cry detection backend
 * @param audioBlob - The audio file blob (4 second chunk)
 * @returns Promise with cry detection results
 */
export async function detectCry(audioBlob: Blob | ArrayBuffer): Promise<CryDetectionResponse> {
    const formData = new FormData();

    // Convert ArrayBuffer to Blob if needed
    const blob = audioBlob instanceof ArrayBuffer
        ? new Blob([audioBlob], { type: 'audio/wav' })
        : audioBlob;

    formData.append('audio', blob as any, 'audio.wav');

    console.log('--- API Request Debug Info ---');
    console.log('URL:', CRY_DETECTION_API_URL);
    console.log('Blob Info:', {
        size: blob.size,
        type: blob.type,
        isBlob: blob instanceof Blob
    });

    const headers = {
        'Accept': 'application/json',
        'ngrok-skip-browser-warning': 'true',
    };
    console.log('Headers:', headers);
    console.log('Body: FormData with audio file "audio.wav"');
    console.log('------------------------------');

    // React Native specific: sometimes fetch needs help with FormData
    const response = await fetch(CRY_DETECTION_API_URL, {
        method: 'POST',
        body: formData,
        headers: headers,
    });

    console.log('Response status:', response.status);

    try {
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Cry detection failed: ${response.status} - ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Fetch error details:', error);
        throw error;
    }
}

/**
 * Process video in chunks and detect crying
 * @param videoUri - URI of the video file
 * @param onProgress - Callback for progress updates
 * @param onChunkResult - Callback for each chunk's result
 */
export async function processVideoForCryDetection(
    videoUri: string,
    onProgress?: (progress: number) => void,
    onChunkResult?: (result: CryDetectionResponse, chunkIndex: number) => void
): Promise<CryDetectionResponse[]> {
    // This will be implemented with video processing logic
    // For now, return empty array - actual implementation will use expo-av
    return [];
}
