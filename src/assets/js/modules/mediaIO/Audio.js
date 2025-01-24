/**
 * Class AudioEgress
 */
export default class AudioEgress {

    jitsiAPI = null;
    iframe = null;

    mergerNode = null;
    gainNode = null;
    audioNode = null;
    participantsMap = null;
    activeAudioStreams = null;

    constructor(jitsiAPI) {
        if (jitsiAPI) {
            this.jitsiAPI = jitsiAPI;
            this.iframe = jitsiAPI.getIFrame();
        }
        this.wsUrl = 'ws://127.0.0.1:9000';
        this.ws = null;
        this.audioContext = new AudioContext({ sampleRate: 8000 });
        this.mergerNode = this.audioContext.createChannelMerger();
        this.gainNode = this.audioContext.createGain();
        this.audioNode = null;
        this.participantsMap = new Map();
        this.activeAudioStreams = new Set();
        this.intervalId = null;
        this.reconnectTimeout = null; // Reconnection timeout handler
    }

    async init() {
        this.setupWebSocket();

        // Load AudioWorkletProcessor
        await this.audioContext.audioWorklet.addModule('data:application/javascript,' + encodeURIComponent(`
            class AudioProcessor extends AudioWorkletProcessor {
                constructor() {
                    super();
                    this.buffer = [];
                    this.pkt_size = 160;
                }

                process(inputs) {
                    const input = inputs[0];
                    if (input && input[0]) {
                        const audioData = input[0];
                        this.buffer.push(...audioData);

                        if (this.buffer.length >= this.pkt_size) {
                            this.port.postMessage(this.buffer.slice(0, this.pkt_size));
                            this.buffer = this.buffer.slice(this.pkt_size);
                        }
                    }
                    return true;
                }
            }
            registerProcessor('audio-processor', AudioProcessor);
        `));

        // Configure audio mixing
        this.audioNode = new AudioWorkletNode(this.audioContext, 'audio-processor');
        this.mergerNode.connect(this.gainNode);
        this.gainNode.connect(this.audioNode);
        this.audioNode.connect(this.audioContext.destination);

        // Send (mixed) audio data
        this.audioNode.port.onmessage = event => {
            const audioData = event.data;
            const audioBuffer = this.float32ToInt16(audioData);
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(audioBuffer);
                console.log('Mixed audio data sent');
            }
        };

        console.log('AudioStreamManager initialized.');
    }

    setupWebSocket() {
        // Initialize WebSocket connection
        this.ws = new WebSocket(this.wsUrl);

        this.ws.onopen = () => {
            console.log('WebSocket connected.');
            if (this.reconnectTimeout) {
                clearTimeout(this.reconnectTimeout);
                this.reconnectTimeout = null;
            }
        };

        this.ws.onmessage = event => {
            console.log('Message from server:', event.data);
        };

        this.ws.onerror = err => {
            console.error('WebSocket error:', err);
        };

        this.ws.onclose = event => {
            console.warn('WebSocket closed. Reason:', event.reason || 'Unknown');
            if (!event.wasClean) {
                console.warn('Unexpected disconnection from server.');
                this.handleServerDisconnection();
            }
        };
    }

    handleServerDisconnection() {
        // Stop scanning participants and clean up
        this.stopScan();

        // Notify user about server unavailability
        console.error('The server is unavailable. Stopping audio transmission.');

        // Optionally, attempt reconnection
        this.reconnectTimeout = setTimeout(() => {
            console.log('Attempting to reconnect to the server...');
            this.setupWebSocket();
        }, 5000); // Retry after 5 seconds
    }

    async close() {
        this.stopScan();
        this.participantsMap.forEach((_, name) => this.removeParticipant(name));
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        await this.audioContext.close();
        console.log('AudioStreamManager closed.');
    }

    float32ToInt16(float32Array) {
        const int16Array = new Int16Array(float32Array.length);

        for (let i = 0; i < float32Array.length; i++) {
            const s = Math.max(-1, Math.min(1, float32Array[i]));
            int16Array[i] = s * 32768; 
        }

        console.log(`float32Array: min=${Math.min(...float32Array)}, max=${Math.max(...float32Array)}`);
        console.log(`int16Array: min=${Math.min(...int16Array)}, max=${Math.max(...int16Array)}`);

        return new Uint8Array(int16Array.buffer);
    }

    addParticipant(name, audioElement, muted) {
        if (muted || this.participantsMap.has(name)) return;

        const audioStream = audioElement.srcObject;
        const audioSource = this.audioContext.createMediaStreamSource(audioStream);
        console.log('Sampling rate of mixed steam:', this.audioContext.sampleRate);
        audioSource.connect(this.mergerNode); // add to mixer
        this.participantsMap.set(name, { audioSource, muted });

        console.log(`Added participant : ${name}`);
    }

    removeParticipant(name) {
        const participant = this.participantsMap.get(name);
        if (participant) {
            participant.audioSource.disconnect();
            this.participantsMap.delete(name);
            console.log(`Deleted participant : ${name}`);
        }
    }

    updateParticipantMuteStatus(name, muted, audioElement) {
        if (muted) {
            this.removeParticipant(name);
        } else if (!this.participantsMap.has(name)) {
            this.addParticipant(name, audioElement, muted);
        }
    }

    scanParticipants() {

        let iframeDoc = this.iframe.contentWindow.document;

        // Look for remote audio elements
        const audioElements = iframeDoc.querySelectorAll('audio[id^="remoteAudio_remote-audio-"]');
        const currentParticipants = new Set();

        audioElements.forEach(audioElement => {
            // Extract element index
            const audioId = audioElement.id;
            const index = audioId.replace('remoteAudio_remote-audio-', '');

            // Build corresponding video ID
            const videoId = `remoteVideo_remote-video-${index}`;
            const videoElement = iframeDoc.getElementById(videoId);

            // Look for video container
            const videoContainer = videoElement?.closest('span.videocontainer:not(#localVideocontainer)');

            if (videoContainer) {
                // Look for participant name
                const nameElement = videoContainer.querySelector('.displayname');
                const participantName = nameElement ? nameElement.textContent.trim() : null;

                // Detect mute state
                const mutedIndicator = videoContainer.querySelector('#audioMuted');
                const isMuted = !!mutedIndicator;

                if (participantName) {
                    currentParticipants.add(participantName);

                    if (!this.participantsMap.has(participantName)) {
                        this.addParticipant(participantName, audioElement, isMuted);
                    } else {
                        this.updateParticipantMuteStatus(participantName, isMuted, audioElement);
                    }
                }
            }
        });

        // Delete participants who left the meeting
        Array.from(this.participantsMap.keys()).forEach(name => {
            if (!currentParticipants.has(name)) {
                this.removeParticipant(name);
            }
        });

        // Print mappings
        console.log(this.participantsMap);
    }

    startScan(interval = 2000) {
        this.intervalId = setInterval(() => this.scanParticipants(), interval);
        console.log('Participant scan started');
    }

    stopScan() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('Participant scan stopped');
        }
    }

    async close() {
        this.stopScan();
        this.participantsMap.forEach((_, name) => this.removeParticipant(name));
        if (this.ws) this.ws.close();
        await this.audioContext.close();
        console.log('AudioStreamManager fermé.');
    }
}
