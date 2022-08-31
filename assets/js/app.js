import JitsiMeetUIHelper from './JitsiMeetUIHelper.js';
import Lang from './modules/Lang.js';
import TTS from './modules/TTS.js';



/* Get translations */
Lang.init()
    .then(() => {
        /* Initiate IFrame */
        const helper = new JitsiMeetUIHelper();

        /* Init lang for TTS */
        if (TTS.enabled()){
            window.speechSynthesis.onvoiceschanged = function() {
                TTS.initVoice();
            };
        }

        /* Add listener for click on show DTMF menu */
        helper.dtmfMenuButton.addEventListener('click', function(){
            helper.executeCommand('show-dtmf-menu');
        });
    });


