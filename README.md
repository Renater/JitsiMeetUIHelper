# <p align="center">JitsiMeetUIHelper</p>

<hr />

This tools helps to manipulate an embedded JitsiMeet conference (using the [JitsiMeetExternalAPI](https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe/)).


# Getting started

## Installation

You need to expose the index.html files and the assets folder threw any web server.

Then, change the URL to your **external_api.js** in the head section of the index.html file (limitation due to CORS)

Note: some configuration parameters are needed, see the next part.

## Configuration

Copy the **config_sample.json** to **config.json** at the root of your app.

Available parameters: 
* lang: Lang used by TTS
* domain: Domain to initiate the room
* enable_tts: Enable TTS (browser embedded Text To Speach)
 


## Translate the TTS data

By default, this app is on **french**.

Supported translations for now are:
* fr (French)
* en (English)

If you want have your own translation, just copy the **js/lang/fr.js** file into your language (example: **de.js**), then edit the translations.
