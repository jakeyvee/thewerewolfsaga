import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";
import { Connection, PublicKey } from "@solana/web3.js";
import { WerewolfClient } from "../client/werewolf.client";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import bs58 from "bs58";
import * as wwIdl from "../target/idl/werewolf_saga.json";
import TelegramBot from "node-telegram-bot-api";
require("dotenv").config({ path: "../.env" });
import * as anchor from "@coral-xyz/anchor";

// Replace with the Telegram token from @BotFather
export const token: string = process.env.TELEGRAM_BOT_TOKEN;

// Create a bot that uses 'polling' to fetch new updates
export const bot: TelegramBot = new TelegramBot(token, { polling: true });

export const TIMEOUT = 300000; // 5 minutes in milliseconds

export let userStates = {};
export let latestUserGames = {};
export let chatGames = {};

export const States = {
  AWAITING_CREATE_GAME_NAME: 1,
  AWAITING_JOIN_GAME_NAME: 2,
  AWAITING_START_GAME_NAME: 3,
  AWAITING_GET_ROLE_GAME_NAME: 4,
  AWAITING_KILL_PLAYER_GAME_NAME: 5,
  AWAITING_KILL_PLAYER_TARGET_NAME: 6,
  AWAITING_SEE_PLAYER_GAME_NAME: 7,
  AWAITING_SEE_PLAYER_TARGET_NAME: 8,
  AWAITING_VOTE_PLAYER_GAME_NAME: 9,
  AWAITING_VOTE_PLAYER_TARGET_NAME: 10,
  AWAITING_ELIMINATE_PLAYER_GAME_NAME: 11,
};

export function setUserState(userId: number, state: number) {
  userStates[userId] = {
    state: state,
    timestamp: Date.now(),
  };
}

export function setLatestUserGames(
  userId: number,
  gameName: string
) {
  latestUserGames[userId] = {
    state: gameName,
    timestamp: Date.now(),
  };
}

export function setChatGame(chatId: number, gameName: string) {
  chatGames[chatId] = {
    state: gameName,
    timestamp: Date.now(),
  };
}

export function getChatId(gameName: string) {
  return Object.keys(chatGames).find((key) => chatGames[key].state === gameName);
}

export const supabase = createClient<Database>(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export const conn: Connection = new Connection(
  "https://devnet.helius-rpc.com/?api-key=43c3d0ff-8ecc-4be0-8345-d1a064a0e1b5",
  "processed"
);

const secretKeyUint8Array = bs58.decode(process.env.WWS_KEYPAIR);
export const wwsKeypair =
  anchor.web3.Keypair.fromSecretKey(secretKeyUint8Array);
const PROGRAM_ID = "J3HhUaKjMaC71xyJLGmu31BR5KdE1osVyFmKCngBqAzH";
const programPubKey = new PublicKey(PROGRAM_ID);

export const wwc = new WerewolfClient(
  conn,
  new NodeWallet(wwsKeypair),
  wwIdl as any,
  programPubKey
);
