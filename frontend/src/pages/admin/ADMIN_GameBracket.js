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
  const [scores, setScores] = useState({});

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

  const makeRoundsFromMatches = () => {
    const rounds = [];
    const totalRounds = Math.ceil(Math.log2(game.teams.length));

    for (let r = 1; r <= totalRounds; r++) {
      const seeds = game.matches
        .filter((m) => m.round === r)
        .map((m) => ({
          id: m._id,
          date: game.startDate,
          teams: m.teams.map((t) => ({
            name: t?.name || "TBD",
            score: t?.score ?? null,
          })),
        }));

      rounds.push({
        title: `Round ${r}`,
        seeds,
      });
    }

    // Add final champion as its own round if we have a winner
    const finalMatch = game.matches.find((m) => m.round === totalRounds);
    if (finalMatch && finalMatch.teams.length === 2) {
      const [t1, t2] = finalMatch.teams;
      if (t1.score !== null && t2.score !== null && t1.score !== t2.score) {
        const winner = t1.score > t2.score ? t1 : t2;
        rounds.push({
          title: "🏆 Champion",
          seeds: [
            {
              id: "champion",
              date: game.endDate,
              teams: [{ name: winner.name, score: null }],
            },
          ],
        });
      }
    }

    return rounds;
  };

  const rounds = makeRoundsFromMatches();

  const handleSubmitScores = async (e) => {
    e.preventDefault();
    const matchId = selectedMatch.id;

    const s1 = parseInt(
      scores[`${matchId}_0`] ?? selectedMatch.teams[0].score ?? 0,
      10
    );
    const s2 = parseInt(
      scores[`${matchId}_1`] ?? selectedMatch.teams[1].score ?? 0,
      10
    );

    try {
      const res = await fetch(
        `http://localhost:5000/api/games/${gameId}/matches/${matchId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ score1: s1, score2: s2 }),
        }
      );
      const data = await res.json();

      if (res.ok) {
        setGame(data);
        setScores({});
      } else {
        alert("Failed to update scores");
      }
    } catch (err) {
      console.error("Error saving scores:", err);
    }

    setSelectedMatch(null);
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
          rounds={rounds}
          renderSeedComponent={(props) => {
            const [t1, t2] = props.seed.teams;
            let winnerIdx = null;
            if (
              t1?.score !== null &&
              t2?.score !== null &&
              t1?.score !== t2?.score
            ) {
              winnerIdx = t1.score > t2.score ? 0 : 1;
            }

            return (
              <Seed
                {...props}
                style={{ fontSize: "14px", cursor: "pointer" }}
                onClick={() =>
                  props.seed.id !== "champion" && setSelectedMatch(props.seed)
                }
              >
                <SeedItem className="seed-item">
                  {props.seed.teams.map((team, idx) => (
                  <SeedTeam
                  key={idx}
                  className={`seed-team ${
                    winnerIdx === idx
                      ? "winner"
                      : winnerIdx !== null && team.name !== "TBD"
                      ? "loser"
                      : ""
                  }`}
                >
                  {team.name}
                  {team.score !== null && (
                    <span className="score-box">{team.score}</span>
                  )}
                </SeedTeam>
                
                  ))}
                </SeedItem>
              </Seed>
            );
          }}
        />
      </div>

      {/* Modal for score editing */}
      {selectedMatch && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Update Match Scores</h3>
            <form onSubmit={handleSubmitScores}>
              {selectedMatch.teams.map((team, idx) => (
                <div key={idx} className="score-input">
                  <label>
                    {team.name} Score:
                    <input
                      type="number"
                      value={
                        scores[`${selectedMatch.id}_${idx}`] ??
                        team.score ??
                        ""
                      }
                      onChange={(e) =>
                        setScores({
                          ...scores,
                          [`${selectedMatch.id}_${idx}`]:
                            e.target.value === ""
                              ? ""
                              : Number(e.target.value),
                        })
                      }
                      required
                    />
                  </label>
                </div>
              ))}

              <div className="modal-actions">
                <button type="submit">Save Scores</button>
                <button
                  type="button"
                  onClick={() => setSelectedMatch(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default GameBracket;
