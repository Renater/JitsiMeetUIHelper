# <p align="center">JitsiMeetUIHelper</p>

<hr />

This tools helps to manipulate an embedded JitsiMeet conference (using the [JitsiMeetExternalAPI](https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe/)).


# Getting started

## Installation

You need to expose the index.html and the assets folder threw any web server.

Then, change the URL to your **external_api.js** in the head section of the index.html file (limitation due to CORS)

Note: some configuration parameters are needed, see the next part.

## Configuration

Copy the **config_sample.json** to **config.json** at the root of your app.

Available parameters:

| Key                            | Description                                                   | Mandatory |    Type | Default value |
|--------------------------------|---------------------------------------------------------------|:---------:|--------:|---------------|
| lang                           | Lang used by TTS (browser embedded Text To Speech)            |     x     |  string | fr            |
| domain                         | Domain to initiate the room                                   |     x     |  string | undefined     |
| auto_hide_menu_timer           | Automatically hide menu after this timer (in seconds)         |     x     |  number | 10            |
| auto_pin_local_sharing         | Automatically pin local sharing video                         |     x     | boolean | false         |
| tts                            | TTS configurations (Text To Speech)                           |           |  object |               |
| tts.ivr                        | TTS configuration for "ivr"                                   |     x     |  object |               |
| tts.ivr.available              | Enable / disable TTS                                          |     x     | boolean | true          |
| tts.ivr.speaker_on             | Enable / disable speaker                                      |     x     | boolean | true          |
| tts.ui_helper                  | TTS configuration for "ui_helper"                             |     x     |  object |               |
| tts.ui_helper.available        | Enable / disable TTS                                          |     x     | boolean | true          |
| tts.ui_helper.speaker_on       | Enable / disable speaker                                      |     x     | boolean | true          |
| tts.engine                     | TTS Engine to use. Must be "embedded" or "local_files"        |     x     |  string | local_files   |
| tts.format                     | Audio file format to use (if engine is "local_files")         |           |  string | mp3           |
| ivr                            | IVR configurations                                            |           |  object |               |
| ivr.enabled                    | Enable / disable IVR                                          |           | boolean | false         |
| ivr.confmapper_url             | Confmapper URL                                                |           |  string | null          |
| ivr.confmapper_endpoint        | Confmapper endpoint                                           |           |  string | null          |
| ivr.confmapper_timeout         | Request timeout                                               |           |  number | 5000          |
| ivr.auth_url                   | JWT auth server generator endpoint                            |           |  string | null          |
| ivr.secure_regexp              | regexp to define secure room name authorised to get JWT token |           |  string | null          |
| ivr.conference_code            | Configuration for conference code                             |           |  object |               |
| ivr.conference_code.min_length | Conference code minimal length                                |           |  number | 2             |
| ivr.conference_code.max_length | Conference code maximal length                                |           |  number | 10            |
| shortcuts                      | List of keyboard shortcuts (lower case)                       |           |  object |               |
| shortcuts.show-dtmf-menu       | Show / hide menu                                              |           |  string | h             |
| shortcuts.toggle-audio         | Mute / unmute audio                                           |           |  string | m             |
| shortcuts.toggle-video         | Mute / unmute video                                           |           |  string | v             |
| shortcuts.toggle-chat          | Show / hide chat'                                             |           |  string | c             |
| shortcuts.toggle-tile-view     | Show / hide tile view                                         |           |  string | w             |
| shortcuts.toggle-raise-hand    | raise / down hand                                             |           |  string | r             |
| shortcuts.toggle-tts           | Enable / disable TTS (Text To Speech)                         |           |  string | x             |

>> Note: about tts.engine
> 
> 2 engine are currently supported for using TTS:
> * local_files: use pre generated audio files 
> * embedded: use browser embedded TTS engine 

## Usage

This UIhelper is made to provide an interface for the SIPMediaGateway. 
By default, it displays an IVR to enter your room PIN with DTMF. 

An external service named a conference mapper can be used to map your PIN to a more complex Jitsi room name.

You can also use an external service to provide a valid JWT token to enable authentication from the UIhelper.

URL parameters can be used to skip the IVR strep or customise the connection to JItsi-Meet.


| parameter                            | Description                                                       | Mandatory |    Type | Default value |
|--------------------------------------|-------------------------------------------------------------------|:---------:|--------:|---------------|
| room_id                              | Jitsi Meet conférence name or PIN ID if confmapper is configured  |           |  string | undefined     |
| display_name                         | Domain to initiate the room                                       |           |  string | undefined     |
| room_token                           | Valid Jitsi JWT token                                             |           |  sting  | undefined     |



Example: 

*http://yourdomain.com/JitsiMeetUIHelper/index.html?room_id=my_room_name&display_name=bob&room_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJjb250ZXh0Ijp7InV*

### Supported commands

Here is the commands supported at the moment:
* **show-dtmf-menu**: Show/hide DTMF shortcut menu
* **toggle-audio**: Toggle microphone state
* **toggle-video**: Toggle camera state
* **toggle-chat**: Toggle chat' state
* **toggle-tile-view**: Toggle use of tile view
* **toggle-raise-hand**: Toggle hand raise/down


Example:
```javascript
window.JitsiMeetUIHelper.executeCommand('toggle-video');
```

## TTS, Text-To-Speech

TTS is enabled by default. You can disable it by a config parameter.

### Browser embedded TTS

To use the browser embedded TTS, set the parameter "tts.engine" to "embedded".
> Warning: chrome uses translate.google.com API, so each time tts is used, a called is made to a Google server...

### Local files TTS

It's also possible to generate audio files to be played instead of the browser embedded TTS engine.

To do so, you can use the scripts/generate_tts_files.py

```bash
# show help
scripts/generate_tts_files.py -h
```


### Translate the TTS data

By default, this app is on **french**.

Supported translations for now are:
* fr (French)
* en (English)

If you want have your own translation :
 * copy the **js/lang/fr.json** file into your language (example: **de.js**),
 * Update the translation file
 * Change the lang code in the **config.json** file

# Known limitations
