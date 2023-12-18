import {
  States,
  TIMEOUT,
  bot,
  chatGames,
  setChatGame,
  setUserState,
  userStates,
} from "./states";
import {
  checkExistingUser,
  createGameTele,
  getRoleTele,
  joinGameTele,
  startGameTele,
} from "./bot-helpers";

bot.onText(/\/creategame/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  await checkExistingUser(userId, chatId);

  if (userStates[userId] && userStates[userId].state) {
    bot.sendMessage(
      chatId,
      "You are already in the middle of another operation. Please finish it first."
    );
    return;
  }

  setUserState(userId, States.AWAITING_CREATE_GAME_NAME);
  bot.sendMessage(chatId, "Please enter the name of the game:");
});

bot.onText(/\/joingame/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  await checkExistingUser(userId, chatId);

  if (userStates[userId] && userStates[userId].state) {
    bot.sendMessage(
      chatId,
      "You are already in the middle of another operation. Please finish it first."
    );
    return;
  }

  const chatGame = chatGames[chatId];

  if (chatGame) {
    await joinGameTele(chatGame.state, userId, chatId);
  } else {
    setUserState(userId, States.AWAITING_JOIN_GAME_NAME);
    bot.sendMessage(chatId, "Please enter the name of the game:");
  }
});

bot.onText(/\/startgame/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  await checkExistingUser(userId, chatId);

  if (userStates[userId] && userStates[userId].state) {
    bot.sendMessage(
      chatId,
      "You are already in the middle of another operation. Please finish it first."
    );
    return;
  }

  const chatGame = chatGames[chatId];

  if (chatGame) {
    await startGameTele(chatGame.state, userId, chatId);
  } else {
    setUserState(userId, States.AWAITING_START_GAME_NAME);
    bot.sendMessage(chatId, "Please enter the name of the game:");
  }
});

bot.onText(/\/getrole/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  await checkExistingUser(userId, chatId);

  if (userStates[userId] && userStates[userId].state) {
    bot.sendMessage(
      chatId,
      "You are already in the middle of another operation. Please finish it first."
    );
    return;
  }

  const chatGame = chatGames[chatId];

  if (chatGame) {
    await getRoleTele(chatGame.state, userId, chatId);
  } else {
    setUserState(userId, States.AWAITING_GET_ROLE_GAME_NAME);
    bot.sendMessage(chatId, "Please enter the name of the game:");
  }
});

bot.on("message", async (msg) => {
  if (!msg.text || msg.text.startsWith("/")) {
    return; // Ignore non-text messages and commands
  }

  const userId = msg.from.id;
  const chatId = msg.chat.id;
  const userState = userStates[userId];

  if (userState) {
    const timeElapsed = Date.now() - userState.timestamp;

    if (timeElapsed > TIMEOUT) {
      // User took too long to respond, reset state
      bot.sendMessage(
        chatId,
        "You took too long to respond. Please start again."
      );
      delete userStates[userId];
      return;
    }
  }

  if (userState && userState.state === States.AWAITING_CREATE_GAME_NAME) {
    const gameName = msg.text;
    setChatGame(chatId, gameName);
    await createGameTele(gameName, userId, chatId);
  } else if (userState &&  userState.state === States.AWAITING_JOIN_GAME_NAME) {
    const gameName = msg.text;
    setChatGame(chatId, gameName);
    await joinGameTele(gameName, userId, chatId);
  } else if (userState && userState.state === States.AWAITING_START_GAME_NAME) {
    const gameName = msg.text;
    setChatGame(chatId, gameName);
    await startGameTele(gameName, userId, chatId);
  }else if (userState && userState.state === States.AWAITING_GET_ROLE_GAME_NAME) {
    const gameName = msg.text;
    setChatGame(chatId, gameName);
    await getRoleTele(gameName, userId, chatId);
  }
});
