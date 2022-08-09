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
     * @type {Object|null}
     */
    jitsiApiClient = null;

    /**
     * Room identifier
     *
     * @type {null|string}
     */
    roomID = null;


    /**
     * Room constructor
     *
     * @param roomID
     */
    constructor(roomID) {
        if (!roomID.length){
            throw new Error ('Room ID not set');
        }else{
            this.roomID = roomID;
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
        'toggle-rise-hand': 'toggleRiseHand',
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
                width: mainContainer.width,
                height: mainContainer.height,
                interfaceConfigOverwrite: {
                    CLOSE_PAGE_GUEST_HINT: true
                },
                configOverwrite: {
                    disableDeepLinking: true,
                    noSSL: false,
                    callStatsID: '',
                    defaultLanguage: Lang.langCode,
                    enablePopupExternalAuth: false,
                    startWithAudioMuted: false,
                    startWithVideoMuted: false,
                    p2p: {enabled: true},
                    desktopSharingChromeDisabled: true,
                    disableShortcuts: true
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

                resolve();
            });
        });
    }



    /**
     * Listen to state changes
     */
    addAPIListeners() {

        // Mute / unmute audio
        this.jitsiApiClient.addListener('audioMuteStatusChanged', function (response) {
                TTS.speak(Lang.translate(!response.muted ? 'micro_enabled' : 'micro_disabled'));
            }
        );

        // Mute / unmute video
        this.jitsiApiClient.addListener('videoMuteStatusChanged', function (response) {
                TTS.speak(Lang.translate(!response.muted ? 'camera_enabled' : 'camera_disabled'));
            }
        );

        // Hide / show chat'
        this.jitsiApiClient.addListener('chatUpdated', function (response) {
                TTS.speak(Lang.translate(response.isOpen ? 'chat_shown' : 'chat_hidden'));
            }
        );

        // Hide / show tile view
        this.jitsiApiClient.addListener('tileViewChanged', function (response) {
                TTS.speak(Lang.translate(response.enabled ? 'tile_view_shown' : 'tile_view_hidden'));
            }
        );

        // Hand rise / down
        this.jitsiApiClient.addListener('raiseHandUpdated', function (response) {
                TTS.speak(Lang.translate(response.handRaised ? 'hand_raised' : 'hand_down'));
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
                case 'toggle-rise-hand':
                    // Send generic command to JitsiMeetExternalAPI
                    this.jitsiApiClient.executeCommand(this.commands[name], args);
                    break;

                default:
                    console.error(`[Error] Command '${name}' not handled yet`)
            }
        }
    }
}