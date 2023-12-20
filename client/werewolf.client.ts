import * as anchor from "@coral-xyz/anchor";
import { AccountUtils } from "./client/account-utils";
import { WerewolfSaga } from "../target/types/werewolf_saga";
import { BN, Idl, Program, AnchorProvider } from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";
import { isKp, toByteArray } from "./client/types";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";

export class WerewolfClient extends AccountUtils {
  // @ts-ignore
  wallet: anchor.Wallet;
  provider!: anchor.Provider;
  werewolfProgram!: anchor.Program<WerewolfSaga>;

  constructor(
    conn: Connection,
    // @ts-ignore
    wallet: anchor.Wallet,
    idl?: Idl,
    programId?: PublicKey
  ) {
    super(conn);
    this.wallet = wallet;
    this.setProvider();
    this.setWerewolfProgram(idl, programId);
  }

  setProvider() {
    this.provider = new AnchorProvider(
      this.conn,
      this.wallet,
      AnchorProvider.defaultOptions()
    );
    anchor.setProvider(this.provider);
  }

  setWerewolfProgram(idl?: Idl, programId?: PublicKey) {
    //instantiating program depends on the environment
    if (idl && programId) {
      //means running in prod
      this.werewolfProgram = new anchor.Program<WerewolfSaga>(
        idl as any,
        programId,
        this.provider
      );
    } else {
      //means running inside test suite
      // @ts-ignore
      this.werewolfProgram = anchor.workspace
        .WerewolfSaga as Program<WerewolfSaga>;
    }
  }

  // --------------------------------------- find PDA addresses

  findGamePDA(gameName: string) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from(anchor.utils.bytes.utf8.encode(gameName))],
      this.werewolfProgram.programId
    );
  }

  findPlayProofPDA(player: PublicKey, gameName: string) {
    const [gamePDA] = this.findGamePDA(gameName);
    return PublicKey.findProgramAddressSync(
      [player.toBytes(), gamePDA.toBytes()],
      this.werewolfProgram.programId
    );
  }

  findKillProofPDA(round: number, gameName: string) {
    const [gamePDA] = this.findGamePDA(gameName);
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from(anchor.utils.bytes.utf8.encode("kill-seed")),
        gamePDA.toBytes(),
        toByteArray(round),
      ],
      this.werewolfProgram.programId
    );
  }

  findSightProofPDA(round: number, gameName: string) {
    const [gamePDA] = this.findGamePDA(gameName);
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from(anchor.utils.bytes.utf8.encode("sight-seed")),
        gamePDA.toBytes(),
        toByteArray(round),
      ],
      this.werewolfProgram.programId
    );
  }

  findVoteProofPDA(player: PublicKey, round: number, gameName: string) {
    const [gamePDA] = this.findGamePDA(gameName);
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from(anchor.utils.bytes.utf8.encode("vote-seed")),
        player.toBytes(),
        gamePDA.toBytes(),
        toByteArray(round),
      ],
      this.werewolfProgram.programId
    );
  }

  // --------------------------------------- fetch deserialized accounts

  async fetchGameAcc(gamePDA: PublicKey) {
    return this.werewolfProgram.account.game.fetch(gamePDA);
  }

  async fetchPlayProofAcc(playProofPDA: PublicKey) {
    return this.werewolfProgram.account.playProof.fetch(playProofPDA);
  }

  async fetchSightProofAcc(sightProofPDA: PublicKey) {
    return this.werewolfProgram.account.sightProof.fetch(sightProofPDA);
  }

  // --------------------------------------- fetch all deserialized accounts

  booleanToBase58(boolValue: boolean): string {
    const byteArray = new Uint8Array([boolValue ? 1 : 0]);
    return bs58.encode(byteArray);
  }

  async fetchAllAlivePlayProofByGameKey(gamePDA: PublicKey) {
    const filter = [
      {
        memcmp: {
          offset: 8 + 32, //prepend for anchor's discriminator + version
          bytes: gamePDA.toBase58(),
        },
      },
      {
        memcmp: {
          offset: 8 + 32 + 32 + 1, //prepend for anchor's discriminator + version
          bytes: this.booleanToBase58(false),
        },
      },
    ];
    return this.werewolfProgram.account.playProof.all(filter);
  }

  async fetchMostVotedPlayer(gamePDA: PublicKey) {
    const gameAcc = await this.fetchGameAcc(gamePDA);
    const voteCounts = gameAcc.voteCounts;
    const maxIdx = voteCounts.reduce(
      (iMax, x, i, arr) => (x > arr[iMax] ? i : iMax),
      0
    );
    const filter = [
      {
        memcmp: {
          offset: 8 + 32, //prepend for anchor's discriminator + version
          bytes: gamePDA.toBase58(),
        },
      },
      {
        memcmp: {
          offset: 8 + 32 + 32, //prepend for anchor's discriminator + version
          bytes: bs58.encode(new Uint8Array([maxIdx + 1])),
        },
      },
    ];

    const playerProofs = this.werewolfProgram.account.playProof.all(filter);
    const playerProof = playerProofs[0].public;
    const player: PublicKey = playerProof[0].player;
    return {
      player,
    };
  }

  // --------------------------------------- ww ixs

  async createGame(
    organiser: PublicKey | Keypair,
    game: PublicKey,
    gameName: string,
    additionalSigners: Keypair[] = [],
    preIxs: TransactionInstruction[] = []
  ) {
    const signers = [...additionalSigners];
    if (isKp(organiser)) signers.push(<Keypair>organiser);

    const txSig = await this.werewolfProgram.methods
      .createGame(gameName)
      .accounts({
        organiser: isKp(organiser)
          ? (<Keypair>organiser).publicKey
          : (organiser as PublicKey),
        game,
      })
      .preInstructions(preIxs)
      .signers(signers)
      .rpc();

    return { txSig };
  }

  async joinGame(
    player: PublicKey | Keypair,
    playProof: PublicKey,
    game: PublicKey,
    additionalSigners: Keypair[] = [],
    preIxs: TransactionInstruction[] = []
  ) {
    const signers = [...additionalSigners];
    if (isKp(player)) signers.push(<Keypair>player);

    const txSig = await this.werewolfProgram.methods
      .joinGame()
      .accounts({
        player: isKp(player)
          ? (<Keypair>player).publicKey
          : (player as PublicKey),
        playProof,
        game,
      })
      .preInstructions(preIxs)
      .signers(signers)
      .rpc();

    return { txSig };
  }

  async startGame(
    organiser: PublicKey | Keypair,
    game: PublicKey,
    additionalSigners: Keypair[] = [],
    preIxs: TransactionInstruction[] = []
  ) {
    const signers = [...additionalSigners];
    if (isKp(organiser)) signers.push(<Keypair>organiser);

    const txSig = await this.werewolfProgram.methods
      .startGame()
      .accounts({
        organiser: isKp(organiser)
          ? (<Keypair>organiser).publicKey
          : (organiser as PublicKey),
        game,
      })
      .preInstructions(preIxs)
      .signers(signers)
      .rpc();

    return { txSig };
  }

  async fillPlayProof(
    player: PublicKey | Keypair,
    playProof: PublicKey,
    game: PublicKey,
    additionalSigners: Keypair[] = [],
    preIxs: TransactionInstruction[] = []
  ) {
    const signers = [...additionalSigners];
    if (isKp(player)) signers.push(<Keypair>player);

    const txSig = await this.werewolfProgram.methods
      .fillPlayProof()
      .accounts({
        player: isKp(player)
          ? (<Keypair>player).publicKey
          : (player as PublicKey),
        playProof,
        game,
      })
      .preInstructions(preIxs)
      .signers(signers)
      .rpc();

    return { txSig };
  }

  async killPlayer(
    wolf: PublicKey | Keypair,
    wolfProof: PublicKey,
    villager: PublicKey,
    villagerProof: PublicKey,
    killProof: PublicKey,
    game: PublicKey,
    additionalSigners: Keypair[] = [],
    preIxs: TransactionInstruction[] = []
  ) {
    const signers = [...additionalSigners];
    if (isKp(wolf)) signers.push(<Keypair>wolf);

    const txSig = await this.werewolfProgram.methods
      .killPlayer()
      .accounts({
        wolf: isKp(wolf) ? (<Keypair>wolf).publicKey : (wolf as PublicKey),
        wolfProof,
        villager,
        villagerProof,
        killProof,
        game,
      })
      .preInstructions(preIxs)
      .signers(signers)
      .rpc();

    return { txSig };
  }

  async seePlayer(
    seer: PublicKey | Keypair,
    seerProof: PublicKey,
    player: PublicKey,
    playerProof: PublicKey,
    sightProof: PublicKey,
    game: PublicKey,
    additionalSigners: Keypair[] = [],
    preIxs: TransactionInstruction[] = []
  ) {
    const signers = [...additionalSigners];
    if (isKp(seer)) signers.push(<Keypair>seer);

    const txSig = await this.werewolfProgram.methods
      .seePlayer()
      .accounts({
        seer: isKp(seer) ? (<Keypair>seer).publicKey : (seer as PublicKey),
        seerProof,
        player,
        playerProof,
        sightProof,
        game,
      })
      .preInstructions(preIxs)
      .signers(signers)
      .rpc();

    return { txSig };
  }

  async votePlayer(
    voter: PublicKey | Keypair,
    voterProof: PublicKey,
    player: PublicKey,
    playerProof: PublicKey,
    voteProof: PublicKey,
    game: PublicKey,
    additionalSigners: Keypair[] = [],
    preIxs: TransactionInstruction[] = []
  ) {
    const signers = [...additionalSigners];
    if (isKp(voter)) signers.push(<Keypair>voter);

    const txSig = await this.werewolfProgram.methods
      .votePlayer()
      .accounts({
        voter: isKp(voter) ? (<Keypair>voter).publicKey : (voter as PublicKey),
        voterProof,
        player,
        playerProof,
        voteProof,
        game,
      })
      .preInstructions(preIxs)
      .signers(signers)
      .rpc();

    return { txSig };
  }

  async eliminatePlayer(
    initiator: PublicKey | Keypair,
    player: PublicKey,
    playerProof: PublicKey,
    game: PublicKey,
    additionalSigners: Keypair[] = [],
    preIxs: TransactionInstruction[] = []
  ) {
    const signers = [...additionalSigners];
    if (isKp(initiator)) signers.push(<Keypair>initiator);

    const txSig = await this.werewolfProgram.methods
      .eliminatePlayer()
      .accounts({
        initiator: isKp(initiator)
          ? (<Keypair>initiator).publicKey
          : (initiator as PublicKey),
        player,
        playerProof,
        game,
      })
      .preInstructions(preIxs)
      .signers(signers)
      .rpc();

    return { txSig };
  }
}
