import Config from './Config.js';
import Utils from './Utils.js';
import JitsiMeetUIHelper from '../JitsiMeetUIHelper.js';
import TTS from './TTS.js';
import Lang from './Lang.js';

/**
 * Class IVR
 */
export default class IVR {

    /**
     * Input room ID
     * @type {null|HTMLElement}
     */
    inputRoomID = null;

    /**
     * Open room button
     *
     * @type {HTMLElement|null}
     */
    enterRoomBtn = null;

    /**
     * Main IVR container
     * @type {HTMLElement|null}
     */
    mainIvrContainer = null;

    /**
     * Room ID typed by user
     * @type {String}
     */
    roomID = "";

    /**
     * Loader
     *
     * @type {HTMLElement|null}
     */
    loader = null;


    /**
     * JitsiMeetUIHelper instance
     *
     * @type {null|JitsiMeetUIHelper}
     */
    helper = null;


    /**
     * IVR constructor
     */
    constructor() {
        // IVR disabled in config
        if (!this.enabled()) return;

        if (window.IVR !== undefined) return window.IVR;

        // Init UI elements
        this.inputRoomID = document.getElementById('input_room_id');
        this.mainIvrContainer = document.getElementById('ivr_container');
        this.enterRoomBtn = document.getElementById('btn_enter_room');
        this.loader = document.getElementById('loader');

        let context = this;
        this.helper = new JitsiMeetUIHelper();

        // Set min & max length
        this.inputRoomID.setAttribute("minlength", Config.get('ivr.conference_code.min_length'));
        this.inputRoomID.setAttribute("maxlength", Config.get('ivr.conference_code.max_length'));

        // Listen to keydown events on input
        this.inputRoomID.addEventListener('keydown', function (event){
            context.onKeydown(event);
        });

        // Listen to click on enter room button
        this.enterRoomBtn.addEventListener('click', function (){
            context.enterRoom();
        });

        window.IVR = this;
    }

    /**
     * Return true if IVR is enabled in config
     *
     * @returns {boolean}
     */
    enabled(){
        return Config.get('ivr.enabled') === true;
    }

    /**
     * Set room ID (ui side included)
     *
     * @param roomID
     */
    setRoomID(roomID){
        this.roomID = roomID;
        this.inputRoomID.value = roomID;
    }

    /**
     * Show IVR main container
     */
    show(speak = true){
        this.mainIvrContainer.classList.remove('hidden');

        if (speak){
            // add '. !' allows to get a small pause between sentences
            const queue = ['ivr_disclaimer', '. !', 'ivr_enter_conference_number_tts'];
            TTS.speak(queue, 'ivr');
        }

        // Translate some UI elements
        document.getElementById("ivr_enter_conference_number")
            .innerText = Lang.translate('ivr_enter_conference_number');
    }

    /**
     * Hide IVR main container
     */
    hide(){
        this.mainIvrContainer.classList.add('hidden');
    }


    /* Listeners */

    /**
     * Get user input
     *
     * @param event
     */
    onKeydown(event){
        if (event.key === '#'){
            // Enter room
            this.enterRoomBtn.click();
            event.preventDefault();
            event.stopPropagation();

        }else if (event.key === 'Backspace'){
            // Remove last digit
            this.roomID = this.roomID.slice(0, -1);

        }else if (event.key === '*'){
            // Remove last digit
            this.roomID = this.roomID.slice(0, -1);
            this.inputRoomID.value = this.roomID;
            event.preventDefault();
            event.stopPropagation();

        }else if (!isNaN(event.key)) {
            // Add digit
            this.roomID += event.key;

        }else{
            event.preventDefault();
            event.stopPropagation();
        }
    }


    /**
     * Default on error
     *
     * @param reason
     */
    onError(reason, details){
        switch (reason){
            case 'room_id_too_short':
            default:
                this.helper.onError('room_id', reason, details);
                break;
        }
    }

    /**
     * Enter room
     */
    enterRoom(){
        if (this.roomID.length <= 3){
            this.onError('room_id_too_short', this.roomID)
        }else {
            // Hide previous errors
            document.getElementById('errors').classList.add('hidden');
            this.mainIvrContainer.classList.remove('hidden');

            // Get conference room_id
            let url = Config.get('ivr.confmapper_url')+Config.get('ivr.confmapper_endpoint');
            let url_auth = Config.get('ivr.auth_url')
            let context = this;

            let onError= function(reason){
                context.helper.onError('room_id', reason, context.roomID);
                context.loader.classList.add('hidden');
                context.inputRoomID.value = "";
                context.roomID = "";
            };

            this.loader.classList.remove('hidden');

            if (url && url_auth) {
                this.getConferenceName(url,onError).then( () =>{
                        this.getConferenceToken(url_auth,onError).then ( () => {
                            context.helper.initJitsiMeetConference();
                            document.querySelector('div[class="header-logo"]').classList.add('hidden');
                        });
                    }
                );
            }
            else if (url) {
                this.getConferenceName(url,onError).then ( () => {
                    context.helper.initJitsiMeetConference();
                    document.querySelector('div[class="header-logo"]').classList.add('hidden');
                });
            } else {
                context.mainIvrContainer.classList.add('hidden');
                context.helper.roomID = this.roomID;
                context.helper.initJitsiMeetConference();
                document.querySelector('div[class="header-logo"]').classList.add('hidden');
            }
        }
    }

    getConferenceToken(url,onError){
        let context = this;
        return new Promise(resolve => {
            let roomName = context.helper.roomID;
            let mappedDomain = context.helper.domain;
          
            let onTimerError= function(reason){
                resolve();
            };

            let onServerError = function(reason){
                resolve();
            }

            // Check secure  conference template name
            let templateRegex = new RegExp(Config.get('ivr.secure_regexp'));
            if (templateRegex.test(roomName) === false ){
                resolve();
                return;
            };
            Utils.fetchWithTimeout(`${url}?jwt=true&roomName=${roomName}&domain=${mappedDomain}`, {method: 'get'}, onTimerError)
                .then(response => {
                    try {
                        response.json()
                            .then(function (data) {
                                if (data.hasOwnProperty('jwt')) {
                                    context.helper.roomToken = data.jwt;
                                } 
                                resolve();
                            })
                            .catch(onServerError);
                    }catch (e){
                        console.error('response_not_json');
                        onServerError();
                    }                 
                }).catch(onServerError);            
        });
    }

    getConferenceName(url,onError) {
        let context = this;
        return new Promise(resolve => {
            Utils.fetchWithTimeout(`${url}?id=${this.roomID}`, {method: 'get'}, onError)
                .then(response => {
                    try {
                        response.json()
                            .then(function (data) {
                                if (data.hasOwnProperty('conference')) {
                                    context.mainIvrContainer.classList.add('hidden');
                                    // Default extraction
                                    context.helper.roomID = data.conference.split('@')[0];
                                    context.helper.mappedDomain = data.conference.split('@conference.')[1];

                                    //If returned by confmapper
                                    if (data.hasOwnProperty('url'))
                                        context.helper.roomID = data.url;
                                    if (data.hasOwnProperty('domain'))
                                        context.helper.mappedDomain = data.domain;    
                                                                
                                    resolve();
                                } else {
                                    onError(data);
                                }
                            })
                            .catch(onError);
                    }catch (e){
                        console.error('response_not_json');
                    }
                }).catch(onError);
        });
    }

}
