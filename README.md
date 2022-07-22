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
* lang: Lang used by TTS (browser embedded Text To Speach)
* domain: Domain to initiate the room
* enable_tts: Enable TTS 
 

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

If you want have your own translation, just copy the **js/lang/fr.js** file into your language (example: **de.js**), then edit the translations.

# Known limitations

At the moment, this tool won't work if you are using a Jitsi Meet instance with authentication.

We're working on it!