import Config from "./Config.js";

/**
 * Utils class
 */
class Utils{


    /**
     * Fetch resource with timeout
     *
     * @param resource
     * @param options
     * @param onError
     *
     * @returns {Promise<Response>}
     */
    static fetchWithTimeout(resource, options = {}, onError = null) {

        const controller = new AbortController();

        let tId = setTimeout(() => {
            controller.abort();
            console.log('aborted')
            if (onError) onError('timeout');

        }, Config.get('ivr.confmapper_timeout'));

        options = {...{signal: controller.signal}, ...options};

        return fetch(resource, options)
            .then((response) => {
                window.clearTimeout(tId);
                return response;
            })
            .catch(error => {
                return error;
            });
    }
}

export default Utils;