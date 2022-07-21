window.onload = function() {
    /* Initiate IFrame */
    let helper = new JitsiMeetUIHelper('main_iframe');

    /* Add listener for click on show DTMF menu */
    helper.dtmfMenuButton.addEventListener('click', function(event){
        helper.executeCommand('show-dtmf-menu');
    });
};

