class Participant {
    constructor(name, startTime, audioContext, audioSource, audioNode) {
        this.name = name;
        this.startTime = startTime;
        this.ws = null;
        this.audioContext = audioContext;
        this.audioSource = audioSource;
        this.audioNode = audioNode;
    }

    createWebSocket(wsBaseUrl) {
        const wsUrl = `${wsBaseUrl}/${encodeURIComponent(this.name)}`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log(`WebSocket connected for participant: ${this.name}`);
        };

        this.ws.onerror = err => {
            console.error(`WebSocket error for participant ${this.name}:`, err);
        };

        this.ws.onclose = () => {
            console.log(`WebSocket closed for participant: ${this.name}`);
        };
    }

    sendAudio(samples) {
        if (this.ws.readyState === WebSocket.OPEN) {
            const payload = {
                start_time: this.startTime, // Start time of the stream
                data: samples, // PCM samples array
            };
            this.ws.send(JSON.stringify(payload));
        }
    }

    close() {
        this.audioSource.disconnect();
        this.audioNode.disconnect();
        this.audioContext.close();
        this.ws.close();
        console.log(`Closed participant: ${this.name}`);
    }
}


/**
 * Class AudioEgress
 */
export default class AudioEgress {
    constructor(jitsiAPI, wsBaseUrl = 'ws://127.0.0.1:9000') {
        if (!jitsiAPI) throw new Error("Jitsi API instance is required");

        this.jitsiAPI = jitsiAPI;
        this.iframe = jitsiAPI.getIFrame();
        this.participants = new Map();  // Key = participant name

        this.wsBaseUrl = wsBaseUrl;
        this.trackAddedListenerAttached = false;
        this.trackRemovedListenerAttached = false;

        this.init();
    }

    async init() {
        const jitsiRoom = this.iframe.contentWindow.APP.conference._room;

        // check existing audio tracks
        jitsiRoom.participants.forEach((participant) => {
            participant._tracks.forEach((track) => {
                if (track.getType() === "audio" && !track.isMuted()) {
                    this.handleTrackAdded(track);
                }
            });
        });

        // wait for new audio tracks
        if (!this.trackAddedListenerAttached) {
            this.trackAddedListenerAttached = true;
            jitsiRoom.on(this.iframe.contentWindow.JitsiMeetJS.events.conference.TRACK_ADDED,
                         (track) => this.handleTrackAdded(track));
        }

        if (!this.trackRemovedListenerAttached) {
            this.trackRemovedListenerAttached = true;
            jitsiRoom.on(this.iframe.contentWindow.JitsiMeetJS.events.conference.TRACK_REMOVED,
                         (track) => this.handleTrackRemoved(track));
        }
    }

    async handleTrackAdded(track) {
        //if (track.getType() !== "audio" || track.isMuted()) return;
        if (track.getType() !== "audio") return;

        const participantId = track.getParticipantId();
        const participant = this.getParticipantName(participantId);

        if (!participant) {
            console.warn('No participant found with ID: ${participantId}');
            return;
        }

        if (this.participants.has(participant)) {
            console.warn('Audio already captured for: ${participant}');
            return;
        }

        console.log('Audio captured for: ${participant}');

        const mediaStream = new MediaStream([track.getOriginalStream().getAudioTracks()[0]]);
        const startTime = Date.now();

        const newParticipant = await this.createParticipant(participant, mediaStream, startTime);

        this.participants.set(participant, newParticipant);
    }

    handleTrackRemoved(track) {
        if (track.getType() !== "audio") return;

        const participantId = track.getParticipantId();
        const participant = this.getParticipantName(participantId);

        if (this.participants.has(participant)) {
            console.log('Audio stopped for ${participant}');
            this.participants.get(participant).close();
            this.participants.delete(participant);
        }
    }

    float32ToInt16(float32Array) {
        const int16Array = new Int16Array(float32Array.length);
        for (let i = 0; i < float32Array.length; i++) {
            const s = Math.max(-1, Math.min(1, float32Array[i]));
            int16Array[i] = s * 32768;
        }
        return Array.from(int16Array);
    }

    async createParticipant(name, mediaStream, startTime) {
        const audioContext = new AudioContext();
        await audioContext.audioWorklet.addModule('data:application/javascript,' + encodeURIComponent(`
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

        const audioSource = audioContext.createMediaStreamSource(mediaStream);
        const audioNode = new AudioWorkletNode(audioContext, 'audio-processor');

        const participant = new Participant(name, startTime, audioContext, audioSource, audioNode);
        participant.createWebSocket(this.wsBaseUrl);

        audioNode.port.onmessage = (event) => {
            const audioData = event.data;
            const audioPcm = this.float32ToInt16(audioData);
            participant.sendAudio(audioPcm);
        };

        audioSource.connect(audioNode).connect(audioContext.destination);
        return participant;
    }

    getParticipantName(participantId) {
        const jitsiRoom = this.iframe.contentWindow.APP.conference._room;
        const participantEntry = Array.from(jitsiRoom.participants.entries())
            .find(([_, p]) => p._id === participantId);

        return participantEntry ? participantEntry[1]._displayName : null;
    }
}
