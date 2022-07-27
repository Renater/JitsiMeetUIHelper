export default class TTS {

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
