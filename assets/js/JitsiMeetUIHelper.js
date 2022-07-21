/**
 * Class JitsiMeetUIHelper
 */
class JitsiMeetUIHelper {

    /**
     * Room ID
     */
    roomID = undefined;

    /**
     * JitsiMeetExternalAPI instance
     */
    jitsiApiClient = undefined;

    /**
     * the DTMF menu
     */
    dtmfMenu= undefined;

    /**
     * @var object : Main button to show DTMF menu
     */
    dtmfMenuButton = undefined;

    /**
     * Configuration parameters
     */
    config = {};


    /**
     * List of available commands
     */
    commands = {
        'show-dtmf-menu': 'showDTMFMenu',
        'toggle-audio': 'toggleAudio',
        'toggle-video': 'toggleVideo',
        'toggle-chat': 'toggleChat',
        'toggle-tile-view': 'toggleTileView',
        'toggle-rise-hand' : 'toggleRiseHand'
    };


    /**
     * Keep each component state (used by TTS)
     *
     * @type {{"toggle-rise-hand": boolean, "show-dtmf-menu": boolean, "toggle-audio": boolean, "toggle-tile-view": boolean, "toggle-chat": boolean, "toggle-video": boolean}}
     */
    states = {
        'show-dtmf-menu': false,
        'toggle-audio': true,
        'toggle-video': true,
        'toggle-chat': false,
        'toggle-tile-view': false,
        'toggle-rise-hand' : false
    };


    /**
     * Constructor
     */
    constructor(){
        // IFrame already initialised
        if (window.JitsiMeetUIHelper !== undefined) return;

        this.dtmfMenu = document.getElementById('dtmf_menu_content');
        this.dtmfMenuButton = document.getElementById('dtmf_show_menu_btn');

        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);

        if (!urlParams.has('room_id'))
            throw new Error('room_id not set')

        this.roomID = urlParams.get('room_id');

        // Update page title
        document.title = this.roomID;

        // Fetch config
        fetch('config.json', {"method": "get"})
            .then(response => {
                response.json()
                    .then( config => {
                        this.config = config;

                        // Update locale
                        if (this.config.hasOwnProperty('lang'))
                            Lang.changeLocal(this.config.lang);

                        // init the room
                        this.initJitsiMeetConference();

                        window.JitsiMeetUIHelper = this;
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
     * Init the JitsiMeet conference (using the JitsiMeetExternalAPI)
     *
     * @see https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe/
     */
    initJitsiMeetConference(){
        let context = this;
        let mainOptions = {
            roomName: this.roomID,
            width: document.getElementById('main_iframe_container').width,
            height: document.getElementById('main_iframe_container').height,
            interfaceConfigOverwrite: {
                CLOSE_PAGE_GUEST_HINT: true
            },
            configOverwrite: {
                callStatsID: '',
                defaultLanguage: 'fr',
                enablePopupExternalAuth: true,
                startWithAudioMuted: false,
                startWithVideoMuted: false,
                p2p: {enabled: false},
                desktopSharingChromeDisabled: true
            },
            parentNode: document.getElementById('main_iframe_container')
        }

        this.states['toggle-audio'] = !mainOptions.configOverwrite.startWithAudioMuted;
        this.states['toggle-video'] = !mainOptions.configOverwrite.startWithVideoMuted;

        // Connect main client
        let subDomain = this.config.domain.replace(/^https?:\/\//, '');
        this.jitsiApiClient = new JitsiMeetExternalAPI(subDomain, mainOptions);

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

        }else{
            console.log(`Received command: ${name}`);
            switch (name){
                case 'show-dtmf-menu':
                    this.#toggleMenu();
                    break;

                case 'toggle-audio':
                case 'toggle-video':
                case 'toggle-chat':
                case 'toggle-tile-view':
                case 'toggle-rise-hand':
                    // Send generic command to JitsiMeetExternalAPI
                    this.jitsiApiClient.executeCommand(this.commands[name], args);
                    // Update state for component
                    this.states[name] = !this.states[name];
                    break;

                default:
                    console.error(`[Error] Command '${name}' not handled yet`)
            }

            this.speakFromCommand(name);
        }
    }


    /**
     * Command to toggle hide/show main menu
     */
    #toggleMenu(){
        if (!this.dtmfMenu.classList.contains('show')) {
            this.dtmfMenu.classList.remove('hide');
            this.dtmfMenu.classList.add('show');


        }else {
            this.dtmfMenu.classList.remove('show');
            this.dtmfMenu.classList.add('hide');
        }
    }


    /**
     * Get text to pass to the TTS from command
     *
     * @param command
     */
    speakFromCommand(command){
        // TTS disabled
        if (!this.config.enable_tts) return;

        let trKey = null;

        switch (command){
            case 'show-dtmf-menu':
                trKey = this.dtmfMenu.classList.contains('show') ? 'menu_shown' : 'menu_hidden';
                break;

            case 'toggle-audio':
                trKey = this.states[command] ? 'micro_enabled' : 'micro_disabled';
                break;

            case 'toggle-video':
                trKey = this.states[command] ? 'camera_enabled' : 'camera_disabled';
                break;

            case 'toggle-chat':
                trKey = this.states[command] ? 'chat_shown' : 'chat_hidden';
                break;

            case 'toggle-tile-view':
                trKey = this.states[command] ? 'tile_view_shown' : 'tile_view_hidden';
                break;

            case 'toggle-rise-hand':
                trKey = this.states[command] ? 'hand_raised' : 'hand_down';
                break;

            default:
                console.error(`[Error] [TTS] Command '${name}' not handled yet`);
        }


        if (trKey !== null){
            let translated = Lang.translate(trKey)
            if (translated !== null)
                this.speak(translated);
        }
    }


    /**
     * EXPERIMENTAL
     * Use browser embedded TTS
     * @see https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance
     *
     * @param text Text to be spoken
     */
    speak(text){
        // Speak only if enabled in config
        if (this.config.enable_tts){
            let utterance = new SpeechSynthesisUtterance(text);
            speechSynthesis.speak(utterance);
        }
    }

}