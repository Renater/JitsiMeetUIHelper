import Config from "./Config.js";
import TTSEmbedded from "./TTS/TTSEmbedded.js"
import TTSLocalFiles from "./TTS/TTSLocalFiles.js"

export default class TTS {

    /**
     * Engine to use
     * @type {TTSEmbedded|TTSLocalFiles}
     */
    static engine = null;

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
        const eng = Config.get('tts.engine');
        switch (eng){
            case 'embedded':
                TTSEmbedded.speak(text);
                break;

            case 'local_files':
                TTSLocalFiles.speak(text);
                break;

            default:
                    console.error('Unknown TTS engine: '+eng);
        }
    }
}
