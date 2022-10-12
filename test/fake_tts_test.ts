import ExternalEditorApi, {
  CustomMessage,
  ErrorMessage,
  ExecuteLuaCode,
  LoadingANewGame,
  ObjectCreated,
  PrintDebugMessage,
  PushingNewObject,
  ReturnMessage,
  SaveAndPlay,
  SendCustomMessage,
  TTSApiBackend,
} from '../src/index';

let client: ExternalEditorApi;
let server: TTSApiBackend;

beforeEach(async () => {
  server = new TTSApiBackend();
  client = new ExternalEditorApi({
    clientPort: await server.listen(),
    serverPort: 0,
  });
  server.sendPort = await client.listen();
});

afterEach(async () => {
  server.close();
  client.close();
});

test('should receive pushingNewObject', async () => {
  const data: PushingNewObject = {
    messageID: 0,
    scriptStates: [
      {
        name: 'Chess Pawn',
        guid: 'db3f06',
        script: '',
      },
    ],
  };
  expect(client.once('pushingNewObject')).resolves.toEqual(data);
  await server.pushNewObject(data.scriptStates);
});

test('should receive pushingNewObject', async () => {
  const data: LoadingANewGame = {
    messageID: 1,
    savePath:
      'C:\\Users\\FakeUser\\Documents\\My Games\\Tabletop Simulator\\Saves\\TS_Save_1.json',
    scriptStates: [
      {
        name: 'Global',
        guid: '-1',
        script: '...',
        ui: '...',
      },
      {
        name: "BlackJack Dealer's Deck",
        guid: 'a0b2d5',
        script: '...',
      },
    ],
  };
  expect(client.once('loadingANewGame')).resolves.toEqual(data);
  await server.loadNewGame(data.scriptStates);
});

test('should receive printDebugMessage', async () => {
  const data: PrintDebugMessage = {
    messageID: 2,
    message: 'Hit player! White',
  };
  expect(client.once('printDebugMessage')).resolves.toEqual(data);
  await server.printDebugMessage(data.message);
});

test('should receive errorMessage', async () => {
  const data: ErrorMessage = {
    messageID: 3,
    error: "chunk_0:(36,4-8): unexpected symbol near 'deck'",
    guid: '-1',
    errorMessagePrefix: 'Error in Global Script: ',
  };
  expect(client.once('errorMessage')).resolves.toEqual(data);
  await server.errorMessage(data.error, data.errorMessagePrefix, data.guid);
});

test('should receive customMessage', async () => {
  const data: CustomMessage = {
    messageID: 4,
    customMessage: { foo: 'Hello', bar: 'World' },
  };
  expect(client.once('customMessage')).resolves.toEqual(data);
  await server.customMessage(data.customMessage);
});

test('should receive returnMessage', async () => {
  const data: ReturnMessage = {
    messageID: 5,
    returnID: 0,
    returnValue: true,
  };
  expect(client.once('returnMessage')).resolves.toEqual(data);
  await server.returnMessage(data.returnValue);
});

test('should receive gameSaved', async () => {
  expect(client.once('returnMessage')).resolves;
  await server.gameSaved();
});

test('should receive objectCreated', async () => {
  const data: ObjectCreated = {
    messageID: 7,
    guid: 'abcdef',
  };
  expect(client.once('objectCreated')).resolves.toEqual(data);
  await server.objectCreated(data.guid);
});

test('should send getLuaScripts', async () => {
  const outgoing: LoadingANewGame = {
    messageID: 1,
    savePath:
      'C:\\Users\\FakeUser\\Documents\\My Games\\Tabletop Simulator\\Saves\\TS_Save_1.json',
    scriptStates: [
      {
        name: 'Global',
        guid: '-1',
        script: '...',
        ui: '...',
      },
      {
        name: "BlackJack Dealer's Deck",
        guid: 'a0b2d5',
        script: '...',
      },
    ],
  };
  const waitFor = server.once('getLuaScripts').then(() => {
    return server.loadNewGame(outgoing.scriptStates);
  });
  expect(client.getLuaScripts()).resolves.toEqual(outgoing);
  await waitFor;
});

test('should send saveAndPlay', async () => {
  const incoming: SaveAndPlay = {
    messageID: 1,
    scriptStates: [
      {
        guid: '-1',
        script: '...',
        ui: '...',
      },
      {
        guid: 'a0b2d5',
        script: '...',
      },
    ],
  };
  const outgoing: LoadingANewGame = {
    messageID: 1,
    savePath:
      'C:\\Users\\FakeUser\\Documents\\My Games\\Tabletop Simulator\\Saves\\TS_Save_1.json',
    scriptStates: [
      {
        name: 'Global',
        guid: '-1',
        script: '...',
        ui: '...',
      },
      {
        name: "BlackJack Dealer's Deck",
        guid: 'a0b2d5',
        script: '...',
      },
    ],
  };
  const result = server.once('saveAndPlay').then((data) => {
    return server.loadNewGame(outgoing.scriptStates).then(() => {
      return data;
    });
  });
  expect(result).resolves.toEqual(incoming);
  expect(client.saveAndPlay(incoming.scriptStates)).resolves.toEqual(outgoing);
  await result;
});

test('should send customMessage', async () => {
  const data: SendCustomMessage = {
    messageID: 2,
    customMessage: {},
  };
  expect(server.once('customMessage')).resolves.toEqual(data);
  await client.customMessage(data.customMessage);
});

test('should send executeLuaCode', async () => {
  const data: ExecuteLuaCode = {
    messageID: 3,
    guid: '-1',
    script: 'print("Hello, World")',
  };
  expect(server.once('executeLuaCode')).resolves.toEqual(data);
  await client.executeLuaCode(data.script, data.guid);
});
