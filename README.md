# tts-editor

A Node.js implementation of the [External Editor API][1] for Tabletop Simulator.

This is intended to make it easier to write development tools and plugins
intead of using the built-in script editor or the [Official Atom Plugin][2] for
Tabletop Simulator.

## `ExternalEditorApi`

```ts
(async () => {
  // Create an API client and listen to incoming messages.
  const api = new ExternalEditorApi();
  await api.listen();

  // You are now ready to send/receive messages.
})();
```

You can send four outgoing message types:

### Get Lua Scripts

https://api.tabletopsimulator.com/externaleditorapi/#get-lua-scripts

```ts
async function getLuaScripts(api: ExternalEditorApi) {
  const gameState = await api.getLuaScripts();
  console.log(gameState);
}
```

### Save & Play

https://api.tabletopsimulator.com/externaleditorapi/#save-play

```ts
async function saveAndPlay(api: ExternalEditorApi) {
  const gameState = await api.saveAndPlay();
  console.log(gameState);
}
```

### Custom Message

https://api.tabletopsimulator.com/externaleditorapi/#custom-message

```ts
async function customMessage(api: ExternalEditorApi) {
  await api.customMessage({
    foo: 'Hello',
    bar: 'World',
  });
}
```

### Execute Lua Script

https://api.tabletopsimulator.com/externaleditorapi/#pushing-new-object

```ts
async function executeLuaCode(api: ExternalEditorApi) {
  await api.executeLuaCode('print("Hello, World")');
}
```

---

You can also listen to eight incoming message types:

### Pushing New Object

https://api.tabletopsimulator.com/externaleditorapi/#pushing-new-object

```ts
async function pushingNewObject(api: ExternalEditorApi) {
  const gameState = await api.once('pushingNewObject');
  console.log(gameState);
}
```

### Loading a New Game

https://api.tabletopsimulator.com/externaleditorapi/#loading-a-new-game

```ts
async function loadingANewGame(api: ExternalEditorApi) {
  const gameState = await api.once('loadingANewGame');
  console.log(gameState);
}
```

### Print/Debug Messages

https://api.tabletopsimulator.com/externaleditorapi/#printdebug-messages

```ts
async function printDebugMessage(api: ExternalEditorApi) {
  const debugMessage = await api.once('printDebugMessage');
  console.log(debugMessage);
}
```

### Error Messages

https://api.tabletopsimulator.com/externaleditorapi/#error-messages

```ts
async function errorMessage(api: ExternalEditorApi) {
  const errorMessage = await api.once('errorMessage');
  console.log(errorMessage);
}
```

### Custom messages

https://api.tabletopsimulator.com/externaleditorapi/#custom-messages

```ts
async function customMessage(api: ExternalEditorApi) {
  const customMessage = await api.once('customMessage');
  console.log(customMessage);
}
```

### Return messages

https://api.tabletopsimulator.com/externaleditorapi/#return-messages

```ts
async function returnMessage(api: ExternalEditorApi) {
  const returnMessage = await api.once('returnMessage');
  console.log(returnMessage);
}
```

### Game Saved

https://api.tabletopsimulator.com/externaleditorapi/#game-saved

```ts
async function gameSaved(api: ExternalEditorApi) {
  await api.once('gameSaved');
}
```

### Object Created

https://api.tabletopsimulator.com/externaleditorapi/#object-created

```ts
async function objectCreated(api: ExternalEditorApi) {
  const objectCreated = await api.once('objectCreated');
  console.log(objectCreated);
}
```

## `TTSApiBackend`

A stub of the Tabletop Simulator server, or backend, is also provided to make
it easier to test usages of the [`ExternalEditorApi`](#externaleditorapi)
client. For examples of use see `test/fake_tts_test.ts`.

[1]: https://api.tabletopsimulator.com/externaleditorapi/
[2]: https://api.tabletopsimulator.com/externaleditorapi/atom
