import IVR from './modules/IVR.js';
import Config from './modules/Config.js';
import Lang from './modules/Lang.js';
import TTS from './modules/TTS.js';
import Room from './modules/Room.js';

/**
 * Class JitsiMeetUIHelper
 */
export default class JitsiMeetUIHelper {

    /**
     * Room ID
     *
     * @type {string|null}
     */
    roomID = null;

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
        'toggle-rise-hand': 'toggleRiseHand',
        'toggle-tts': 'toggleTts'
    };


    /**
     * IVR
     *
     * @type {*}
     */
    ivr = null;

    /**
     * Constructor
     */
    constructor() {
        // IFrame already initialised
        if (window.JitsiMeetUIHelper !== undefined) return window.JitsiMeetUIHelper;

        this.dtmfMenu = document.getElementById('dtmf_menu_content');
        this.dtmfMenuButton = document.getElementById('dtmf_show_menu_btn');

        // Fetch config
        fetch('config.json', {"method": "get"})
            .then(response => {
                response.json()
                    .then(config => {
                        Config.setDictionary(config);

                        this.ivr = new IVR();

                        const queryString = window.location.search;
                        const urlParams = new URLSearchParams(queryString);

                        window.JitsiMeetUIHelper = this;

                        if (!urlParams.has('room_id')) {
                            this.onError('room_id', 'not_set');

                        }else {
                            this.roomID = urlParams.get('room_id');

                            // Update page title
                            document.title = this.roomID;


                            // If TTS disabled, hide on UI
                            if (!TTS.enabled()) {
                                document.querySelector('div[data-content="tts"]').classList.add('hide');
                            }

                            this.menuTimer = Config.get('auto_hide_menu_timer');

                            // Update locale
                            let lang = Config.get('lang');
                            if (lang)
                                Lang.changeLocal(lang);

                            // init the room
                            this.initRoom();
                        }
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
     * Init room
     */
    initRoom(){
        let context = this;
        this.room = new Room(this.roomID);
        document.querySelectorAll('.header-logo').forEach(function(element){
            element.classList.add('hidden');
        })

        this.room.initJitsiMeetConference()
            .then(function () {
                context.#toggleMenu(true, true);
                document.getElementById('dtmf_show_menu').classList.remove('hidden')

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
                    Config.set('tts.enabled', !Config.get('tts.enabled'));
                    break;

                case 'toggle-audio':
                case 'toggle-video':
                case 'toggle-chat':
                case 'toggle-tile-view':
                case 'toggle-rise-hand':
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
            if (!silent)
                this.speak(Lang.translate('menu_shown'));

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
            if (!silent)
                this.speak(Lang.translate('menu_hidden'));

            this.menuTimer = null;
            if (this.menuInterval !== null) {
                clearInterval(this.menuInterval);
                this.menuInterval = null;
                this.menuTimer = Config.get('auto_hide_menu_timer');
            }
        }
    }


    /**
     * Default behavior on error
     *
     * @param element
     * @param reason
     */
    onError(element, reason) {
        switch (element) {
            case 'room_id':
                if (reason === 'not_set') {
                    // Room id not provided, show IVR UI
                    if (this.ivr.enabled() === true) {
                        this.ivr.show();
                        return
                    }
                }
                this.renderError(reason);
                break;

            default:
                console.error(`[Error] ${element} / ${reason}`)
                this.renderError(element);
        }
    }


    /**
     * Render error
     * For now, just show a default error message
     *
     * @param reason
     */
    renderError(reason){
        let ctn = document.getElementById('errors');
        ctn.classList.remove('hidden');

        let reasonHtml = ctn.querySelector('span[data-content="reason"]');

        switch (reason){
            case 'room_id_too_short':
                reasonHtml.innerHTML = Lang.translate(reason);

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
        if (TTS.enabled()){
            TTS.speak(text);
        }
    }
}