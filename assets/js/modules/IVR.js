/**
 * Class IVR
 */
export default class IVR {

    inputRoomID = null;
    enterRoomBtn = null;
    container = null;
    roomID = "";

    constructor() {
        this.inputRoomID = document.getElementById('input_room_id');
        this.container = document.getElementById('ivr_container');
        this.enterRoomBtn = document.getElementById('btn_enter_room');

        let context = this;

        this.inputRoomID.addEventListener('keyup', function (event){
            context.onKeyup(event.key);
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

    onKeyup(key){
        if (key === '#'){
            this.enterRoomBtn.click();
        }else{
            this.roomID += key;
        }

    }

    onError(reason){
        switch (reason){
            case 'room_id_too_short':
                console.log('Room ID too short')
                break;

            default:

                break;
        }
    }

    enterRoom(){
        if (this.roomID.length <= 3){
            this.onError('room_id_too_short')
        }else{
            console.log('GOGOGO '+this.roomID);
        }
    }
}