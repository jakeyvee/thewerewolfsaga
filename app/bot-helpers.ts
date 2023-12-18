import bs58 from "bs58";
import { bot, conn, supabase, userStates, wwc, wwsKeypair } from "./states";
import { SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { RoleType } from "./game-types";

export const checkExistingUser = async (userId: number, chatId: number) => {
  // Check if the user is already in a process

  const { data, error } = await supabase
    .from("werewolf")
    .select("*")
    .eq("user_telegram_id", userId);

  if (data.length === 0) {
    const userKp = anchor.web3.Keypair.generate();
    const secretKeyBase58 = bs58.encode(userKp.secretKey);

    const { error } = await supabase.from("werewolf").insert({
      user_telegram_id: userId,
      user_wallet_secret: secretKeyBase58,
    });
    bot.sendMessage(
      chatId,
      "It's our first interaction! I have created a Solana wallet for you. Check it out in the private message i sent you."
    );

    bot.sendMessage(userId, `Your public key is: ${userKp.publicKey}`);
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
    bot.sendMessage(chatId, `Game '${gameName}' has started!`);
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
      chatId,
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
