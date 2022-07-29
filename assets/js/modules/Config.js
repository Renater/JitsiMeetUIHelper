/**
 * Basic config handler class
 */
export default class Config {

    /**
     * Default configuration parameters
     */
    static parameters = {
        "lang": "fr",
        "domain": null,
        "auto_hide_menu_timer": 10,
        "tts": {
            "enabled": true
        },
        "ivr": {
            "enabled": false,
            "confmapper_url": null,
            "confmapper_endpoint": null
        },
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
            if(!(bit in params)){
                console.error(`[Error]: unknown config parameter: ${key}`);
                return null;
            }

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
    static set(parameter, value) {
        let params = this.parameters;
        let path = parameter.split('.')
        let len = path.length;
        if (len === 1){
            this.parameters[parameter] = value;
        }else {
            path.forEach(function (element) {
                if (!params[element]) params[element] = {};
                params = params[element];
            });

            params[path[len - 1]] = value;
        }
    }

    /**
     * Set whole dictionary
     *
     * @param dic
     */
    static setDictionary(dic){
        for (const [key, value] of Object.entries(dic)) {
            this.set(key, value);
        }
    }
}