import Config from './Config.js';
import TTS from './TTS.js';
import Lang from './Lang.js';

/**
 * Class JitsiRoom
 */
export default class Room {

    /**
     * JitsiMeetExternalAPI instance
     *
     * @type {JitsiMeetExternalAPI|null}
     */
    jitsiApiClient = null;

    /**
     * Room identifier
     *
     * @type {string|null}
     */
    roomID = null;

    /**
     * Display Name
     *
     * @type {string|null}
     */
    displayName = null;


    /**
     * Room constructor
     *
     * @param roomID
     * @param displayName
     */
    constructor(roomID, displayName) {
        if (roomID){
            this.roomID = roomID;
        }
        if (displayName){
            this.displayName = displayName
        }
    }


    /**
     * List of available commands
     */
    commands = {
        'toggle-audio': 'toggleAudio',
        'toggle-video': 'toggleVideo',
        'toggle-chat': 'toggleChat',
        'toggle-tile-view': 'toggleTileView',
        'toggle-raise-hand': 'toggleRaiseHand',
        'toggle-share-screen': 'toggleShareScreen'
    };


    /**
     * Init the JitsiMeet conference (using the JitsiMeetExternalAPI)
     *
     * @see https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe/
     */
    initJitsiMeetConference() {
        return new Promise(resolve => {
            let mainContainer = document.getElementById('main_iframe_container');
            let mainOptions = {
                roomName: this.roomID,
                userInfo: {
                    displayName: this.displayName
                },
                width: mainContainer.width,
                height: mainContainer.height,
                interfaceConfigOverwrite: {
                    CLOSE_PAGE_GUEST_HINT: true,
                    SHOW_CHROME_EXTENSION_BANNER: false
                },
                configOverwrite: {
                    disableDeepLinking: true,
                    noSSL: false,
                    callStatsID: '',
                    defaultLanguage: Lang.langCode,
                    enablePopupExternalAuth: false,
                    startWithAudioMuted: false,
                    startWithVideoMuted: false,
                    enableNoisyMicDetection: false,
                    prejoinPageEnabled: false,
                    prejoinConfig: {
                        enabled: false
                    },
                    autoKnockLobby: true,
                    p2p: {enabled: true},
                    desktopSharingChromeDisabled: false,
                    disableShortcuts: true,
                    buttonsWithNotifyClick:[
                        'hangup'
                    ]
                },
                parentNode: mainContainer,
            }

            // Connect main client
            let subDomain = Config.get('domain').replace(/^https?:\/\//, '');
            this.jitsiApiClient = new JitsiMeetExternalAPI(subDomain, mainOptions);

            mainContainer.classList.remove('hidden');

            let context = this;
            this.jitsiApiClient.addListener('videoConferenceJoined', function () {
                // Add listeners when conference is ready
                context.addAPIListeners();
                context.addShortcutListeners();
                context.jitsiApiClient.executeCommand('overwriteConfig', { toolbarButtons: [] });
                context.initMediaState();
                resolve();
            });
        });
    }


    initMediaState(){
        let context = this;

        context.jitsiApiClient.isAudioMuted().then(muted => {
            if (muted)
                context.jitsiApiClient.executeCommand('toggleAudio');
        });

        context.jitsiApiClient.isVideoMuted().then(muted => {
            if (muted)
                context.jitsiApiClient.executeCommand('toggleVideo');
        });
    }


    /**
     * Listen to state changes
     */
    addAPIListeners() {
        // Mute / unmute audio
        this.jitsiApiClient.addListener('audioMuteStatusChanged', function (response) {
                if (Config.get('tts.ui_helper.speaker_on'))
                    TTS.speak(!response.muted ? 'micro_enabled' : 'micro_disabled', 'ui_helper');
            }
        );

        // Mute / unmute video
        this.jitsiApiClient.addListener('videoMuteStatusChanged', function (response) {
                if (Config.get('tts.ui_helper.speaker_on'))
                    TTS.speak(!response.muted ? 'camera_enabled' : 'camera_disabled', 'ui_helper');
            }
        );

        // Hide / show chat'
        this.jitsiApiClient.addListener('chatUpdated', function (response) {
                if (Config.get('tts.ui_helper.speaker_on'))
                    TTS.speak(response.isOpen ? 'chat_shown' : 'chat_hidden', 'ui_helper');
            }
        );


        // Hide / show tile view
        this.jitsiApiClient.addListener('tileViewChanged', function (response) {
                if (Config.get('tts.ui_helper.speaker_on'))
                    TTS.speak(response.enabled ? 'tile_view_shown' : 'tile_view_hidden', 'ui_helper');
            }
        );

        // Hand raise / down
        this.jitsiApiClient.addListener('raiseHandUpdated', function (response) {
                if (Config.get('tts.ui_helper.speaker_on'))
                    TTS.speak(response.handRaised ? 'hand_raised' : 'hand_down', 'ui_helper');
            }
        );

        // Hangup, go to IVR root page
        this.jitsiApiClient.addListener('toolbarButtonClicked', function (response) {
                if (response.key === 'hangup'){
                    window.location.replace('/');
                }
            }
        );
    }

    /**
     * Add shortcut listeners (defined in configuration file)
     */
    addShortcutListeners() {
        let context = this;
        document.onkeydown = function (kEvent) {
            Object.entries(Config.get('shortcuts')).forEach(k => {
                if (k[1] === kEvent.key) {
                    context.executeCommand(k[0]);
                }
            })
        }
    }

    /**
     * Executes command. The available commands are:
     *
     * @param name
     * @param args
     */
    executeCommand(name, ...args) {
        if (!this.jitsiApiClient) {
            console.error('Room not initialised');

        }else if (!(name in this.commands)) {
            console.error(`[Error] Command '${name}' not found`)

        } else {
            console.log(`Received command: ${name}`);
            switch (name) {
                case 'toggle-audio':
                case 'toggle-video':
                case 'toggle-chat':
                case 'toggle-tile-view':
                case 'toggle-raise-hand':
                case 'toggle-share-screen':
                    // Send generic command to JitsiMeetExternalAPI
                    this.jitsiApiClient.executeCommand(this.commands[name], args);
                    break;

                default:
                    console.error(`[Error] Command '${name}' not handled yet`)
            }
        }
    }
}
