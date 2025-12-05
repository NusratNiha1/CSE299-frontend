// API client for cry detection backend
// Use local proxy to bypass CORS on web, or direct ngrok URL for native
export const CRY_DETECTION_API_URL =
    typeof window !== 'undefined' && window.location?.hostname === 'localhost'
        ? 'http://localhost:3000/cry-detection/predict'  // Use proxy for web
        : 'https://julissa-unimpressive-felicia.ngrok-free.dev/predict';  // Direct for native

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
 * Sends an audio/video file to the cry detection backend
 * @param audioBlob - The audio file blob, ArrayBuffer, or React Native file object with uri
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
        console.log('📤 Sending React Native file:', { 
            uri: fileObj.uri, 
            name: fileObj.name || 'audio.wav', 
            type: inferredType 
        });
    } else if (audioBlob instanceof ArrayBuffer) {
        // For ArrayBuffer, we cannot create Blob in React Native
        // Instead, try to append it directly (this may fail on React Native)
        console.warn('⚠️ ArrayBuffer detected - this may not work on React Native. Consider using file URI instead.');
        try {
            const blob = new Blob([audioBlob], { type: 'audio/wav' });
            formData.append('audio', blob as any, 'audio.wav');
            console.log('Blob created from ArrayBuffer:', { size: blob.size, type: blob.type });
        } catch (e) {
            console.error('Failed to create Blob from ArrayBuffer:', e);
            throw new Error('Cannot create Blob from ArrayBuffer on this platform. Please use file URI instead.');
        }
    } else {
        // It's already a Blob
        const blob = audioBlob as Blob;
        formData.append('audio', blob as any, 'audio.wav');
        console.log('📤 Sending Blob:', {
            size: blob.size,
            type: blob.type,
            isBlob: blob instanceof Blob
        });
    }

    console.log('--- API Request Debug Info ---');
    console.log('URL:', CRY_DETECTION_API_URL);

    const headers: any = {
        'Accept': 'application/json',
        'ngrok-skip-browser-warning': 'true',
    };
    console.log('Headers:', headers);
    console.log('Sending FormData to:', CRY_DETECTION_API_URL);
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
