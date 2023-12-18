import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";
import { Connection, clusterApiUrl, PublicKey } from "@solana/web3.js";
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
};

export function setUserState(userId: number, state: number) {
  userStates[userId] = {
    state: state,
    timestamp: Date.now(),
  };
}

export function setLatestUserGames(userId: number, gameName: string) {
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
export const supabase = createClient<Database>(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export const conn: Connection = new Connection(clusterApiUrl("devnet"));

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
