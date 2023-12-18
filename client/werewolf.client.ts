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

  findKillProofPDA(round: number) {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from(anchor.utils.bytes.utf8.encode("kill-seed")),
        toByteArray(round),
      ],
      this.werewolfProgram.programId
    );
  }

  findSightProofPDA(round: number) {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from(anchor.utils.bytes.utf8.encode("sight-seed")),
        toByteArray(round),
      ],
      this.werewolfProgram.programId
    );
  }

  findVoteProofPDA(player: PublicKey, round: number) {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from(anchor.utils.bytes.utf8.encode("vote-seed")),
        player.toBytes(),
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
    game: PublicKey
  ) {
    const signers = [];
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
    game: PublicKey
  ) {
    const signers = [];
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
    game: PublicKey
  ) {
    const signers = [];
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
      .signers(signers)
      .rpc();

    return { txSig };
  }

  async eliminatePlayer(
    initiator: PublicKey | Keypair,
    player: PublicKey,
    playerProof: PublicKey,
    game: PublicKey
  ) {
    const signers = [];
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
      .signers(signers)
      .rpc();

    return { txSig };
  }
}
