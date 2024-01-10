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
     * Participant Id
     *
     * @type {string|null}
     */
    participantId = null;

    /**
     * JWT Token
     *
     * @type {string|null}
     */
    roomToken = null;


    /**
     * firstMessage
     *
     * @type {boolean}
     */
    firstMessage = false;

    /**
     * lobby state
     *
     * @type {boolean}
     */
    lobbyActivated = false;

    /**
     * participant_pane state
     *
     * @type {boolean}
     */
    participantsPaneVisible = false;

    /**
     * Room constructor
     *
     * @param roomID
     * @param displayName
     */
    constructor(roomID, displayName, roomToken) {
        if (roomID){
            this.roomID = roomID;
        }
        if (displayName){
            this.displayName = displayName;
        }
        if (roomToken){
            this.roomToken = roomToken;
        }
        this.firstMessage = false;
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
        'toggle-share-screen': 'toggleShareScreen',
        'toggle-lobby': 'toggleLobby',
        'toggle-participants-pane': 'toggleParticipantsPane',
        'mute-everyone': 'muteEveryone'
    };


    /**
     * Init the JitsiMeet conference (using the JitsiMeetExternalAPI)
     *
     * @see https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe/
     */
    initJitsiMeetConference() {
        return new Promise(resolve => {
            let mainContainer = document.getElementById('main_iframe_container');
            
            if(!this.roomToken) {
                document.getElementById("mute_all").style.display = 'none';
                document.getElementById("lobby").style.display = 'none';
            }

            let mainOptions = {
                roomName: this.roomID,
                userInfo: {
                    displayName: this.displayName
                },
                width: mainContainer.width,
                height: mainContainer.height,
                jwt: this.roomToken,
                interfaceConfigOverwrite: {
                    CLOSE_PAGE_GUEST_HINT: true,
                    SHOW_CHROME_EXTENSION_BANNER: false
                },
                configOverwrite: {
                    disableDeepLinking: true,
                    noSSL: false,
                    callStatsID: '',
                    defaultLanguage: Lang.langCode,
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
                    ],
                    toolbarButtons: ['security'],
                    toolbarConfig : {
                        alwaysVisible : true
                    },
                  //  customIcons: {
                  //      SecurityOn: 'https://127.0.0.1:8443/UIhelper/assets/images/security-on_green.svg'
                  //  }
                    testing : {no_customUI: true}
                },
                parentNode: mainContainer,
            }

            // Connect main client
            let context = this;
            var externalAPI = document.createElement('script');
            externalAPI.onload = function () {
                let subDomain = Config.get('domain').replace(/^https?:\/\//, '');
                context.jitsiApiClient = new JitsiMeetExternalAPI(subDomain, mainOptions);

                mainContainer.classList.remove('hidden');

                context.jitsiApiClient.addListener('videoConferenceJoined', function (response) {
                    this.participantId = response.id;
                    // Add listeners when conference is ready
                    context.addAPIListeners();
                    context.addShortcutListeners();
                   // context.jitsiApiClient.executeCommand('overwriteConfig', { toolbarButtons: [] });
                    context.initMediaState();
                    resolve();
                });
            };
            externalAPI.src = Config.get("domain")+"/external_api.js"
            document.head.appendChild(externalAPI);
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
        let context = this;

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

        // Icoming message    
        this.jitsiApiClient.addListener('incomingMessage', function (response) {
                if (!context.firstMessage){
                    context.jitsiApiClient.executeCommand('toggleChat');
                    context.firstMessage = true;
                }
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


        // Hide / show tile view Participant Pane
        this.jitsiApiClient.addListener('participantsPaneToggled', function (response) {
            if (Config.get('tts.ui_helper.speaker_on'))
                TTS.speak(response.open ? 'participant_shown' : 'participant_hidden', 'ui_helper');
        });
        


        // Hangup, go to IVR root page
        this.jitsiApiClient.addListener('toolbarButtonClicked', function (response) {
                if (response.key === 'hangup'){
                    window.location.replace('/');
                }
            }
        );

        // Moderator status
        this.jitsiApiClient.addListener('moderationStatusChanged', function (response) {

            }
        );

        // notificationTriggered
        this.jitsiApiClient.addListener('notificationTriggered', function (response) {
                if (response.title == 'lobby' ){

                }
            }
        );

        if (Config.get('auto_pin_local_sharing')) {
            this.jitsiApiClient.addListener('screenSharingStatusChanged', function (response) {
                    if (response.on == true ){
                        let context = this;
                        context.executeCommand('setLargeVideoParticipant', this.participantId, 'desktop');
                    }
                }
            );
        }
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
                case 'toggle-lobby':
                    this.lobbyActivated = !this.lobbyActivated;
                    this.jitsiApiClient.executeCommand(this.commands[name], this.lobbyActivated);
                    break;
                case 'toggle-participants-pane':
                    this.participantsPaneVisible = !this.participantsPaneVisible;
                    this.jitsiApiClient.executeCommand(this.commands[name], this.participantsPaneVisible);
                    break;
                case 'mute-everyone':
                    this.jitsiApiClient.executeCommand(this.commands[name],  'audio' );
                    break;
                case 'toggle-audio':
                case 'toggle-video':
                case 'toggle-chat':
                case 'toggle-tile-view':
                case 'toggle-raise-hand':
                case 'mute-everyone':
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
