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

| Key                        | Description                                           | Mandatory | Default value |
|----------------------------|-------------------------------------------------------|:---------:|---------------|
| lang                       | Lang used by TTS (browser embedded Text To Speech)    |     x     | fr            |
| domain                     | Domain to initiate the room                           |     x     | undefined     |
| enable_tts                 | Enable / disable TTS (Text To Speech)                 |           | true          |
| enable_ivr                 | Enable / disable IVR                                  |     x     | true          |
| auto_hide_menu_timer       | Automatically hide menu after this timer (in seconds) |     x     | 10            |
| shortcuts                  | List of keyboard shortcuts (lower case)               |           |               |
| shortcuts.show-dtmf-menu   | Show / hide menu                                      |           | h             |
| shortcuts.toggle-audio     | Mute / unmute audio                                   |           | m             |
| shortcuts.toggle-video     | Mute / unmute video                                   |           | v             |
| shortcuts.toggle-chat      | Show / hide chat'                                     |           | c             |
| shortcuts.toggle-tile-view | Show / hide tile view                                 |           | w             |
| shortcuts.toggle-rise-hand | Rise / down hand                                      |           | r             |
| shortcuts.toggle-tts       | Enable / disable TTS (Text To Speech)                 |           | x             |

 

## Usage

To make it work, the user have to specify the **room_id** (ie. the Jitsi Meet conference name);

To do this, the URL must contains the parameter "room_id=XXXX";

Example: 

*http://yourdomain.com/JitsiMeetUIHelper/index.html?room_id=my_room_name*

### Supported commands

Here is the commands supported at the moment:
* **show-dtmf-menu**: Show/hide DTMF shortcut menu
* **toggle-audio**: Toggle microphone state
* **toggle-video**: Toggle camera state
* **toggle-chat**: Toggle chat' state
* **toggle-tile-view**: Toggle use of tile view
* **toggle-rise-hand**: Toggle hand rise/down


Example:
```javascript
window.JitsiMeetUIHelper.executeCommand('toggle-video');
```




## Translate the TTS data

By default, this app is on **french**.

Supported translations for now are:
* fr (French)
* en (English)

If you want have your own translation :
 * copy the **js/lang/fr.json** file into your language (example: **de.js**),
 * Update the translation file
 * Change the lang code in the **config.json** file

# Known limitations

At the moment, this tool won't work if you are using a Jitsi Meet instance with authentication.

We're working on it!