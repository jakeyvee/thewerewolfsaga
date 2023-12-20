import bs58 from "bs58";
import {
  States,
  bot,
  chatGames,
  conn,
  getChatId,
  latestUserGames,
  setLatestUserGames,
  setUserState,
  supabase,
  userStates,
  wwc,
  wwsKeypair,
} from "./states";
import { SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { RoleType } from "./game-types";
import TelegramBot from "node-telegram-bot-api";

export const getOrCreatePubkey = async (
  userId: number,
  username: string,
  chatId: number
) => {
  // Check if the user is already in a process
  try {
    const { data, error } = await supabase
      .from("werewolf")
      .select("*")
      .eq("user_telegram_id", userId);

    if (data.length === 0) {
      const userKp = anchor.web3.Keypair.generate();
      const secretKeyBase58 = bs58.encode(userKp.secretKey);

      await bot.sendMessage(
        userId,
        `Hello! I am the bot for The Werewolf Saga game powered on Solana.`
      );

      const { error } = await supabase.from("werewolf").insert({
        user_telegram_id: userId,
        user_telegram_username: username,
        user_wallet_secret: secretKeyBase58,
        user_wallet_pubkey: userKp.publicKey.toBase58(),
      });

      bot.sendMessage(
        userId,
        `Since this is our first interaction, I have generated a Solana wallet address for you. Your game actions and rewards will be linked to this wallet. Your wallet's public key is:${userKp.publicKey.toBase58()}`
      );
    } else {
      bot.sendMessage(
        userId,
        `Your wallet's public key is:${data[0].user_wallet_pubkey}`
      );
    }
  } catch (err) {
    bot.sendMessage(
      chatId,
      `Please start a conversation with me privately before we begin.[Start Chart](https://t.me/werewolfsaga_bot)`,
      { parse_mode: "Markdown" }
    );
  }
};

export const checkExistingUser = async (
  userId: number,
  username: string,
  chatId: number
) => {
  // Check if the user is already in a process

  const { data, error } = await supabase
    .from("werewolf")
    .select("*")
    .eq("user_telegram_id", userId);

  if (data.length === 0) {
    bot.sendMessage(
      chatId,
      `Please start a conversation with me privately before we begin.[Start Chart](https://t.me/werewolfsaga_bot)`,
      { parse_mode: "Markdown" }
    );
    return false;
  } else {
    return true;
  }
};

export const createGameTele = async (
  gameName: string,
  userId: number,
  chatId: number
) => {
  const { data, error } = await supabase
    .from("werewolf")
    .select("*")
    .eq("user_telegram_id", userId);
  const secretKeyUint8Array = bs58.decode(data[0].user_wallet_secret);
  const organiserKeypair =
    anchor.web3.Keypair.fromSecretKey(secretKeyUint8Array);

  const organiserAcc = await conn.getAccountInfo(organiserKeypair.publicKey);

  const [gameAccountPda] = wwc.findGamePDA(gameName);

  try {
    if (
      !organiserAcc ||
      (organiserAcc && organiserAcc.lamports < 0.005 * LAMPORTS_PER_SOL)
    ) {
      const transferIx = SystemProgram.transfer({
        fromPubkey: wwsKeypair.publicKey,
        toPubkey: organiserKeypair.publicKey,
        lamports: 0.01 * LAMPORTS_PER_SOL,
      });

      await wwc.createGame(
        organiserKeypair,
        gameAccountPda,
        gameName,
        [wwsKeypair],
        [transferIx]
      );
    } else {
      await wwc.createGame(organiserKeypair, gameAccountPda, gameName);
    }
    bot.sendMessage(chatId, `Game '${gameName}' has been created.`);
  } catch (err) {
    bot.sendMessage(
      chatId,
      `Failed to create game, ensure that your wallet has at least 0.01SOL. Please try again. ERROR:${err}`
    );
  } finally {
    delete userStates[userId];
  }
};

export const joinGameTele = async (
  gameName: string,
  userId: number,
  chatId: number
) => {
  const { data, error } = await supabase
    .from("werewolf")
    .select("*")
    .eq("user_telegram_id", userId);
  const secretKeyUint8Array = bs58.decode(data[0].user_wallet_secret);
  const organiserKeypair =
    anchor.web3.Keypair.fromSecretKey(secretKeyUint8Array);

  const [userPlayProof] = wwc.findPlayProofPDA(
    organiserKeypair.publicKey,
    gameName
  );

  const organiserAcc = await conn.getAccountInfo(organiserKeypair.publicKey);

  const [gameAccountPda] = wwc.findGamePDA(gameName);

  try {
    if (
      !organiserAcc ||
      (organiserAcc && organiserAcc.lamports < 0.005 * LAMPORTS_PER_SOL)
    ) {
      const transferIx = SystemProgram.transfer({
        fromPubkey: wwsKeypair.publicKey,
        toPubkey: organiserKeypair.publicKey,
        lamports: 0.01 * LAMPORTS_PER_SOL,
      });

      await wwc.joinGame(
        organiserKeypair,
        userPlayProof,
        gameAccountPda,
        [wwsKeypair],
        [transferIx]
      );
    } else {
      await wwc.joinGame(organiserKeypair, userPlayProof, gameAccountPda);
    }
    bot.sendMessage(chatId, `Joined game '${gameName}'!`);
  } catch (err) {
    bot.sendMessage(
      chatId,
      `Failed to create game, ensure that your wallet has at least 0.01SOL. Please try again. ERROR:${err}`
    );
  } finally {
    delete userStates[userId];
  }
};

export const startGameTele = async (
  gameName: string,
  userId: number,
  chatId: number
) => {
  const { data, error } = await supabase
    .from("werewolf")
    .select("*")
    .eq("user_telegram_id", userId);
  const secretKeyUint8Array = bs58.decode(data[0].user_wallet_secret);
  const userKeypair = anchor.web3.Keypair.fromSecretKey(secretKeyUint8Array);

  const organiserAcc = await conn.getAccountInfo(userKeypair.publicKey);

  const [gameAccountPda] = wwc.findGamePDA(gameName);

  try {
    if (
      !organiserAcc ||
      (organiserAcc && organiserAcc.lamports < 0.005 * LAMPORTS_PER_SOL)
    ) {
      const transferIx = SystemProgram.transfer({
        fromPubkey: wwsKeypair.publicKey,
        toPubkey: userKeypair.publicKey,
        lamports: 0.01 * LAMPORTS_PER_SOL,
      });

      await wwc.startGame(
        userKeypair,
        gameAccountPda,
        [wwsKeypair],
        [transferIx]
      );
    } else {
      await wwc.startGame(userKeypair, gameAccountPda);
    }
    bot.sendMessage(
      chatId,
      `As the twilight fades into the deep embrace of the night, a hush falls over our quaint village, and an air of mystery and anticipation wraps around every corner. The moon, a silvery guardian in the sky, casts its ethereal glow upon the village, unveiling a night of covert endeavors and hidden truths.`
    );
    bot.sendMessage(
      chatId,
      `Now is the time for the stealthy Wolf to embark on its first hunt, its eyes gleaming with cunning and hunger under the moonlit sky. In the shadows, the Seer, keeper of arcane secrets, prepares to unveil the true nature of one amongst us.`
    );
    bot.sendMessage(
      chatId,
      `INSTRUCTION: Everyone, please check your role by using the command \`/getrole\`. Wolf and Seer, please privately message me of your first target.`
    );
  } catch (err) {
    bot.sendMessage(
      chatId,
      `Failed to create game, ensure that your wallet has at least 0.01SOL. Please try again. ERROR:${err}`
    );
  } finally {
    delete userStates[userId];
  }
};

export const getRoleTele = async (
  gameName: string,
  userId: number,
  chatId: number
) => {
  const { data, error } = await supabase
    .from("werewolf")
    .select("*")
    .eq("user_telegram_id", userId);
  const secretKeyUint8Array = bs58.decode(data[0].user_wallet_secret);
  const playerKeypair = anchor.web3.Keypair.fromSecretKey(secretKeyUint8Array);

  const [playerPlayProof] = wwc.findPlayProofPDA(
    playerKeypair.publicKey,
    gameName
  );

  const organiserAcc = await conn.getAccountInfo(playerKeypair.publicKey);

  const [gameAccountPda] = wwc.findGamePDA(gameName);

  try {
    if (
      !organiserAcc ||
      (organiserAcc && organiserAcc.lamports < 0.005 * LAMPORTS_PER_SOL)
    ) {
      const transferIx = SystemProgram.transfer({
        fromPubkey: wwsKeypair.publicKey,
        toPubkey: playerKeypair.publicKey,
        lamports: 0.01 * LAMPORTS_PER_SOL,
      });

      await wwc.fillPlayProof(
        playerKeypair,
        playerPlayProof,
        gameAccountPda,
        [wwsKeypair],
        [transferIx]
      );
    } else {
      await wwc.fillPlayProof(playerKeypair, playerPlayProof, gameAccountPda);
    }
    const playerPlayProofAcc = await wwc.fetchPlayProofAcc(playerPlayProof);
    bot.sendMessage(
      userId,
      `Your role is ${RoleType[playerPlayProofAcc.role]} in game ${gameName}`
    );
  } catch (err) {
    bot.sendMessage(
      chatId,
      `Failed to create game, ensure that your wallet has at least 0.01SOL. Please try again. ERROR:${err}`
    );
  } finally {
    delete userStates[userId];
  }
};

const getAliveOptions = async (gameName: string, messageId: number) => {
  const [gameAccountPda] = wwc.findGamePDA(gameName);

  const gameAlivePlayProofAccs = await wwc.fetchAllAlivePlayProofByGameKey(
    gameAccountPda
  );
  const alivePlayPubKeys = gameAlivePlayProofAccs.map((val) =>
    val.account.player.toBase58()
  );
  const { data, error } = await supabase.from("werewolf").select("*");

  const aliveUsername = data
    .filter((val) => {
      const secretKeyUint8Array = bs58.decode(val.user_wallet_secret);
      const playerKeypair =
        anchor.web3.Keypair.fromSecretKey(secretKeyUint8Array);
      return alivePlayPubKeys.includes(playerKeypair.publicKey.toBase58());
    })
    .map((val) => [{ text: val.user_telegram_username }]);

  const options: TelegramBot.SendMessageOptions = {
    reply_markup: {
      keyboard: aliveUsername,
      resize_keyboard: true,
      one_time_keyboard: true,
    },
    reply_to_message_id: messageId,
  };

  return options;
};

export const respondAliveKillOptions = async (
  gameName: string,
  userId: number,
  chatId: number,
  messageId: number
) => {
  const options = await getAliveOptions(gameName, messageId);
  setUserState(userId, States.AWAITING_KILL_PLAYER_TARGET_NAME);
  setLatestUserGames(userId, gameName);
  bot.sendMessage(chatId, "Choose a target to kill:", options);
};

export const killPlayerTele = async (
  targetUserName: string,
  userId: number,
  chatId: number
) => {
  const gameName = latestUserGames[userId].state;
  const wolfDb = await supabase
    .from("werewolf")
    .select("*")
    .eq("user_telegram_id", userId);
  const villagerDb = await supabase
    .from("werewolf")
    .select("*")
    .eq("user_telegram_username", targetUserName);

  const wolfKeyUint8Array = bs58.decode(wolfDb.data[0].user_wallet_secret);
  const wolfKeypair = anchor.web3.Keypair.fromSecretKey(wolfKeyUint8Array);

  const villagerKbeyUint8Array = bs58.decode(
    villagerDb.data[0].user_wallet_secret
  );
  const villagerKeypair = anchor.web3.Keypair.fromSecretKey(
    villagerKbeyUint8Array
  );

  const [wolfPlayProof] = wwc.findPlayProofPDA(wolfKeypair.publicKey, gameName);

  const wolfAcc = await conn.getAccountInfo(wolfKeypair.publicKey);

  const [villagerPlayProof] = wwc.findPlayProofPDA(
    villagerKeypair.publicKey,
    gameName
  );

  const [gameAccountPda] = wwc.findGamePDA(gameName);
  const gameAccount = await wwc.fetchGameAcc(gameAccountPda);

  const [killProof] = wwc.findKillProofPDA(gameAccount.round, gameName);

  try {
    if (!wolfAcc || (wolfAcc && wolfAcc.lamports < 0.005 * LAMPORTS_PER_SOL)) {
      const transferIx = SystemProgram.transfer({
        fromPubkey: wwsKeypair.publicKey,
        toPubkey: wolfKeypair.publicKey,
        lamports: 0.01 * LAMPORTS_PER_SOL,
      });

      await wwc.killPlayer(
        wolfKeypair,
        wolfPlayProof,
        villagerKeypair.publicKey,
        villagerPlayProof,
        killProof,
        gameAccountPda,
        [wwsKeypair],
        [transferIx]
      );
    } else {
      await wwc.killPlayer(
        wolfKeypair,
        wolfPlayProof,
        villagerKeypair.publicKey,
        villagerPlayProof,
        killProof,
        gameAccountPda
      );
    }
    const gameAccount = await wwc.fetchGameAcc(gameAccountPda);
    const targetChatId = getChatId(gameName) ? getChatId(gameName) : chatId;

    if (gameAccount.status == 1 << 2) {
      bot.sendMessage(
        targetChatId,
        `As dawn breaks, a chilling howl echoes; one among us has fallen prey to the shadowy wolf -- [@${villagerDb.data[0].user_telegram_username}](tg://user?id=${villagerDb.data[0].user_telegram_id}). There is only 1 or less villager left alive, the wolf has won.`,
        { parse_mode: "Markdown" }
      );

      delete chatGames[chatId];
    } else {
      bot.sendMessage(
        targetChatId,
        `As dawn breaks, a chilling howl echoes; one among us has fallen prey to the shadowy wolf -- [@${villagerDb.data[0].user_telegram_username}](tg://user?id=${villagerDb.data[0].user_telegram_id}). Mystery deepens.`,
        { parse_mode: "Markdown" }
      );
    }
  } catch (err) {
    bot.sendMessage(
      chatId,
      `Failed to create game, ensure that your wallet has at least 0.01SOL. Please try again. ERROR:${err}`
    );
  } finally {
    delete latestUserGames[userId];
    delete userStates[userId];
  }
};

export const respondAliveSeeOptions = async (
  gameName: string,
  userId: number,
  chatId: number,
  messageId: number
) => {
  const options = await getAliveOptions(gameName, messageId);
  setUserState(userId, States.AWAITING_SEE_PLAYER_TARGET_NAME);
  setLatestUserGames(userId, gameName);
  bot.sendMessage(chatId, "Choose a target to reveal:", options);
};

export const seePlayerTele = async (
  targetUserName: string,
  userId: number,
  chatId: number
) => {
  const gameName = latestUserGames[userId].state;
  const seerDb = await supabase
    .from("werewolf")
    .select("*")
    .eq("user_telegram_id", userId);
  const playerDb = await supabase
    .from("werewolf")
    .select("*")
    .eq("user_telegram_username", targetUserName);

  const seerKeyUint8Array = bs58.decode(seerDb.data[0].user_wallet_secret);
  const seerKeypair = anchor.web3.Keypair.fromSecretKey(seerKeyUint8Array);

  const playerKeyUint8Array = bs58.decode(playerDb.data[0].user_wallet_secret);
  const playerKeypair = anchor.web3.Keypair.fromSecretKey(playerKeyUint8Array);

  const [seerPlayProof] = wwc.findPlayProofPDA(seerKeypair.publicKey, gameName);

  const seerAcc = await conn.getAccountInfo(seerKeypair.publicKey);

  const [playerPlayProof] = wwc.findPlayProofPDA(
    playerKeypair.publicKey,
    gameName
  );

  const [gameAccountPda] = wwc.findGamePDA(gameName);
  const gameAccount = await wwc.fetchGameAcc(gameAccountPda);

  const [sightProof] = wwc.findSightProofPDA(gameAccount.round, gameName);

  try {
    if (!seerAcc || (seerAcc && seerAcc.lamports < 0.005 * LAMPORTS_PER_SOL)) {
      const transferIx = SystemProgram.transfer({
        fromPubkey: wwsKeypair.publicKey,
        toPubkey: seerKeypair.publicKey,
        lamports: 0.01 * LAMPORTS_PER_SOL,
      });

      const { txSig } = await wwc.seePlayer(
        seerKeypair,
        seerPlayProof,
        playerKeypair.publicKey,
        playerPlayProof,
        sightProof,
        gameAccountPda,
        [wwsKeypair],
        [transferIx]
      );

      const latestlockhash = await conn.getLatestBlockhash();

      await conn.confirmTransaction(
        {
          blockhash: latestlockhash.blockhash,
          lastValidBlockHeight: latestlockhash.lastValidBlockHeight,
          signature: txSig,
        },
        "finalized"
      );
    } else {
      const { txSig } = await wwc.seePlayer(
        seerKeypair,
        seerPlayProof,
        playerKeypair.publicKey,
        playerPlayProof,
        sightProof,
        gameAccountPda
      );

      const latestlockhash = await conn.getLatestBlockhash();

      await conn.confirmTransaction(
        {
          blockhash: latestlockhash.blockhash,
          lastValidBlockHeight: latestlockhash.lastValidBlockHeight,
          signature: txSig,
        },
        "finalized"
      );
    }

    const targetChatId = getChatId(gameName) ? getChatId(gameName) : chatId;
    const sighProofAcc = await wwc.fetchSightProofAcc(sightProof);
    bot.sendMessage(
      userId,
      `The player's role is: ${RoleType[sighProofAcc.role]}`
    );
    bot.sendMessage(
      targetChatId,
      `The Seer's vision pierces the night's veil; a truth revealed, casting light on hidden shadows. The village stirs, enlightened.`
    );
  } catch (err) {
    bot.sendMessage(
      chatId,
      `Failed to create game, ensure that your wallet has at least 0.01SOL. Please try again. ERROR:${err}`
    );
  } finally {
    delete latestUserGames[userId];
    delete userStates[userId];
  }
};

export const votePlayerTele = async (
  targetUserName: string,
  userId: number,
  chatId: number
) => {
  const gameName = latestUserGames[userId].state;
  const voterDb = await supabase
    .from("werewolf")
    .select("*")
    .eq("user_telegram_id", userId);
  const playerDb = await supabase
    .from("werewolf")
    .select("*")
    .eq("user_telegram_username", targetUserName);

  const voterKeyUint8Array = bs58.decode(voterDb.data[0].user_wallet_secret);
  const voterKeypair = anchor.web3.Keypair.fromSecretKey(voterKeyUint8Array);

  const playerKeyUint8Array = bs58.decode(playerDb.data[0].user_wallet_secret);
  const playerKeypair = anchor.web3.Keypair.fromSecretKey(playerKeyUint8Array);

  const [voterPlayProof] = wwc.findPlayProofPDA(
    voterKeypair.publicKey,
    gameName
  );

  const voterAcc = await conn.getAccountInfo(voterKeypair.publicKey);

  const [playerPlayProof] = wwc.findPlayProofPDA(
    playerKeypair.publicKey,
    gameName
  );

  const [gameAccountPda] = wwc.findGamePDA(gameName);
  const gameAccount = await wwc.fetchGameAcc(gameAccountPda);

  const [voteProof] = wwc.findVoteProofPDA(
    voterKeypair.publicKey,
    gameAccount.round,
    gameName
  );

  try {
    if (
      !voterAcc ||
      (voterAcc && voterAcc.lamports < 0.005 * LAMPORTS_PER_SOL)
    ) {
      const transferIx = SystemProgram.transfer({
        fromPubkey: wwsKeypair.publicKey,
        toPubkey: voterKeypair.publicKey,
        lamports: 0.01 * LAMPORTS_PER_SOL,
      });

      await wwc.votePlayer(
        voterKeypair,
        voterPlayProof,
        playerKeypair.publicKey,
        playerPlayProof,
        voteProof,
        gameAccountPda,
        [wwsKeypair],
        [transferIx]
      );
    } else {
      await wwc.votePlayer(
        voterKeypair,
        voterPlayProof,
        playerKeypair.publicKey,
        playerPlayProof,
        voteProof,
        gameAccountPda
      );
    }

    const targetChatId = getChatId(gameName) ? getChatId(gameName) : chatId;
    bot.sendMessage(
      targetChatId,
      `Player has voted for [@${playerDb.data[0].user_telegram_username}](tg://user?id=${playerDb.data[0].user_telegram_id}`,
      { parse_mode: "Markdown" }
    );
  } catch (err) {
    bot.sendMessage(
      chatId,
      `Failed to create game, ensure that your wallet has at least 0.01SOL. Please try again. ERROR:${err}`
    );
  } finally {
    delete latestUserGames[userId];
    delete userStates[userId];
  }
};

export const respondAliveVoteOptions = async (
  gameName: string,
  userId: number,
  chatId: number,
  messageId: number
) => {
  const options = await getAliveOptions(gameName, messageId);
  setUserState(userId, States.AWAITING_VOTE_PLAYER_TARGET_NAME);
  setLatestUserGames(userId, gameName);
  bot.sendMessage(chatId, "Choose a target to vote:", options);
};

export const eliminatePlayerTele = async (
  gameName: string,
  userId: number,
  chatId: number
) => {
  const initiatorDb = await supabase
    .from("werewolf")
    .select("*")
    .eq("user_telegram_id", userId);
  const secretKeyUint8Array = bs58.decode(initiatorDb[0].user_wallet_secret);
  const initiatorKeypair =
    anchor.web3.Keypair.fromSecretKey(secretKeyUint8Array);

  const initiatorAcc = await conn.getAccountInfo(initiatorKeypair.publicKey);

  const [gameAccountPda] = wwc.findGamePDA(gameName);

  const { player } = await wwc.fetchMostVotedPlayer(gameAccountPda);
  const [playerProof] = wwc.findPlayProofPDA(player, gameName);

  try {
    if (
      !initiatorAcc ||
      (initiatorAcc && initiatorAcc.lamports < 0.005 * LAMPORTS_PER_SOL)
    ) {
      const transferIx = SystemProgram.transfer({
        fromPubkey: wwsKeypair.publicKey,
        toPubkey: initiatorKeypair.publicKey,
        lamports: 0.01 * LAMPORTS_PER_SOL,
      });

      await wwc.eliminatePlayer(
        initiatorKeypair,
        player,
        playerProof,
        gameAccountPda,
        [wwsKeypair],
        [transferIx]
      );
    } else {
      await wwc.eliminatePlayer(
        initiatorKeypair,
        player,
        playerProof,
        gameAccountPda
      );
    }

    const gameAccount = await wwc.fetchGameAcc(gameAccountPda);

    if (gameAccount.status == 1 << 2) {
      bot.sendMessage(
        chatId,
        `Under the crescent moon, the villagers' unified vote sealed the wolf's fate, bringing peace once more to their once-tormented hamlet. The wolf has been subdued, the villagers have won.`,
        { parse_mode: "Markdown" }
      );

      delete chatGames[chatId];
    } else {
      bot.sendMessage(
        chatId,
        `With an innocent gone, the villagers realized their tragic mistake; the real wolf still lurked, hidden among them, smirking in the shadows.`,
        { parse_mode: "Markdown" }
      );
    }
  } finally {
    delete userStates[userId];
  }
};
