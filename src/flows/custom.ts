import {createPort} from "../communication/port";
import deviceReady from "../communication/deviceReady";
import {sendData} from "../communication/sendData";
import {recieveCommand} from "../communication/recieveData";

export default async (actions: any[]) => {
    const {connection, serial} = await createPort();
    console.log('Serial Number: ' + serial);
    connection.open();

    const ready = await deviceReady(connection);
    if (ready) {
        for (const action of actions) {
            switch (action.type) {
                case "SEND":
                    await sendData(connection, action.command, action.data);
                    break;
                case "RECEIVE":
                    const received = await recieveCommand(connection, action.command);
                    console.log("Received: ",received)
                    break;
                default:
                    throw new Error("invalid command type")
            }
        }
    } else {
        console.log('device not ready');
    }
    connection.close();
};