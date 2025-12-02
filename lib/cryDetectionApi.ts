// API client for cry detection backend
export const CRY_DETECTION_API_URL = 'https://julissa-unimpressive-felicia.ngrok-free.dev/predict';

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
export async function detectCry(audioBlob: Blob | ArrayBuffer | { uri: string; name?: string; type?: string }): Promise<CryDetectionResponse> {
    const formData = new FormData();

    // If it's a React Native file object (uri), append it directly
    if (typeof audioBlob === 'object' && (audioBlob as any).uri) {
        const fileObj: any = audioBlob;
        // Try to infer type from provided value
        const inferredType = fileObj.type || (fileObj.name ? guessMimeType(fileObj.name) : 'audio/wav');
        formData.append('audio', {
            uri: fileObj.uri,
            name: fileObj.name || 'audio.wav',
            type: inferredType,
        } as any);
        console.log('Detected RN file upload:', { uri: fileObj.uri, name: fileObj.name, type: inferredType });
    } else {
        // Convert ArrayBuffer to Blob if needed
        const blob = audioBlob instanceof ArrayBuffer
            ? new Blob([audioBlob], { type: 'audio/wav' })
            : audioBlob as Blob;
        formData.append('audio', blob as any, 'audio.wav');
    }

    console.log('--- API Request Debug Info ---');
    console.log('URL:', CRY_DETECTION_API_URL);
    console.log('Blob Info:', {
        size: blob.size,
        type: blob.type,
        isBlob: blob instanceof Blob
    });

    const headers: any = {
        'Accept': 'application/json',
        'ngrok-skip-browser-warning': 'true',
    };
    console.log('Headers:', headers);
    console.log('Sending FormData to:', CRY_DETECTION_API_URL);
    console.log('Body: FormData with audio file "audio.wav"');
    console.log('------------------------------');

    // React Native specific: sometimes fetch needs help with FormData
    const response = await fetch(CRY_DETECTION_API_URL, {
        method: 'POST',
        body: formData,
        // Do NOT set Content-Type for multipart in React Native; let the runtime set the correct boundary
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

// Small helper for guessing MIME types by file extension
function guessMimeType(name: string): string {
    const ext = name.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'mp3': return 'audio/mpeg';
        case 'wav': return 'audio/wav';
        case 'm4a': return 'audio/mp4';
        case 'aac': return 'audio/aac';
        case 'oga': return 'audio/ogg';
        case 'ogg': return 'audio/ogg';
        default: return 'audio/wav';
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
