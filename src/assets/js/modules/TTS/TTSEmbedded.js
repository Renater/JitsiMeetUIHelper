import Config from "../Config.js";
import Lang from "../Lang.js";

export default class TTSEmbedded{


    /**
     * Voice to use
     *
     * @type {null|SpeechSynthesisVoice}
     */
    static voice = null;

    /**
     * EXPERIMENTAL
     * Use browser embedded TTS
     * @link https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance
     *
     * @param text Text to be spoken
     */
    static speak(text = null) {
        if (text instanceof Array){
            let tmp = [];
            for (const key of text) {
                tmp.push(key === ". !" ? key : Lang.translate(key));
            }
            text = tmp;
        }else{
            text = Lang.translate(text);
        }
        // Speak only if enabled in config
        if (text !== null) {

            let utterance = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.cancel()
            utterance.pitch = 1;
            utterance.rate = 1;
            utterance.volume = 1;
            utterance.lang = Config.get('lang');

            if (TTSEmbedded.voice !== null)
                utterance.voice = TTSEmbedded.voice;

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
            if (voice.lang === lang && voice.localService === true){
                TTSEmbedded.voice = voice;
                break;
            }
        }
    }
}