import IVR from './modules/IVR.js';
import Config from './modules/Config.js';
import Lang from './modules/Lang.js';
import TTS from './modules/TTS.js';
import Room from './modules/Room.js';
import Utils from './modules/Utils.js';
import TTSEmbedded from "./modules/TTS/TTSEmbedded.js";

/**
 * Class JitsiMeetUIHelper
 */
export default class JitsiMeetUIHelper {

    /**
     * Room ID
     *
     * @type {string|number|null}
     */
    roomID = null;

    /**
     * User Display Name
     *
     * @type {string|number|null}
     */
    displayName = null;

    /**
     * Room JWT Token 
     *
     * @type {string|number|null}
     */
    roomToken = null;


    /**
     * the DTMF menu
     *
     * @type {HTMLElement|null}
     */
    dtmfMenu = null;

    /**
     * Main button to show DTMF menu
     *
     * @type {HTMLElement|null}
     */
    dtmfMenuButton = null;


    /**
     * Hide menu 10 seconds after user shew it
     *
     * @type {number|null}
     */
    menuTimer = null;

    /**
     * Interval used to auto hide menu after 10s
     *
     * @type {number|null}
     */
    menuInterval = null;


    /**
     * List of available commands
     */
    commands = {
        'show-dtmf-menu': 'showDTMFMenu',
        'toggle-audio': 'toggleAudio',
        'toggle-video': 'toggleVideo',
        'toggle-chat': 'toggleChat',
        'toggle-tile-view': 'toggleTileView',
        'toggle-raise-hand': 'toggleRaiseHand',
        'toggle-tts': 'toggleTts',
        'toggle-share-screen': 'toggleShareScreen',
        'toggle-lobby': 'toggleLobby',
        'toggle-participants-pane': 'toggleParticipantsPane',
        'mute-everyone': 'muteEveryone'
    };


    /**
     * IVR
     *
     * @type {*|IVR}
     */
    ivr = null;

    /**
     * Constructor
     */
    constructor() {
        // IFrame already initialised
        if (window.JitsiMeetUIHelper !== undefined) return window.JitsiMeetUIHelper;

        window.JitsiMeetUIHelper = this;

        this.dtmfMenu = document.getElementById('dtmf_menu_content');
        this.dtmfMenuButton = document.getElementById('dtmf_show_menu_btn');

        // Fetch config
        Utils.fetchWithTimeout('config.json', {"method": "get"})
            .then(response => {
                response.json()
                    .then(config => {
                        Config.setDictionary(config);

                        // Update locale
                        let lang = Config.get('lang');
                        Lang.changeLocal(lang).then(function(){
                            /* Init lang for TTS */
                            if (TTS.available() && Config.get('tts.engine') === "embedded"){
                                window.speechSynthesis.onvoiceschanged = function() {
                                    TTSEmbedded.initVoice();
                                };
                            }

                            window.JitsiMeetUIHelper.initUIHelper();
                        });
                    })
                    .catch(error => {
                        throw new Error(error);
                    })
            })
            .catch(error => {
                throw new Error(error);
            })
    }


    /**
     * Init UI helper
     */
    initUIHelper(){

        this.ivr = new IVR();

        this.initRoomFromURL();

        this.room = new Room(this.roomID, this.displayName, this.roomToken);

        // If TTS disabled, hide on UI
        if (!TTS.available('ui_helper')) {
            document.querySelector('div[data-content="tts"]').classList.add('hide');
        }

        this.menuTimer = Config.get('auto_hide_menu_timer');

        // Update page title
        if (this.roomID)
            document.title = this.roomID;
        else
            document.title = this.constructor.name;



        // try to enter the room
        if (this.roomID){
            this.ivr.roomID = this.roomID;
            this.ivr.enterRoom();
        }
    }


    /**
     * Get room & display name from URL
     */
    initRoomFromURL(){
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);

        if (urlParams.has('display_name')) {
            this.displayName = urlParams.get('display_name');
        }

        if (urlParams.has('room_token')) {
            this.roomToken = urlParams.get('room_token');
        }

        if (!urlParams.has('room_id')) {
            this.onError('room_id', 'not_set');

        }else {
            let roomIDFromURL = urlParams.get('room_id');

            // Set roomID pattern
            if (roomIDFromURL !== null) {
                const minLength = Config.get('ivr.conference_code.min_length');
                const maxLength = Config.get('ivr.conference_code.max_length');
                const num = Number(roomIDFromURL);
                if (num === Config.get('ivr.number')) {
                    this.onError('room_id', 'not_set');
                }else{
                    if (Config.get('ivr.confmapper_url') && !Number.isInteger(num)){
                        this.onError('room_id', 'bad_format', roomIDFromURL)
                    }else{
                        const len = Math.ceil(Math.log(roomIDFromURL + 1) / Math.LN10) -1;
                        if (len < minLength || len > maxLength){
                            this.onError('room_id', 'bad_format', roomIDFromURL)
                        }else{
                            this.roomID = roomIDFromURL;
                            this.ivr.setRoomID(roomIDFromURL);
                        }
                    }
                }
            }
	    }
    }

    /**
     * Init JitsiMeet conference
     */
    initJitsiMeetConference() {
        let context = this;
        this.room.roomID = context.roomID.split('@')[0];
        this.room.roomToken = context.roomToken;
        let mappedDomain = context.roomID.split('@conference.')[1];
        if (mappedDomain) {
            Config.set('domain', `https://${mappedDomain}`);
        }
        this.room.initJitsiMeetConference().then(function () {
            context.#toggleMenu(true, true);
            document.getElementById('dtmf_show_menu').classList.remove('hidden')
            // Translate menu elements
            document.getElementById("micro_action")
                .innerText = Lang.translate('micro_action');
            document.getElementById("camera_action")
                .innerText = Lang.translate('camera_action');
            document.getElementById("chat_action")
                .innerText = Lang.translate('chat_action');
            document.getElementById("view_action")
                .innerText = Lang.translate('view_action');
            document.getElementById("hand_action")
                .innerText = Lang.translate('hand_action');
            document.getElementById("tts_action")
                .innerText = Lang.translate('tts_action');
            document.getElementById("participant_action")
                .innerText = Lang.translate('participant_action');
            document.getElementById("lobby_action")
                .innerText = Lang.translate('lobby_action');
            document.getElementById("mute-everyone_action")
                .innerText = Lang.translate('mute-everyone_action');
        }).catch(function () {
            context.#toggleMenu(false, false);
            document.getElementById('dtmf_show_menu').classList.add('hidden')
        });
    }


    /**
     * Executes command. The available commands are:
     *
     * @param name
     * @param args
     */
    executeCommand(name, ...args) {
        if (!(name in this.commands)) {
            console.error(`[Error] Command '${name}' not found`)

        } else {
            console.log(`Received command: ${name}`);
            switch (name) {
                case 'show-dtmf-menu':
                    this.#toggleMenu();
                    return;

                case 'toggle-tts':
                    if (TTS.available('ui_helper')){
                        Config.set('tts.ui_helper.speaker_on', !Config.get('tts.ui_helper.speaker_on'));
                    }else{
                        console.error(`[Error] Command {${name}} not available`)
                    }
                    break;

                case 'toggle-lobby':
                 //   this.toggleLobbyNotification();
                    this.room.executeCommand(name, args);
                    break;

                case 'toggle-audio':
                case 'toggle-video':
                case 'toggle-chat':
                case 'toggle-tile-view':
                case 'toggle-raise-hand':
                case 'toggle-share-screen':                
                case 'toggle-participants-pane':
                case 'mute-everyone':
                    this.room.executeCommand(name, args);
                    break;

                default:
                    console.error(`[Error] Command '${name}' not handled yet`)
            }

            // reset timer
            this.menuTimer = Config.get('auto_hide_menu_timer');
        }
    }


    /**
     * Command to toggle hide/show main menu
     *
     * @param forceShow True to force showing menu
     * @param silent True to force not use TTS
     */
    #toggleMenu(forceShow = false, silent = false) {
        if (forceShow || !this.dtmfMenu.classList.contains('show')) {
            this.dtmfMenu.classList.remove('hide');
            this.dtmfMenu.classList.add('show');

            // TTS
            if (!silent && Config.get('tts.ui_helper.speaker_on'))
                this.speak('menu_shown');

            let context = this;
            if (this.menuTimer === null) this.menuTimer = Config.get('auto_hide_menu_timer');

            this.menuInterval = setInterval(function () {
                if (context.menuTimer <= 0) {
                    context.#toggleMenu();
                    clearInterval(context.menuInterval);
                    context.menuTimer = Config.get('auto_hide_menu_timer');
                } else {
                    context.menuTimer--;
                }
            }, 1000);

        } else {
            this.dtmfMenu.classList.remove('show');
            this.dtmfMenu.classList.add('hide');

            // TTS
            if (!silent && Config.get('tts.ui_helper.speaker_on'))
                this.speak('menu_hidden');

            this.menuTimer = null;
            if (this.menuInterval !== null) {
                clearInterval(this.menuInterval);
                this.menuInterval = null;
                this.menuTimer = Config.get('auto_hide_menu_timer');
            }
        }
    }


/**
     * Command to Notfify Lobby update state 
     *
     */
    toggleLobbyNotification() {
        let lockElement =  document.getElementById("lock_icon");
        if (lockElement){
            lockElement.classList.toggle('hidden');
            if (lockElement.classList.contains('hidden'))
                this.speak('lobby_disabled');
            else
                this.speak('lobby_enabled');
        }
    }

    /**
     * Default behavior on error
     *
     * @param element
     * @param reason
     * @param details
     */
    onError(element, reason, details) {
        if (reason instanceof Object) {
            if (reason.hasOwnProperty('error')){
                 reason = reason.error;
            }else{
                reason = JSON.stringify(reason);
            }
        }

        console.error(`[Error] ${element} / ${reason}`)

        switch (element) {
            case 'room_id':
                if (reason === 'not_set') {
                    // Room id not provided, show IVR UI
                    if (this.ivr.enabled() === true) {
                        this.ivr.show();
                        return
                    }
                }else if (reason === 'bad_format'){
                    reason = `${element}_${reason}`;
                    this.ivr.show();
                }else if (reason === 'Provided number is not valid'){
                    reason = 'conference_not_found';
                    this.ivr.show();
                }
                this.renderError(element, reason, details);
                break;

            default:
                this.renderError(element, reason, details);
        }
    }


    /**
     * Render error
     * For now, just show a default error message
     *
     * @param element
     * @param reason
     * @param details
     */
    renderError(element, reason, details){
        let ctn = document.getElementById('errors');
        ctn.classList.remove('hidden');

        let reasonHtml = ctn.querySelector('span[data-content="reason"]');

        switch (element){
            case 'room_id':
                if (Lang.has(reason)){
                    TTS.speak(reason);
                    reason = Lang.translate(reason)
                }
                if (details)
                    reason += ` (${details})`
                reasonHtml.innerHTML = reason;
                this.ivr.inputRoomID.value = '';
                break;
            case 'ivr_disabled':
            default:
                reasonHtml.innerHTML = Lang.translate('cannot_initialise_conference');
                console.error(`[Error] ${reason}`);
        }

    }

    /**
     * Use TTS to speak asked text
     *
     * @param text
     */
    speak(text){
        if (TTS.available('ui_helper')){
            TTS.speak(text);
        }
    }
}
