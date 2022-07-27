import Config from './Config';

/**
 * Class IVR
 */
export default class IVR {

    inputRoomID = null;
    enterRoomBtn = null;
    container = null;
    roomID = "";

    constructor() {
        // IVR disabled in config
        if (!Config.get('enable_ivr')) return;

        this.inputRoomID = document.getElementById('input_room_id');
        this.container = document.getElementById('ivr_container');
        this.enterRoomBtn = document.getElementById('btn_enter_room');

        let context = this;

        this.inputRoomID.addEventListener('keydown', function (event){
            context.onKeydown(event);
        })

        this.enterRoomBtn.addEventListener('click', function (event){
            context.enterRoom();
        })
    }

    show(){
        this.container.classList.remove('hidden');
    }

    hide(){
        this.container.classList.add('hidden');
    }


    /* Listeners */

    onKeydown(event){
        if (event.key === '#'){
            // Enter room
            this.enterRoomBtn.click();

        }else if (!isNaN(event.key)) {
            // Add digit
            this.roomID += event.key;

        }else if (event.key === 'Backspace'){
            // Remove last digit
            this.roomID = this.roomID.slice(0, -1)

        }else{
            event.preventDefault();
            event.stopPropagation();
        }
    }


    /**
     * Default on error
     *
     * @param reason
     */
    onError(reason){
        switch (reason){
            case 'room_id_too_short':
                console.log('Room ID too short')
                break;

            default:

                break;
        }
    }

    /**
     * Enter room
     */
    enterRoom(){
        if (this.roomID.length <= 3){
            this.onError('room_id_too_short')
        }else {
            // Get conference room_id
            // let url = `${Config.get('domain')}`;
            // let conference =
        }
    }
}