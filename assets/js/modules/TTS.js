import Config from "./Config.js";

export default class TTS {

    /**
     * Voice to use
     *
     * @type {null|SpeechSynthesisVoice}
     */
    static voice = null;

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
     * @link https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance
     *
     * @param text Text to be spoken
     */
    static speak(text = null) {
        // Speak only if enabled in config
        if (text !== null && TTS.enabled()) {

            let utterance = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.cancel()
            utterance.pitch = 1;
            utterance.rate = 1;
            utterance.volume = 1;
            utterance.lang = Config.get('lang');

            if (TTS.voice !== null)
                utterance.voice = TTS.voice;

            window.speechSynthesis.speak(utterance);
        }
    }


    /**
     * Init voices to use the best one
     */
    static initVoice(){
        let lang = Config.get('lang');
        lang = `${lang}-${lang.toUpperCase()}`;

        let voices = window.speechSynthesis.getVoices();

        for(let voice of voices){
            if (voice.lang === lang){
                TTS.voice = voice;
                break;
            }
        }
    }
}
