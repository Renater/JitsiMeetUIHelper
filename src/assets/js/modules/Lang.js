/**
 * Basic translation class
 */
export default class Lang {
    /**
     * List of key/val used to translate
     *
     * @type {Object}
     */
    static dictionary = {};

    /**
     * Lang code
     *
     * @type {string}
     */
    static langCode = 'fr'; // Default is FR langage


    /**
     * Translate from key
     *
     * @param key
     * @returns {null|*}
     */
    static translate(key){
        if (this.dictionary.length === 0){
            this.init().then(this.translate(key));
        }else{
            if(
                this.dictionary.hasOwnProperty(this.langCode)
                && this.dictionary[this.langCode].hasOwnProperty(key)
            ) {
                return this.dictionary[this.langCode][key];

            }else{
                console.error(`Translation not found: ${key}`)
                return `{${key}}`;
            }
        }
    }

    /**
     * Check if asked key has translation on dictionary
     *
     * @param key
     * @returns {boolean}
     */
    static has(key){
        return this.dictionary.hasOwnProperty(this.langCode) && this.dictionary[this.langCode].hasOwnProperty(key)
    }


    /**
     * Init current dictionary
     *
     * @param lang
     * @returns {Promise<unknown>}
     */
    static init(lang = null){
        let context = this;
        if (!lang) lang = this.langCode;

        return new Promise(resolve => {
            let settings = {
                method: 'get',
                headers: new Headers({'content-type': 'application/json'}),
            };

            fetch(`assets/lang/${lang}.json`, settings)
                .then(response => {
                    response.json()
                        .then(function (data){
                            if (data.hasOwnProperty(lang)){
                                context.dictionary[lang] = data[lang];
                            }
                            resolve();
                        })
                        .catch(function (reason){
                            console.error(reason);
                        })
                })
        });
    }


    /**
     * Change lang to use
     *
     * @param langCode
     *
     * @returns {Promise<unknown>}
     */
    static changeLocal(langCode){
        let context = this;
        return new Promise(resolve => {
            context.init(langCode).then(function(){
                context.langCode = langCode;
                resolve();
            });
        });
    }
}