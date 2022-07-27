/**
 * Basic config handler class
 */
export default class Config {

    /**
     * Default configuration parameters
     */
    static parameters = {
        "lang": "fr",
        "domain": undefined,
        "enable_tts": true,
        "auto_hide_menu_timer": 10,
        "shortcuts": {
            "show-dtmf-menu": "h",
            "toggle-audio": "m",
            "toggle-video": "v",
            "toggle-chat": "c",
            "toggle-tile-view": "w",
            "toggle-rise-hand": "r",
            "toggle-tts": "x"
        }
    };


    /**
     * Get config parameter
     *
     * @param {string} key
     *
     * @return {*}
     */
    static get(key){
        if (key === '*') return this.parameters;

        let bit, path = key.split('.'), params = this.parameters;
        while(path.length) {
            bit = path.shift();
            if(!(bit in params))
                throw Error('unknown config parameter: ' + key);

            params = params[bit];
        }

        return params;
    }


    /**
     * Set config parameter
     *
     * @param parameter
     * @param value
     */
    static set(parameter, value){
        this.parameters[parameter] = value;
    }
}