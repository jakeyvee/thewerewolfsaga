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
  eliminatePlayerTele,
  getOrCreatePubkey,
  getRoleTele,
  joinGameTele,
  killPlayerTele,
  respondAliveKillOptions,
  respondAliveSeeOptions,
  respondAliveVoteOptions,
  seePlayerTele,
  startGameTele,
  votePlayerTele,
} from "./bot-helpers";

bot.onText(/^\/start$/, async (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.from.username;
  const userId = msg.from.id;
  await getOrCreatePubkey(userId, userName, chatId);
});

bot.onText(/\/creategame/, async (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.from.username;
  const userId = msg.from.id;
  try {
    const isExistingUser = await checkExistingUser(userId, userName, chatId);
    if (!isExistingUser) return;

    if (userStates[userId] && userStates[userId].state) {
      bot.sendMessage(
        chatId,
        "You are already in the middle of another operation. Please finish it first."
      );
      return;
    }

    setUserState(userId, States.AWAITING_CREATE_GAME_NAME);
    bot.sendMessage(chatId, "Please enter the name of the game:");
  } catch (err) {
    bot.sendMessage(chatId, err);
  }
});

bot.onText(/\/joingame/, async (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.from.username;
  const userId = msg.from.id;
  try {
    const isExistingUser = await checkExistingUser(userId, userName, chatId);
    if (!isExistingUser) return;

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
  } catch (err) {
    bot.sendMessage(chatId, err);
  }
});

bot.onText(/\/startgame/, async (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.from.username;
  const userId = msg.from.id;
  try {
    const isExistingUser = await checkExistingUser(userId, userName, chatId);
    if (!isExistingUser) return;

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
  } catch (err) {
    bot.sendMessage(chatId, err);
  }
});

bot.onText(/\/getrole/, async (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.from.username;
  const userId = msg.from.id;
  try {
    const isExistingUser = await checkExistingUser(userId, userName, chatId);
    if (!isExistingUser) return;

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
  } catch (err) {
    bot.sendMessage(chatId, err);
  }
});

bot.onText(/\/killplayer/, async (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.from.username;
  const userId = msg.from.id;
  try {
    const isExistingUser = await checkExistingUser(userId, userName, chatId);
    if (!isExistingUser) return;

    if (userStates[userId] && userStates[userId].state) {
      bot.sendMessage(
        chatId,
        "You are already in the middle of another operation. Please finish it first."
      );
      return;
    }

    setUserState(userId, States.AWAITING_KILL_PLAYER_GAME_NAME);
    bot.sendMessage(chatId, "Please enter the name of the game:");
  } catch (err) {
    bot.sendMessage(chatId, err);
  }
});

bot.onText(/\/seeplayer/, async (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.from.username;
  const userId = msg.from.id;
  try {
    const isExistingUser = await checkExistingUser(userId, userName, chatId);
    if (!isExistingUser) return;

    if (userStates[userId] && userStates[userId].state) {
      bot.sendMessage(
        chatId,
        "You are already in the middle of another operation. Please finish it first."
      );
      return;
    }

    setUserState(userId, States.AWAITING_SEE_PLAYER_GAME_NAME);
    bot.sendMessage(chatId, "Please enter the name of the game:");
  } catch (err) {
    bot.sendMessage(chatId, err);
  }
});

bot.onText(/\/voteplayer/, async (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.from.username;
  const userId = msg.from.id;
  try {
    const isExistingUser = await checkExistingUser(userId, userName, chatId);
    if (!isExistingUser) return;

    if (userStates[userId] && userStates[userId].state) {
      bot.sendMessage(
        chatId,
        "You are already in the middle of another operation. Please finish it first."
      );
      return;
    }

    const chatGame = chatGames[chatId];

    if (chatGame) {
      await respondAliveVoteOptions(
        chatGame.state,
        userId,
        chatId,
        msg.message_id
      );
    } else {
      setUserState(userId, States.AWAITING_VOTE_PLAYER_GAME_NAME);
      bot.sendMessage(chatId, "Please enter the name of the game:");
    }
  } catch (err) {
    bot.sendMessage(chatId, err);
  }
});

bot.onText(/\/eliminateplayer/, async (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.from.username;
  const userId = msg.from.id;
  try {
    const isExistingUser = await checkExistingUser(userId, userName, chatId);
    if (!isExistingUser) return;

    if (userStates[userId] && userStates[userId].state) {
      bot.sendMessage(
        chatId,
        "You are already in the middle of another operation. Please finish it first."
      );
      return;
    }

    const chatGame = chatGames[chatId];

    if (chatGame) {
      await eliminatePlayerTele(chatGame.state, userId, chatId);
    } else {
      setUserState(userId, States.AWAITING_ELIMINATE_PLAYER_GAME_NAME);
      bot.sendMessage(chatId, "Please enter the name of the game:");
    }
  } catch (err) {
    bot.sendMessage(chatId, err);
  }
});

bot.on("message", async (msg) => {
  if (!msg.text || msg.text.startsWith("/")) {
    return; // Ignore non-text messages and commands
  }

  const userId = msg.from.id;
  const chatId = msg.chat.id;
  const userState = userStates[userId];

  try {
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
    } else if (
      userState &&
      userState.state === States.AWAITING_JOIN_GAME_NAME
    ) {
      const gameName = msg.text;
      setChatGame(chatId, gameName);
      await joinGameTele(gameName, userId, chatId);
    } else if (
      userState &&
      userState.state === States.AWAITING_START_GAME_NAME
    ) {
      const gameName = msg.text;
      setChatGame(chatId, gameName);
      await startGameTele(gameName, userId, chatId);
    } else if (
      userState &&
      userState.state === States.AWAITING_GET_ROLE_GAME_NAME
    ) {
      const gameName = msg.text;
      setChatGame(chatId, gameName);
      await getRoleTele(gameName, userId, chatId);
    } else if (
      userState &&
      userState.state === States.AWAITING_KILL_PLAYER_GAME_NAME
    ) {
      const gameName = msg.text;
      await respondAliveKillOptions(gameName, userId, chatId, msg.message_id);
    } else if (
      userState &&
      userState.state === States.AWAITING_KILL_PLAYER_TARGET_NAME
    ) {
      const gameName = msg.text;
      await killPlayerTele(gameName, userId, chatId);
    } else if (
      userState &&
      userState.state === States.AWAITING_SEE_PLAYER_GAME_NAME
    ) {
      const gameName = msg.text;
      await respondAliveSeeOptions(gameName, userId, chatId, msg.message_id);
    } else if (
      userState &&
      userState.state === States.AWAITING_SEE_PLAYER_TARGET_NAME
    ) {
      const targetUserName = msg.text;
      await seePlayerTele(targetUserName, userId, chatId);
    } else if (
      userState &&
      userState.state === States.AWAITING_VOTE_PLAYER_GAME_NAME
    ) {
      const gameName = msg.text;
      await respondAliveVoteOptions(gameName, userId, chatId, msg.message_id);
    } else if (
      userState &&
      userState.state === States.AWAITING_VOTE_PLAYER_TARGET_NAME
    ) {
      const gameName = msg.text;
      await votePlayerTele(gameName, userId, chatId);
    } else if (
      userState &&
      userState.state === States.AWAITING_ELIMINATE_PLAYER_GAME_NAME
    ) {
      const gameName = msg.text;
      setChatGame(chatId, gameName);
      await eliminatePlayerTele(gameName, userId, chatId);
    }
  } catch (err) {
    bot.sendMessage(chatId, err);
  }
});
