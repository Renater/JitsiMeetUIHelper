
import Lang from '../Lang.js';

export default class TTSLocalFiles {

    /**
     * Audio files queue
     *
     * @type {[Audio]}
     */
    static queue = [];

    /**
     * Index in queue of audio file being played
     *
     * @type {number}
     */
    static currentSound = 0;


    /**
     * Use local generated files as TTS
     *
     *  @param text File key to be spoken
     */
    static speak(text = null) {
        // Reset queue to force pause when this function is called
        this.reset();

        if (text instanceof Array){
            for (const key of text) {
                if (key !== ". !")
                    this.queue.push(new Audio(`/assets/lang/files/${Lang.langCode}/${key}.mp3`));
            }
        }else{
            this.queue.push(new Audio(`/assets/lang/files/${Lang.langCode}/${text}.mp3`));
        }

        this.queue.forEach((sound) => {
            sound.onended = TTSLocalFiles.onEnded;
        })
        this.queue[0].play();
    }

    /**
     * Event called when audio listening is ended
     */
    static onEnded(){
        TTSLocalFiles.currentSound++;
        if (TTSLocalFiles.currentSound < TTSLocalFiles.queue.length) {
            TTSLocalFiles.queue[TTSLocalFiles.currentSound].play()
        }else{
            // Reset queue
            TTSLocalFiles.reset();
        }
    }

    /**
     * Reset queue and index of currently playing audio file
     */
    static reset(){
        TTSLocalFiles.currentSound = 0
        for (let audio of TTSLocalFiles.queue) {
            if (!audio.paused) audio.pause();
        }
        TTSLocalFiles.queue = [];
    }
}