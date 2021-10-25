"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TTSApiBackend = void 0;
const emittery_1 = __importDefault(require("emittery"));
const net_1 = require("net");
/**
 * Implements https://api.tabletopsimulator.com/externaleditorapi.
 */
class ExternalEditorApi extends emittery_1.default.Typed {
    constructor(options = {}) {
        super();
        this.server = new net_1.Server();
        this.clientPort = options.clientPort || 39999;
        this.serverPort = options.serverPort || 39998;
    }
    /**
     * Listens for incoming connections.
     *
     * Returns the port being listened on, if available.
     */
    listen() {
        return new Promise((resolve) => {
            this.server.listen(this.serverPort, () => {
                const address = this.server.address();
                if (address) {
                    resolve(address.port);
                }
                else {
                    resolve(undefined);
                }
                this.server.on('connection', (socket) => {
                    socket.on('data', this.onDataReceived.bind(this));
                });
            });
        });
    }
    /**
     * Stops listening to incoming connections.
     *
     * Does *NOT* attempt to cancel pending outgoing connections/messages.
     */
    close() {
        this.server.close();
    }
    onDataReceived(data) {
        const message = JSON.parse(data.toString('utf8'));
        switch (message.messageID) {
            case 0:
                this.emit('pushingNewObject', message);
                break;
            case 1:
                this.emit('loadingANewGame', message);
                break;
            case 2:
                this.emit('printDebugMessage', message);
                break;
            case 3:
                this.emit('errorMessage', message);
                break;
            case 4:
                this.emit('customMessage', message);
                break;
            case 5:
                this.emit('returnMessage', message);
                break;
            case 6:
                this.emit('gameSaved', message);
                break;
            case 7:
                this.emit('objectCreated', message);
                break;
        }
    }
    send(message) {
        const client = new net_1.Socket();
        return new Promise((resolve, reject) => {
            client.once('error', reject);
            client.connect(this.clientPort, '127.0.0.1', () => {
                client.write(JSON.stringify(message), (error) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve();
                    }
                    client.destroy();
                });
            });
        });
    }
    /**
     * Requests all of the game state for the currently loaded game.
     *
     * @see https://api.tabletopsimulator.com/externaleditorapi/#get-lua-scripts
     */
    getLuaScripts() {
        return __awaiter(this, void 0, void 0, function* () {
            const message = {
                messageID: 0,
            };
            yield this.send(message);
            return this.once('loadingANewGame');
        });
    }
    /**
     * Updates the Lua and/or XML UI for the provided objects.
     *
     * Any objects mentioned will have their Lua script and their XML UI updated.
     * If no value is set, then the corresponding Lua script or XML UI is deleted
     * for the provided GUID.
     *
     * @see https://api.tabletopsimulator.com/externaleditorapi/#save-play
     */
    saveAndPlay(scriptStates) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = {
                messageID: 1,
                scriptStates,
            };
            yield this.send(message);
            return this.once('loadingANewGame');
        });
    }
    /**
     * Sends a custom table (JSON dictionary) to `onExternalMessage`.
     *
     * @see https://api.tabletopsimulator.com/externaleditorapi/#custom-message
     */
    customMessage(customMessage) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = {
                messageID: 2,
                customMessage,
            };
            return this.send(message);
        });
    }
    /**
     * Executes the provided Lua code for the associated GUID.
     *
     * @see https://api.tabletopsimulator.com/externaleditorapi/#execute-lua-code
     */
    executeLuaCode(script, guid = '-1') {
        return __awaiter(this, void 0, void 0, function* () {
            const message = {
                messageID: 3,
                script,
                guid,
            };
            return this.send(message);
        });
    }
    executeLuaCodeAndReturn(script, guid = '-1') {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.executeLuaCode(script, guid);
            return this.once('returnMessage').then((v) => v.returnValue);
        });
    }
}
exports.default = ExternalEditorApi;
/**
 * A fake implementation of the TTS backend.
 *
 * This allows testing usages of @see ExternalEditorApi.
 */
class TTSApiBackend extends emittery_1.default.Typed {
    constructor() {
        super(...arguments);
        this.server = new net_1.Server();
    }
    /**
     * Listens for connections and returns the port being listened to.
     */
    listen() {
        return new Promise((resolve) => {
            this.server.listen(0, () => {
                const address = this.server.address();
                if (address) {
                    resolve(address.port);
                }
                else {
                    resolve(undefined);
                }
                this.server.on('connection', (socket) => {
                    socket.on('data', this.onDataReceived.bind(this));
                });
            });
        });
    }
    close() {
        return new Promise((resolve, reject) => {
            this.server.close((error) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve();
                }
            });
        });
    }
    onDataReceived(data) {
        const message = JSON.parse(data.toString('utf8'));
        switch (message.messageID) {
            case 0:
                this.emit('getLuaScripts', message);
                break;
            case 1:
                this.emit('saveAndPlay', message);
                break;
            case 2:
                this.emit('customMessage', message);
                break;
            case 3:
                this.emit('executeLuaCode', message);
                break;
        }
    }
    send(message) {
        const sendPort = this.sendPort;
        if (!sendPort) {
            throw new Error('Must assign .sendPort= before sending messages');
        }
        const client = new net_1.Socket();
        return new Promise((resolve, reject) => {
            client.once('error', () => {
                reject();
            });
            client.connect(sendPort, () => {
                client.write(JSON.stringify(message), (error) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve();
                    }
                    client.destroy();
                });
            });
        });
    }
    pushNewObject(scriptStates) {
        const message = {
            messageID: 0,
            scriptStates,
        };
        return this.send(message);
    }
    loadNewGame(scriptStates) {
        const message = {
            messageID: 1,
            scriptStates,
        };
        return this.send(message);
    }
    printDebugMessage(text) {
        const message = {
            messageID: 2,
            message: text,
        };
        return this.send(message);
    }
    errorMessage(error, errorMessagePrefix, guid = '-1') {
        const message = {
            messageID: 3,
            error,
            errorMessagePrefix,
            guid,
        };
        return this.send(message);
    }
    customMessage(customMessage) {
        const message = {
            messageID: 4,
            customMessage,
        };
        return this.send(message);
    }
    returnMessage(returnValue) {
        const message = {
            messageID: 5,
            returnValue,
        };
        return this.send(message);
    }
    gameSaved() {
        const message = {
            messageID: 6,
        };
        return this.send(message);
    }
    objectCreated(guid) {
        const message = {
            messageID: 7,
            guid,
        };
        return this.send(message);
    }
}
exports.TTSApiBackend = TTSApiBackend;
