import Config from "./Config.js";

export default class TTS {

    /**
     * Return true if IVR is enabled in config
     *
     * @returns {boolean}
     */
    static enabled(){
        return Config.get('tts.enabled') === true;
    }

    /**
     * EXPERIMENTAL
     * Use browser embedded TTS
     * @see https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance
     *
     * @param text Text to be spoken
     */
    static speak(text = null) {
        // Speak only if enabled in config
        if (text !== null) {
            let utterance = new SpeechSynthesisUtterance(text);
            speechSynthesis.speak(utterance);
        }
    }
}
