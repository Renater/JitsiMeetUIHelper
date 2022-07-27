import JitsiMeetUIHelper from './JitsiMeetUIHelper.js';
import Lang from './modules/Lang.js';

/* Get translations */
Lang.init();

/* Initiate IFrame */
var helper = new JitsiMeetUIHelper();

/* Add listener for click on show DTMF menu */
helper.dtmfMenuButton.addEventListener('click', function(){
    helper.executeCommand('show-dtmf-menu');
});

