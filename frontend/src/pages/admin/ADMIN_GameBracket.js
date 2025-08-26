import MainLayout from "../../components/MainLayout";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Bracket, Seed, SeedItem, SeedTeam } from "react-brackets";

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

  if (!game) return <MainLayout><p>Loading bracket...</p></MainLayout>;

  // Convert teams into bracket structure for Single Elimination
  const teams = game.teams || [];
  const rounds = [];

  // Round 1 - pair teams
  const firstRoundSeeds = [];
  for (let i = 0; i < teams.length; i += 2) {
    firstRoundSeeds.push({
      id: i,
      date: new Date(game.startDate).toLocaleDateString(),
      teams: [
        { name: teams[i] || "TBD" },
        { name: teams[i + 1] || "TBD" }
      ]
    });
  }

  rounds.push({ title: "Round 1", seeds: firstRoundSeeds });

  // Empty next rounds (just placeholder until winners are decided)
  let roundCount = Math.ceil(Math.log2(teams.length));
  for (let r = 2; r <= roundCount; r++) {
    const emptySeeds = [];
    for (let m = 0; m < Math.ceil(firstRoundSeeds.length / Math.pow(2, r - 1)); m++) {
      emptySeeds.push({
        id: `${r}-${m}`,
        date: "",
        teams: [{ name: "TBD" }, { name: "TBD" }]
      });
    }
    rounds.push({ title: `Round ${r}`, seeds: emptySeeds });
  }

  return (
    <MainLayout>
      <h1>{game.category} {game.gameType} Bracket</h1>
      <p><b>Event:</b> {decodedEvent}</p>
      <p><b>Schedule:</b> {new Date(game.startDate).toLocaleString()} - {new Date(game.endDate).toLocaleString()}</p>
      <p><b>Bracket Type:</b> {game.bracketType}</p>

      <div style={{ overflowX: "auto", marginTop: "20px" }}>
        <Bracket
          rounds={rounds}
          renderSeedComponent={(props) => (
            <Seed {...props}>
              <SeedItem>
                {props.seed.teams.map((team, idx) => (
                  <SeedTeam key={idx}>{team.name}</SeedTeam>
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
