import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { WerewolfSaga } from "../target/types/werewolf_saga";
import { PublicKey } from "@solana/web3.js";
import { assert } from "chai";
import { WerewolfClient } from "../client/werewolf.client";
import * as wwIdl from "../target/idl/werewolf_saga.json";

describe("werewolf_saga", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.WerewolfSaga as Program<WerewolfSaga>;

  let organiser = anchor.web3.Keypair.generate();
  let playerVillager1 = anchor.web3.Keypair.generate();
  let playerVillager2 = anchor.web3.Keypair.generate();
  let playerSeer = anchor.web3.Keypair.generate();
  let playerWolf = anchor.web3.Keypair.generate();
  let gameName = "abc";
  let gameAccountPda: PublicKey;
  let playProofVillager1Pda: PublicKey;
  let playProofVillager2Pda: PublicKey;
  let playProofSeerPda: PublicKey;
  let playProofWolfPda: PublicKey;

  let voteCounts: number[];

  const wwc = new WerewolfClient(
    provider.connection,
    provider.wallet as any,
    wwIdl as any,
    program.programId
  );

  it("Airdrops to organiser", async () => {
    // airdrop to organiser
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(organiser.publicKey, 1000000000),
      "confirmed"
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        playerVillager1.publicKey,
        1000000000
      ),
      "confirmed"
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        playerVillager2.publicKey,
        1000000000
      ),
      "confirmed"
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        playerSeer.publicKey,
        1000000000
      ),
      "confirmed"
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        playerWolf.publicKey,
        1000000000
      ),
      "confirmed"
    );
  });

  it("create game", async () => {
    const unixSecNow = (Date.now() / 1000) | 0;
    await pause(1000); //to create a difference in timestamps we're testing below
    const [_gameAccountPda] = wwc.findGamePDA(gameName);

    gameAccountPda = _gameAccountPda;

    // Add your test here.
    const { txSig } = await wwc.createGame(organiser, gameAccountPda, gameName);

    const gameAcc = await wwc.fetchGameAcc(gameAccountPda);
    await pause(1000); //to create a difference in timestamps we're testing below
    const unixSecThen = (Date.now() / 1000) | 0;

    voteCounts = new Array(255).fill(0);

    assert.ok(JSON.stringify(voteCounts) == JSON.stringify(gameAcc.voteCounts));
    assert.ok(gameAcc.totalPlayers == 0);
    assert.ok(gameAcc.deadPlayers == 0);
    assert.ok(gameAcc.turn == 0);
    assert.ok(gameAcc.round == 0);
    assert.ok(gameAcc.status == 1 << 0);
    assert.ok(gameAcc.period == 1 << 0);
    assert.ok(
      gameAcc.createdAt.toNumber() <= unixSecThen &&
        gameAcc.createdAt.toNumber() >= unixSecNow
    );
  });

  it("join game", async () => {
    const [_playProofVillager1Pda] = wwc.findPlayProofPDA(
      playerVillager1.publicKey,
      gameName
    );
    const [_playProofVillager2Pda] = wwc.findPlayProofPDA(
      playerVillager2.publicKey,
      gameName
    );
    const [_playProofSeerPda] = wwc.findPlayProofPDA(
      playerSeer.publicKey,
      gameName
    );
    const [_playProofWolfPda] = wwc.findPlayProofPDA(
      playerWolf.publicKey,
      gameName
    );

    playProofVillager1Pda = _playProofVillager1Pda;
    playProofVillager2Pda = _playProofVillager2Pda;
    playProofSeerPda = _playProofSeerPda;
    playProofWolfPda = _playProofWolfPda;

    await wwc.joinGame(
      playerVillager1,
      playProofVillager1Pda,
      gameAccountPda
    );

    const playProofVillager1Acc = await wwc.fetchPlayProofAcc(
      playProofVillager1Pda
    );

    const gameAccNow = await wwc.fetchGameAcc(gameAccountPda);

    assert.ok(playProofVillager1Acc.pos == 1);
    assert.ok(playProofVillager1Acc.dead == false);
    assert.equal(
      playProofVillager1Acc.player.toBase58(),
      playerVillager1.publicKey.toBase58()
    );

    assert.ok(gameAccNow.totalPlayers == 1);

    await wwc.joinGame(
      playerVillager2,
      playProofVillager2Pda,
      gameAccountPda
    );

    await wwc.joinGame(
      playerSeer,
      playProofSeerPda,
      gameAccountPda
    );

    await wwc.joinGame(
      playerWolf,
      playProofWolfPda,
      gameAccountPda
    );

    const gameAccThen = await wwc.fetchGameAcc(gameAccountPda);

    assert.ok(gameAccThen.totalPlayers == 4);
  });

  it("start game", async () => {
    // Add your test here.
    const { txSig } = await wwc.startGame(organiser, gameAccountPda);

    const gameAcc = await wwc.fetchGameAcc(gameAccountPda);

    assert.ok(gameAcc.round == 1);
    assert.ok(gameAcc.status == 1 << 1);
    assert.ok(gameAcc.period == 1 << 1);
  });

  it("fill play proof", async () => {
    // Add your test here.
    await wwc.fillPlayProof(
      playerVillager1,
      playProofVillager1Pda,
      gameAccountPda
    );
    await wwc.fillPlayProof(
      playerVillager2,
      playProofVillager2Pda,
      gameAccountPda
    );
    await wwc.fillPlayProof(playerSeer, playProofSeerPda, gameAccountPda);
    await wwc.fillPlayProof(playerWolf, playProofWolfPda, gameAccountPda);

    const playProofVillager1Acc = await wwc.fetchPlayProofAcc(
      playProofVillager1Pda
    );
    const playProofVillager2Acc = await wwc.fetchPlayProofAcc(
      playProofVillager2Pda
    );
    const playProofSeerAcc = await wwc.fetchPlayProofAcc(playProofSeerPda);
    const playProofWolfAcc = await wwc.fetchPlayProofAcc(playProofWolfPda);

    assert.ok(playProofVillager1Acc.role == 1 << 1);
    assert.ok(playProofVillager2Acc.role == 1 << 1);
    assert.ok(playProofSeerAcc.role == 1 << 2);
    assert.ok(playProofWolfAcc.role == 1 << 3);
  });

  it("kill player", async () => {
    const gameAccNow = await wwc.fetchGameAcc(gameAccountPda);
    const [killProof] = wwc.findKillProofPDA(gameAccNow.round);
    // Add your test here.
    const { txSig } = await wwc.killPlayer(
      playerWolf,
      playProofWolfPda,
      playerVillager1.publicKey,
      playProofVillager1Pda,
      killProof,
      gameAccountPda
    );
    const gameAccThen = await wwc.fetchGameAcc(gameAccountPda);

    const playProofVillager1Acc = await wwc.fetchPlayProofAcc(
      playProofVillager1Pda
    );

    assert.ok(playProofVillager1Acc.dead == true);
    assert.ok(gameAccThen.period == 1 << 0);
    assert.ok(gameAccThen.turn == 0);
    assert.ok(gameAccThen.deadPlayers == 1);
  });

  it("see player", async () => {
    const gameAccNow = await wwc.fetchGameAcc(gameAccountPda);
    const [sightProof] = wwc.findSightProofPDA(gameAccNow.round);
    // Add your test here.
    const { txSig } = await wwc.seePlayer(
      playerSeer,
      playProofSeerPda,
      playerWolf.publicKey,
      playProofWolfPda,
      sightProof,
      gameAccountPda
    );
    const sightProofAcc = await wwc.fetchSightProofAcc(sightProof);

    assert.equal(
      sightProofAcc.player.toBase58(),
      playerWolf.publicKey.toBase58()
    );
    assert.equal(
      sightProofAcc.playProof.toBase58(),
      playProofWolfPda.toBase58()
    );
    assert.ok(sightProofAcc.role == 1 << 3);
  });

  it("vote player", async () => {
    const gameAccNow = await wwc.fetchGameAcc(gameAccountPda);
    const [voteProofVillager2] = wwc.findVoteProofPDA(
      playerVillager2.publicKey,
      gameAccNow.round
    );
    const [voteProofSeer] = wwc.findVoteProofPDA(
      playerSeer.publicKey,
      gameAccNow.round
    );
    const [voteProofWolf] = wwc.findVoteProofPDA(
      playerWolf.publicKey,
      gameAccNow.round
    );

    await wwc.votePlayer(
      playerVillager2,
      playProofVillager2Pda,
      playerSeer.publicKey,
      playProofSeerPda,
      voteProofVillager2,
      gameAccountPda
    );

    voteCounts[2] += 1;

    await wwc.votePlayer(
      playerSeer,
      playProofSeerPda,
      playerWolf.publicKey,
      playProofWolfPda,
      voteProofSeer,
      gameAccountPda
    );

    voteCounts[3] += 1;

    await wwc.votePlayer(
      playerWolf,
      playProofWolfPda,
      playerSeer.publicKey,
      playProofSeerPda,
      voteProofWolf,
      gameAccountPda
    );

    voteCounts[2] += 1;
    const gameAccThen = await wwc.fetchGameAcc(gameAccountPda);

    assert.ok(
      JSON.stringify(voteCounts) == JSON.stringify(gameAccThen.voteCounts)
    );
    assert.ok(gameAccThen.turn == 3);
  });

  it("eliminate player", async () => {
    await wwc.eliminatePlayer(
      playerSeer,
      playerSeer.publicKey,
      playProofSeerPda,
      gameAccountPda
    );

    const playProofSeerAcc = await wwc.fetchPlayProofAcc(playProofSeerPda);
    const gameAccThen = await wwc.fetchGameAcc(gameAccountPda);
    voteCounts = new Array(255).fill(0);

    assert.ok(playProofSeerAcc.dead == true);
    assert.ok(gameAccThen.deadPlayers == 2);
    assert.ok(gameAccThen.period == 1 << 1);
    assert.ok(gameAccThen.round == 2);
    assert.ok(gameAccThen.turn == 0);
    assert.ok(
      JSON.stringify(voteCounts) == JSON.stringify(gameAccThen.voteCounts)
    );


  });
});

async function pause(ms: number) {
  await new Promise((response) =>
    setTimeout(() => {
      response(0);
    }, ms)
  );
}
