import Emittery from 'emittery';
export interface Options {
    clientPort?: number;
    serverPort?: number;
}
/**
 * Base JSON message type for communication.
 *
 * The message ID is discriminated based on @var T.
 */
export interface JsonMessage<T extends number> {
    messageID: T;
}
export interface OutgoingJsonObject {
    /**
     * Unique ID.
     */
    guid: string;
    /**
     * Lua script, if any.
     */
    script?: string;
    /**
     * XML UI, if any.
     */
    ui?: string;
}
/**
 * Base JSON object described something in Tabletop Simulator.
 */
export interface IncomingJsonObject extends OutgoingJsonObject {
    /**
     * Name of the object.
     */
    name: string;
    /**
     * Lua script, if any.
     */
    script: string;
}
/**
 * Tell Tabletop Simulator to send scripts as @link LoadingANewGame.
 *
 * @see https://api.tabletopsimulator.com/externaleditorapi/#get-lua-scripts.
 */
export declare type GetLuaScripts = JsonMessage<0>;
/**
 * Tells Tabletop Simulator to save and restart with the provided states.
 *
 * @see https://api.tabletopsimulator.com/externaleditorapi/#save-play
 */
export interface SaveAndPlay extends JsonMessage<1> {
    /**
     * Objects *not* mentioned are not updated.
     *
     * Any objects mentioned have bott their Lua script and their XML UI updated.
     * If not value is set for either key, then the corresponding Lua script or
     * XML UI is deleted.
     */
    scriptStates: OutgoingJsonObject[];
}
/**
 * Tells Tabletop Simulator to forward the table to `onExternalMessage`.
 *
 * @see https://api.tabletopsimulator.com/externaleditorapi/#custom-message.
 */
export interface SendCustomMessage extends JsonMessage<2> {
    customMessage: {};
}
/**
 * Tells Tabletop Simulator to execute the provided Lua script.
 *
 * To execute Lua code for an object in the game that object must have an
 * associated script in TTS.
 *
 * @see https://api.tabletopsimulator.com/externaleditorapi/#execute-lua-code.
 */
export interface ExecuteLuaCode extends JsonMessage<3> {
    guid: string;
    script: string;
}
/**
 * When an object is right clicekd (contextual menu) -> `Scripting Editor`.
 *
 * @see https://api.tabletopsimulator.com/externaleditorapi/#pushing-new-object.
 */
export interface PushingNewObject extends JsonMessage<0> {
    scriptStates: IncomingJsonObject[];
}
/**
 * After loading a new game in Tabletop Simulator, all scripts/UI in the game.
 *
 * @see https://api.tabletopsimulator.com/externaleditorapi/#loading-a-new-game.
 */
export interface LoadingANewGame extends JsonMessage<1> {
    scriptStates: IncomingJsonObject[];
}
/**
 * The result of all `print(...)` messages.
 *
 * @see https://api.tabletopsimulator.com/externaleditorapi/#loading-a-new-game.
 */
export interface PrintDebugMessage extends JsonMessage<2> {
    message: string;
}
/**
 * All error messages that occur in Tabletop Simulator.
 *
 * @see https://api.tabletopsimulator.com/externaleditorapi/#error-messages.
 */
export interface ErrorMessage extends JsonMessage<3> {
    /**
     * Error message.
     */
    error: string;
    /**
     * Unique ID, if any, otherwise "-1".
     */
    guid: string;
    /**
     * Explanation of where error occurred, such as "Error in Global Script: ".
     */
    errorMessagePrefix: string;
}
/**
 * All custom mesages sent via `sendExternalMessage`. Useful for developing.
 *
 * @see https://api.tabletopsimulator.com/externaleditorapi/#custom-messages.
 */
export interface CustomMessage extends JsonMessage<4> {
    customMessage: {};
}
/**
 * The result of executing Lua code.
 *
 * @see https://api.tabletopsimulator.com/externaleditorapi/#return-messages.
 */
export interface ReturnMessage extends JsonMessage<5> {
    returnValue: unknown;
}
/**
 * Occurs whenever the game was saved.
 *
 * @see https://api.tabletopsimulator.com/externaleditorapi/#return-messages.
 */
export declare type GameSaved = JsonMessage<6>;
/**
 * Occurs whenever an object is created.
 *
 * @see https://api.tabletopsimulator.com/externaleditorapi/#object-created.
 */
export interface ObjectCreated extends JsonMessage<7> {
    /**
     * Unique ID.
     */
    guid: string;
}
export declare type ReceivedEventNames = 'pushingNewObject' | 'loadingANewGame' | 'printDebugMessage' | 'errorMessage' | 'customMessage' | 'returnMessage' | 'gameSaved' | 'objectCreated';
export declare type ReceivedEventTypes = PushingNewObject | LoadingANewGame | PrintDebugMessage | ErrorMessage | CustomMessage | ReturnMessage | GameSaved | ObjectCreated;
/**
 * Implements https://api.tabletopsimulator.com/externaleditorapi.
 */
export default class ExternalEditorApi extends Emittery.Typed<{
    pushingNewObject: PushingNewObject;
    loadingANewGame: LoadingANewGame;
    printDebugMessage: PrintDebugMessage;
    errorMessage: ErrorMessage;
    customMessage: CustomMessage;
    returnMessage: ReturnMessage;
    gameSaved: GameSaved;
    objectCreated: ObjectCreated;
}, ReceivedEventNames> {
    private readonly clientPort;
    private readonly serverPort;
    private server;
    constructor(options?: Options);
    /**
     * Listens for incoming connections.
     *
     * Returns the port being listened on, if available.
     */
    listen(): Promise<number | undefined>;
    /**
     * Stops listening to incoming connections.
     *
     * Does *NOT* attempt to cancel pending outgoing connections/messages.
     */
    close(): void;
    private onDataReceived;
    private send;
    /**
     * Requests all of the game state for the currently loaded game.
     *
     * @see https://api.tabletopsimulator.com/externaleditorapi/#get-lua-scripts
     */
    getLuaScripts(): Promise<LoadingANewGame>;
    /**
     * Updates the Lua and/or XML UI for the provided objects.
     *
     * Any objects mentioned will have their Lua script and their XML UI updated.
     * If no value is set, then the cooresponding Lua script or XML UI is deleted
     * for the provided GUID.
     *
     * @see https://api.tabletopsimulator.com/externaleditorapi/#save-play
     */
    saveAndPlay(scriptStates: OutgoingJsonObject[]): Promise<LoadingANewGame>;
    /**
     * Sends a custom table (JSON dictionary) to `onExternalMessage`.
     *
     * @see https://api.tabletopsimulator.com/externaleditorapi/#custom-message
     */
    customMessage(customMessage: {}): Promise<void>;
    /**
     * Executes the provided Lua code for the associated GUID.
     *
     * @see https://api.tabletopsimulator.com/externaleditorapi/#execute-lua-code
     */
    executeLuaCode<T>(script: string, guid?: string): Promise<void>;
    executeLuaCodeAndReturn<T>(script: string, guid?: string): Promise<T>;
}
export declare type SentEventNames = 'getLuaScripts' | 'saveAndPlay' | 'customMessage' | 'executeLuaCode';
export declare type SentEventTypes = GetLuaScripts | SaveAndPlay | SendCustomMessage | ExecuteLuaCode;
/**
 * A fake implementation of the TTS backend.
 *
 * This allows testing usages of @see ExternalEditorApi.
 */
export declare class TTSApiBackend extends Emittery.Typed<{
    getLuaScripts: GetLuaScripts;
    saveAndPlay: SaveAndPlay;
    customMessage: SendCustomMessage;
    executeLuaCode: ExecuteLuaCode;
}, SentEventNames> {
    private readonly server;
    sendPort?: number;
    /**
     * Listens for connections and returns the port being listened to.
     */
    listen(): Promise<number | undefined>;
    close(): Promise<void>;
    private onDataReceived;
    private send;
    pushNewObject(scriptStates: IncomingJsonObject[]): Promise<void>;
    loadNewGame(scriptStates: IncomingJsonObject[]): Promise<void>;
    printDebugMessage(text: string): Promise<void>;
    errorMessage(error: string, errorMessagePrefix: string, guid?: string): Promise<void>;
    customMessage(customMessage: {}): Promise<void>;
    returnMessage(returnValue: unknown): Promise<void>;
    gameSaved(): Promise<void>;
    objectCreated(guid: string): Promise<void>;
}
