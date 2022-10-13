import Emittery from 'emittery';
import { AddressInfo, Server, Socket } from 'net';

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
export type GetLuaScripts = JsonMessage<0>;

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
  customMessage: unknown;
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
  returnID: number;
  guid: string;
  script: string;
}

/**
 * When an object is right clicked (contextual menu) -> `Scripting Editor`.
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
  savePath: string; // Undocumented
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
 * All custom messages sent via `sendExternalMessage`. Useful for developing.
 *
 * @see https://api.tabletopsimulator.com/externaleditorapi/#custom-messages.
 */
export interface CustomMessage extends JsonMessage<4> {
  customMessage: unknown;
}

/**
 * The result of executing Lua code.
 *
 * @see https://api.tabletopsimulator.com/externaleditorapi/#return-messages.
 */
export interface ReturnMessage extends JsonMessage<5> {
  returnValue: unknown;
  returnID: number; // Undocumented
}

/**
 * Occurs whenever the game was saved.
 *
 * @see https://api.tabletopsimulator.com/externaleditorapi/#return-messages.
 */
export interface GameSaved extends JsonMessage<6> {
  savePath: string; // Undocumented
}

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

export type ReceivedEventNames =
  | 'pushingNewObject'
  | 'loadingANewGame'
  | 'printDebugMessage'
  | 'errorMessage'
  | 'customMessage'
  | 'returnMessage'
  | 'gameSaved'
  | 'objectCreated';

export type ReceivedEventTypes =
  | PushingNewObject
  | LoadingANewGame
  | PrintDebugMessage
  | ErrorMessage
  | CustomMessage
  | ReturnMessage
  | GameSaved
  | ObjectCreated;

/**
 * Implements https://api.tabletopsimulator.com/externaleditorapi.
 */
export default class ExternalEditorApi extends Emittery.Typed<
  {
    pushingNewObject: PushingNewObject;
    loadingANewGame: LoadingANewGame;
    printDebugMessage: PrintDebugMessage;
    errorMessage: ErrorMessage;
    customMessage: CustomMessage;
    returnMessage: ReturnMessage;
    gameSaved: GameSaved;
    objectCreated: ObjectCreated;
  },
  ReceivedEventNames
> {
  private readonly clientPort: number;
  private readonly serverPort: number;
  private server = new Server();

  constructor(options: Options = {}) {
    super();
    this.clientPort = options.clientPort || 39999;
    this.serverPort = options.serverPort || 39998;
  }

  /**
   * Listens for incoming connections.
   *
   * Returns the port being listened on, if available.
   */
  public listen(): Promise<number | undefined> {
    return new Promise((resolve) => {
      this.server.listen(this.serverPort, () => {
        const address = this.server.address() as AddressInfo | null;
        if (address) {
          resolve(address.port);
        } else {
          resolve(undefined);
        }
        this.server.on('connection', (socket) => {
          const chunks: Buffer[] = [];
          socket.on('data', (data: Buffer) => {
            chunks.push(data);
          });
          socket.on('end', () => {
            this.onDataReceived(Buffer.concat(chunks).toString('utf-8'));
          });
        });
      });
    });
  }

  /**
   * Stops listening to incoming connections.
   *
   * Does *NOT* attempt to cancel pending outgoing connections/messages.
   */
  public close(): void {
    this.server.close();
  }

  private onDataReceived(data: string): void {
    const message = JSON.parse(data) as ReceivedEventTypes;
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

  private send<T extends number>(message: JsonMessage<T>): Promise<void> {
    const client = new Socket();
    return new Promise((resolve, reject) => {
      client.once('error', reject);
      client.connect(this.clientPort, '127.0.0.1', () => {
        client.write(JSON.stringify(message), (error) => {
          if (error) {
            reject(error);
          } else {
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
  public async getLuaScripts(): Promise<LoadingANewGame> {
    const message: GetLuaScripts = {
      messageID: 0,
    };
    await this.send(message);
    return this.once('loadingANewGame');
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
  public async saveAndPlay(
    scriptStates: OutgoingJsonObject[],
  ): Promise<LoadingANewGame> {
    const message: SaveAndPlay = {
      messageID: 1,
      scriptStates,
    };
    await this.send(message);
    return this.once('loadingANewGame');
  }

  /**
   * Sends a custom table (JSON dictionary) to `onExternalMessage`.
   *
   * @see https://api.tabletopsimulator.com/externaleditorapi/#custom-message
   */
  public async customMessage(customMessage: unknown): Promise<void> {
    const message: SendCustomMessage = {
      messageID: 2,
      customMessage,
    };
    return this.send(message);
  }

  /**
   * Executes the provided Lua code for the associated GUID.
   *
   * @see https://api.tabletopsimulator.com/externaleditorapi/#execute-lua-code
   */
  public async executeLuaCode(
    script: string,
    guid = '-1',
    returnID = 0,
  ): Promise<void> {
    const message: ExecuteLuaCode = {
      messageID: 3,
      returnID,
      script,
      guid,
    };
    return this.send(message);
  }

  public async executeLuaCodeAndReturn<T>(
    script: string,
    guid = '-1',
    returnID = 0,
  ): Promise<T> {
    await this.executeLuaCode(script, guid, returnID);
    return this.once('returnMessage').then((v) => v.returnValue as T);
  }
}

export type SentEventNames =
  | 'getLuaScripts'
  | 'saveAndPlay'
  | 'customMessage'
  | 'executeLuaCode';

export type SentEventTypes =
  | GetLuaScripts
  | SaveAndPlay
  | SendCustomMessage
  | ExecuteLuaCode;

/**
 * A fake implementation of the TTS backend.
 *
 * This allows testing usages of @see ExternalEditorApi.
 */
export class TTSApiBackend extends Emittery.Typed<
  {
    getLuaScripts: GetLuaScripts;
    saveAndPlay: SaveAndPlay;
    customMessage: SendCustomMessage;
    executeLuaCode: ExecuteLuaCode;
  },
  SentEventNames
> {
  private readonly server = new Server();
  public sendPort?: number;

  /**
   * Listens for connections and returns the port being listened to.
   */
  public listen(): Promise<number | undefined> {
    return new Promise((resolve) => {
      this.server.listen(0, () => {
        const address = this.server.address() as AddressInfo | null;
        if (address) {
          resolve(address.port);
        } else {
          resolve(undefined);
        }
        this.server.on('connection', (socket) => {
          socket.on('data', this.onDataReceived.bind(this));
        });
      });
    });
  }

  public close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.close((error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  private onDataReceived(data: Buffer): void {
    const message = JSON.parse(data.toString('utf8')) as SentEventTypes;
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

  private send<T extends number>(message: JsonMessage<T>): Promise<void> {
    const sendPort = this.sendPort;
    if (!sendPort) {
      throw new Error('Must assign .sendPort= before sending messages');
    }
    const client = new Socket();
    return new Promise((resolve, reject) => {
      client.once('error', () => {
        reject();
      });
      client.connect(sendPort, () => {
        client.write(JSON.stringify(message), (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
          client.destroy();
        });
      });
    });
  }

  public pushNewObject(scriptStates: IncomingJsonObject[]): Promise<void> {
    const message: PushingNewObject = {
      messageID: 0,
      scriptStates,
    };
    return this.send(message);
  }

  public loadNewGame(scriptStates: IncomingJsonObject[]): Promise<void> {
    const message: LoadingANewGame = {
      messageID: 1,
      savePath:
        'C:\\Users\\FakeUser\\Documents\\My Games\\Tabletop Simulator\\Saves\\TS_Save_1.json',
      scriptStates,
    };
    return this.send(message);
  }

  public printDebugMessage(text: string): Promise<void> {
    const message: PrintDebugMessage = {
      messageID: 2,
      message: text,
    };
    return this.send(message);
  }

  public errorMessage(
    error: string,
    errorMessagePrefix: string,
    guid = '-1',
  ): Promise<void> {
    const message: ErrorMessage = {
      messageID: 3,
      error,
      errorMessagePrefix,
      guid,
    };
    return this.send(message);
  }

  public customMessage(customMessage: unknown): Promise<void> {
    const message: CustomMessage = {
      messageID: 4,
      customMessage,
    };
    return this.send(message);
  }

  public returnMessage(returnValue: unknown): Promise<void> {
    const message: ReturnMessage = {
      messageID: 5,
      returnID: 0,
      returnValue,
    };
    return this.send(message);
  }

  public gameSaved(): Promise<void> {
    const message: GameSaved = {
      messageID: 6,
      savePath:
        'C:\\Users\\FakeUser\\Documents\\My Games\\Tabletop Simulator\\Saves\\TS_Save_1.json',
    };
    return this.send(message);
  }

  public objectCreated(guid: string): Promise<void> {
    const message: ObjectCreated = {
      messageID: 7,
      guid,
    };
    return this.send(message);
  }
}
