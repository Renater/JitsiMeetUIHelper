/**
 * Basic translation class
 */
class Lang {
    static dictionary = {};
    static langCode = 'fr'; // Default is FR langage

    static translate(key){
        if(this.dictionary[this.langCode][key] !== undefined) {
            return this.dictionary[this.langCode][key]
        }else{
            console.error(`Translation not found: ${key}`)
            return null;
        }
    }

    /**
     * Populate dictionary to use
     *
     * @param dic
     */
    static populateDictionary(dic) {
        this.dictionary = dic;
    }


    /**
     * Change lang to use
     *
     * @param langCode
     */
    static changeLocal(langCode){
        if (!this.dictionary.hasOwnProperty(langCode)){
            console.error(`[Error] Locale '${langCode}' not found`)
        }else{
            this.langCode = langCode;
        }
    }
}