import MainLayout from "../../components/MainLayout";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Bracket, Seed, SeedItem, SeedTeam } from "react-brackets";
import "../../styles/bracket.css";

const GameBracket = () => {
  const { eventName, game: gameId } = useParams();
  const decodedEvent = decodeURIComponent(eventName);

  const [game, setGame] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [tempScores, setTempScores] = useState([]);

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
    const interval = setInterval(fetchGame, 2000);
    return () => clearInterval(interval);
  }, [gameId]);

  if (!game) {
    return (
      <MainLayout>
        <p>Loading bracket...</p>
      </MainLayout>
    );
  }

  // Compute rounds dynamically every render
  const makeRoundsFromMatches = () => {
    const rounds = [];
    const totalRounds = Math.ceil(Math.log2(game.teams.length));

    for (let r = 1; r <= totalRounds; r++) {
      const prevRoundMatches = game.matches.filter((m) => m.round === r - 1);
      const allPrevFinalized = prevRoundMatches.every((m) => m.finalizeWinner);

      const seeds = game.matches
        .filter((m) => m.round === r)
        .map((m) => ({
          id: m._id,
          date: game.startDate,
          teams: m.teams.map((t) => ({
            name: t?.name || "TBD",
            score: t?.score ?? null,
            winner: m.finalizeWinner && t?.name === m.winner,
          })),
          finalizeWinner: m.finalizeWinner || false,
        }));

      const numSeedsExpected = Math.pow(2, totalRounds - r);
      if (seeds.length === 0) {
        for (let i = 0; i < numSeedsExpected; i++) {
          seeds.push({
            id: `empty-${r}-${i}`,
            date: null,
            teams: [
              { name: "TBD", score: null },
              { name: "TBD", score: null },
            ],
            finalizeWinner: false,
          });
        }
      }

      rounds.push({
        title: `Round ${r}`,
        seeds,
      });
    }

    // Add final champion round if last match has a winner
    const finalMatch = game.matches.find(
      (m) => m.round === totalRounds && m.finalizeWinner
    );
    if (finalMatch && finalMatch.winner) {
      rounds.push({
        title: "Champion",
        seeds: [
          {
            id: "champion",
            date: finalMatch.date,
            teams: [
              { name: finalMatch.winner, score: finalMatch.teams.find(t => t.name === finalMatch.winner)?.score ?? null, winner: true },
            ],
            finalizeWinner: true,
          },
        ],
      });
    }


    return rounds;
  };




  // Live update scores
  const handleTempScoreChange = async (idx, newScore) => {
    setTempScores((prev) => {
      const updated = [...prev];
      updated[idx] = newScore;
      return updated;
    });

    if (!selectedMatch) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/games/${gameId}/matches/${selectedMatch.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            score1: idx === 0 ? newScore : tempScores[0],
            score2: idx === 1 ? newScore : tempScores[1],
          }),
        }
      );
      if (!res.ok) console.error("Failed live update");
    } catch (err) {
      console.error("Error updating live score:", err);
    }
  };

  // Finalize winner
  const saveScores = async () => {
    if (!selectedMatch) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/games/${gameId}/matches/${selectedMatch.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            score1: tempScores[0],
            score2: tempScores[1],
            finalizeWinner: true,
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to finalize match");

      const updatedMatches = game.matches.map((m) => {
        if (m._id === selectedMatch.id) {
          const winner =
            tempScores[0] > tempScores[1]
              ? selectedMatch.teams[0].name
              : tempScores[1] > tempScores[0]
                ? selectedMatch.teams[1].name
                : null;
          return {
            ...m,
            teams: m.teams.map((t, idx) => ({
              ...t,
              score: tempScores[idx],
              winner: t.name === winner, // mark winner per team
            })),
            winner,
            finalizeWinner: true,
          };
        }
        return m;
      });

      setGame({ ...game, matches: updatedMatches });
      setSelectedMatch(null);
    } catch (err) {
      console.error("Error finalizing match:", err);
    }
  };

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
  rounds={makeRoundsFromMatches()}
  renderSeedComponent={(props) => {
    return (
      <Seed
        {...props}
        style={{ fontSize: "14px", cursor: "pointer" }}
        onClick={() => {
          if (props.seed.id !== "champion") {
            setSelectedMatch(props.seed);
            setTempScores(props.seed.teams.map((t) => t.score ?? 0));
          }
        }}
      >
        <SeedItem className="seed-item">
          {props.seed.teams.map((team, idx) => {
            // If this is the champion, show a crown instead of score
            const scoreDisplay =
              props.seed.id === "champion" ? "👑" : 
              selectedMatch?.id === props.seed.id
                ? tempScores[idx]
                : team.score;

            let teamClass = "";
            if (props.seed.finalizeWinner) {
              teamClass = team.winner ? "winner" : "loser";
            }
            if (selectedMatch?.id === props.seed.id) {
              teamClass += " editing";
            }

            return (
              <SeedTeam
                key={idx}
                className={`seed-team ${teamClass}`}
              >
                {team.name}{" "}
                <span className="score-box">{scoreDisplay}</span>
              </SeedTeam>
            );
          })}
        </SeedItem>
      </Seed>
    );
  }}
/>
      </div>

      {selectedMatch && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Update Match Scores</h3>
            {selectedMatch.teams.map((team, idx) => (
              <div key={idx} className="score-input">
                <label>
                  {team.name} Score:
                  <input
                    type="number"
                    value={tempScores[idx]}
                    onChange={(e) =>
                      handleTempScoreChange(idx, Number(e.target.value))
                    }
                  />
                </label>
              </div>
            ))}
            <div className="modal-actions">
              <button type="button" onClick={saveScores}>
                Save
              </button>
              <button type="button" onClick={() => setSelectedMatch(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default GameBracket;
