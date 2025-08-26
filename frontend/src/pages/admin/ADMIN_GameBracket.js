import MainLayout from "../../components/MainLayout";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Bracket, Seed, SeedItem, SeedTeam } from "react-brackets";
import '../../styles/bracket.css';

const GameBracket = () => {
  const { eventName, game: gameId } = useParams();
  const decodedEvent = decodeURIComponent(eventName);

  const [game, setGame] = useState(null);

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/games/${gameId}`);
        const data = await res.json();
        setGame(data);
      } catch (err) {
        console.error("Error fetching game:", err);
      }
    };
    fetchGame();
  }, [gameId]);

  if (!game) {
    return (
      <MainLayout>
        <p>Loading bracket...</p>
      </MainLayout>
    );
  }

  const teams = game.teams || [];

  // Helper: chunk teams into matchups
  const makeSeeds = (teamList, roundIndex) => {
    const seeds = [];
    for (let i = 0; i < teamList.length; i += 2) {
      seeds.push({
        id: `${roundIndex}-${i}`,
        date: roundIndex === 1 ? new Date(game.startDate).toLocaleDateString() : "",
        teams: [
          { name: teamList[i] || "TBD" },
          { name: teamList[i + 1] || "TBD" }
        ]
      });
    }
    return seeds;
  };

  // Round 1 = actual teams
  const rounds = [];
  const round1 = makeSeeds(teams, 1);
  rounds.push({ title: "Round 1", seeds: round1 });

  // Figure out how many rounds we need until a single winner
  const totalRounds = Math.ceil(Math.log2(teams.length));

  // Subsequent rounds: placeholders only
  let prevMatchCount = round1.length;
  for (let r = 2; r <= totalRounds; r++) {
    const seeds = [];
    for (let m = 0; m < Math.ceil(prevMatchCount / 2); m++) {
      seeds.push({
        id: `${r}-${m}`,
        date: "",
        teams: [{ name: "TBD" }, { name: "TBD" }]
      });
    }
    rounds.push({ title: `Round ${r}`, seeds });
    prevMatchCount = seeds.length;
  }

  return (
    <MainLayout>
      <h1>
        {game.category} {game.gameType} Bracket
      </h1>
      <p>
        <b>Event:</b> {decodedEvent}
      </p>
      <p>
        <b>Schedule:</b>{" "}
        {new Date(game.startDate).toLocaleString()} -{" "}
        {new Date(game.endDate).toLocaleString()}
      </p>
      <p>
        <b>Bracket Type:</b> {game.bracketType}
      </p>

      <div className="bracket-container">
        <Bracket
          rounds={rounds}
          renderSeedComponent={(props) => (
            <Seed {...props} style={{ fontSize: "14px" }}>
              <SeedItem className="seed-item">
                {props.seed.teams.map((team, idx) => (
                  <SeedTeam key={idx} className="seed-team">{team.name} </SeedTeam>
                ))}
              </SeedItem>
            </Seed>
          )}
        />
      </div>
    </MainLayout>
  );
};

export default GameBracket;
