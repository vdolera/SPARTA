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

  const [showRulesModal, setShowRulesModal] = useState(false); // Showing of Rules in Modal

  const formatForInput = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const tzOffset = d.getTimezoneOffset() * 60000; // offset in ms
    const localISO = new Date(d - tzOffset).toISOString().slice(0, 16);
    return localISO;
  };
  

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

  const makeRoundsFromMatches = () => {
    if (!game) return [];
    const rounds = [];

    if (game.bracketType === "Single Elimination") {
      const totalRounds = Math.ceil(Math.log2(game.teams.length));
      for (let r = 1; r <= totalRounds; r++) {
        const seeds = game.matches
          .filter((m) => m.round === r)
          .map((m) => ({
            id: m._id,
            date: m.date ? new Date(m.date) : null,
            teams: m.teams.map((t) => ({
              name: t?.name || "TBD",
              score: t?.score ?? null,
              winner: m.finalizeWinner && t?.name === m.winner,
            })),
            finalizeWinner: m.finalizeWinner || false,
          }));
        rounds.push({ title: `Round ${r}`, seeds });
      }

      const finalMatch = game.matches.find(
        (m) => m.round === totalRounds && m.finalizeWinner
      );
      if (finalMatch?.winner) {
        rounds.push({
          title: "Champion",
          seeds: [
            {
              id: "champion",
              date: finalMatch.date,
              teams: [
                {
                  name: finalMatch.winner,
                  score:
                    finalMatch.teams.find((t) => t.name === finalMatch.winner)
                      ?.score ?? null,
                  winner: true,
                },
              ],
              finalizeWinner: true,
            },
          ],
        });
      }
    }

    if (game.bracketType === "Double Elimination") {
      const wbMatches = game.matches.filter((m) => m.bracket === "WB");
      const lbMatches = game.matches.filter((m) => m.bracket === "LB");
      const gfMatches = game.matches.filter((m) => m.bracket === "GF");

      const makeBracketRounds = (matches, skipIncompleteFirstRound = false) => {
        if (!matches.length) return [];
        const maxRound = Math.max(...matches.map((m) => m.round));
        const bracketRounds = [];

        for (let r = 1; r <= maxRound; r++) {
          let seeds = matches
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

          // Skip incomplete first round matches in LB
          if (r === 1 && skipIncompleteFirstRound) {
            seeds = seeds.filter((s) => s.teams.every((t) => t.name !== "TBD"));
          }

          if (seeds.length) bracketRounds.push({ title: `Round ${r}`, seeds });
        }

        return bracketRounds;
      };

      const wbRounds = makeBracketRounds(wbMatches);
      const lbRounds = makeBracketRounds(lbMatches, true); // first LB round only fully known matches

      rounds.push({ title: "WB", rounds: wbRounds });
      rounds.push({ title: "LB", rounds: lbRounds });

      if (gfMatches.length > 0) {
        const grandFinal = gfMatches[0];
        rounds.push({
          title: "Grand Final",
          seeds: [
            {
              id: grandFinal._id,
              date: grandFinal.date || new Date(),
              teams: grandFinal.teams.map((t) => ({
                name: t.name,
                score: t.score ?? null,
                winner: grandFinal.finalizeWinner && t.name === grandFinal.winner,
              })),
              finalizeWinner: grandFinal.finalizeWinner || false,
            },
          ],
        });

        if (grandFinal.finalizeWinner && grandFinal.winner) {
          rounds.push({
            title: "Champion",
            seeds: [
              {
                id: "champion",
                date: grandFinal.date || new Date(),
                teams: [
                  {
                    name: grandFinal.winner,
                    score:
                      grandFinal.teams.find((t) => t.name === grandFinal.winner)
                        ?.score ?? null,
                    winner: true,
                  },
                ],
                finalizeWinner: true,
              },
            ],
          });
        }
      }
    }

    if (game.bracketType === "Round Robin") {
      const rrMatches = game.matches.filter((m) => m.bracket === "RR");
      const maxRound = Math.max(...rrMatches.map((m) => m.round));

      for (let r = 1; r <= maxRound; r++) {
        const seeds = rrMatches
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
        rounds.push({ title: `Round ${r}`, seeds });
      }

      // Only calculate Champion if ALL matches are finalized
      const allMatchesDone = rrMatches.every((m) => m.finalizeWinner);
      if (allMatchesDone) {
        const winCount = {};
        rrMatches.forEach((m) => {
          if (m.finalizeWinner && m.winner) {
            winCount[m.winner] = (winCount[m.winner] || 0) + 1;
          }
        });

        // Find team(s) with max wins
        const maxWins = Math.max(...Object.values(winCount));
        const champions = Object.entries(winCount)
          .filter(([_, wins]) => wins === maxWins)
          .map(([team]) => team);

        // Add Champion column
        rounds.push({
          title: "Champion",
          seeds: champions.map((champ, idx) => ({
            id: `champion-${idx}`,
            date: game.endDate,
            teams: [
              {
                name: champ,
                score: `Wins: ${maxWins}`,
                winner: true,
              },
            ],
            finalizeWinner: true,
          })),
        });
      }
    }

    if (game.bracketType === "Swiss") {
      const swissMatches = game.matches.filter((m) => m.bracket === "Swiss");
      const maxRound = Math.max(...swissMatches.map((m) => m.round));

      for (let r = 1; r <= maxRound; r++) {
        const seeds = swissMatches
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
        rounds.push({ title: `Round ${r}`, seeds });
      }

      // Optional standings
      const allMatchesDone = swissMatches.every((m) => m.finalizeWinner);
      if (allMatchesDone) {
        const winCount = {};
        swissMatches.forEach((m) => {
          if (m.finalizeWinner && m.winner) {
            winCount[m.winner] = (winCount[m.winner] || 0) + 1;
          }
        });

        const sorted = Object.entries(winCount).sort((a, b) => b[1] - a[1]);
        rounds.push({
          title: "Swiss Standings",
          seeds: sorted.map(([team, wins], idx) => ({
            id: `swiss-${idx}`,
            date: game.endDate,
            teams: [
              {
                name: team,
                score: `Wins: ${wins}`,
                winner: idx === 0, // leader marked as winner
              },
            ],
            finalizeWinner: true,
          })),
        });
      }
    }


    return rounds;
  };

  const handleTempScoreChange = async (idx, newScore) => {
    setTempScores((prev) => {
      const updated = [...prev];
      updated[idx] = newScore;
      return updated;
    });

    if (!selectedMatch) return;

    try {
      await fetch(
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
    } catch (err) {
      console.error("Error updating live score:", err);
    }
  };

  const saveScores = async () => {
    if (!selectedMatch) return;

    try {
      await fetch(
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
              winner: t.name === winner,
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

  const renderSeed = (props) => (
    <Seed
      {...props}
      style={{ fontSize: "14px", cursor: props.seed.id === "champion" ? "default" : "pointer" }}
      onClick={() => {
        if (props.seed.id !== "champion") {
          setSelectedMatch({ ...props.seed, type: "scores" });
          setTempScores(props.seed.teams.map((t) => t.score ?? 0));
        }
      }}
    >
      <SeedItem className="seed-item">
        {props.seed.teams.map((team, idx) => (
          <SeedTeam key={idx} className="seed-team">
            {team.name} <span className="score-box">{team.score ?? "-"}</span>
          </SeedTeam>
        ))}

        {/* Hide buttons for Champion column*/}
        {props.seed.id !== "champion" && (
          <div className="match-actions">
            <button
              onClick={(e) => {
                e.stopPropagation();
                const fullMatch = game.matches.find(m => m._id === props.seed.id);
                setSelectedMatch({
                  ...fullMatch,
                  id: fullMatch._id,
                  type: "schedule",
                  date: fullMatch.date ? formatForInput(fullMatch.date) : "",
                  location: fullMatch.location || "",
                });
              }}
            >
              Schedule
            </button>


            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedMatch({ ...props.seed, type: "scores" });
                setTempScores(props.seed.teams.map((t) => t.score ?? 0));
              }}
            >
              Scores
            </button>
          </div>
        )}
      </SeedItem>
    </Seed>
  );


  const roundsData = makeRoundsFromMatches();

  const saveSchedule = async () => {
    if (!selectedMatch) return;
  
    try {
      let formattedDate = null;
      if (selectedMatch.date) {
        formattedDate = new Date(selectedMatch.date); 
      }
  
      const scheduleData = {
        date: formattedDate,
        location: selectedMatch.location || null,
      };
  
      await fetch(
        `http://localhost:5000/api/games/${gameId}/matches/${selectedMatch.id}/schedule`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(scheduleData),
        }
      );
  
      // refresh game after saving
      const res = await fetch(`http://localhost:5000/api/games/${gameId}`);
      const updatedGame = await res.json();
      setGame(updatedGame);
  
      setSelectedMatch(null);
    } catch (err) {
      console.error("Error updating schedule:", err);
      alert("Failed to update schedule. Please try again.");
    }
  };
  


  return (
    <MainLayout>
      <div className="game-bracket-info">
        <h1>{game.category} {game.gameType} Bracket</h1>
        <p><b>Event:</b> {decodedEvent}</p>
        <p><b>Schedule:</b> {new Date(game.startDate).toLocaleString()} - {new Date(game.endDate).toLocaleString()}</p>
        <p><b>Bracket Type:</b> {game.bracketType}</p>

        <div className="rules-section">
          {game.rules ? (
            game.rules.endsWith(".pdf") || game.rules.startsWith("/uploads/") ? (
              <>
                <button onClick={() => setShowRulesModal(true)}>
                  View Rules
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setShowRulesModal(true)}>
                  View Rules
                </button>
              </>
            )
          ) : (
            <p>No rules provided.</p>
          )}
        </div>

      </div>

      {showRulesModal && (
        <div className="modal-overlay">
          <div className="modal rules-modal">
            <h2>Game Rules</h2>

            {game.rules.endsWith(".pdf") || game.rules.startsWith("/uploads/") ? (
              <iframe
                src={game.rules}
                title="Rules PDF"
                width="100%"
                height="500px"
                style={{ border: "none" }}
              />
            ) : (
              <p>{game.rules}</p>
            )}

            <button onClick={() => setShowRulesModal(false)}>Close</button>
          </div>
        </div>
      )}

      <div className="bracket-container">
        {game.bracketType === "Single Elimination" && (
          <div className="single-elim">
            <Bracket rounds={roundsData} renderSeedComponent={renderSeed} /></div>
        )}

        {game.bracketType === "Double Elimination" && (
          <>
            <div className="double-elim">
              <h2>Winner's Bracket</h2>
              <Bracket rounds={roundsData.find(r => r.title === "WB")?.rounds || []} renderSeedComponent={renderSeed} />
            </div>

            <div className="double-elim" style={{ display: "flex", justifyContent: "center", gap: "80px", margin: "40px 0" }}>
              {roundsData.filter(r => r.title === "Grand Final" || r.title === "Champion")
                .map((round, i) => (
                  <div key={i} style={{ textAlign: "center" }}>
                    <h2>{round.title}</h2>
                    <Bracket rounds={round.seeds ? [round] : round.rounds} renderSeedComponent={renderSeed} />
                  </div>
                ))}
            </div>

            <div className="double-elim">
              <h2>Loser's Bracket</h2>
              <Bracket rounds={roundsData.find(r => r.title === "LB")?.rounds || []} renderSeedComponent={renderSeed} />
            </div>
          </>
        )}

        {game.bracketType === "Round Robin" && (
          <div className="round-robin bracket-container">
            <h2>Round Robin</h2>
            {roundsData.map((round, rIndex) => (
              <div key={rIndex} className="rr-round">
                <h3 className="rr-title">{round.title}</h3>
                <div className="rr-matches">
                  {round.seeds.map((seed, sIndex) => (
                    <React.Fragment key={sIndex}>
                      {renderSeed({ seed })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {game.bracketType === "Swiss" && (
          <div className="swiss bracket-container">
            <h2>Swiss Bracket</h2>
            {roundsData.map((round, rIndex) => (
              <div key={rIndex} className="swiss-round">
                <h3 className="swiss-title">{round.title}</h3>
                <div className="swiss-matches">
                  {round.seeds.map((seed, sIndex) => (
                    <React.Fragment key={sIndex}>
                      {renderSeed({ seed })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedMatch && (
        <div className="modal-overlay">
          <div className="modal">
            {selectedMatch.type === "rules" ? (
              <>
                <h3>Rules PDF</h3>
                <iframe
                  src={`http://localhost:5000${game.rules}`}
                  title="Rules PDF"
                  className="w-full h-[80vh] rounded-md"
                />
                <div className="modal-actions">
                  <button type="button" onClick={() => setSelectedMatch(null)}>Close</button>
                </div>
              </>
            ) : selectedMatch.type === "schedule" ? (
              <>
                <h3>Schedule Match</h3>
                <label>Date:</label>
                <input
  type="datetime-local"
  value={selectedMatch.date || ""}
  onChange={(e) => setSelectedMatch({ ...selectedMatch, date: e.target.value })}
/>


                <label>Location:</label>
                <input
                  type="text"
                  value={selectedMatch.location || ""}
                  onChange={(e) => setSelectedMatch({ ...selectedMatch, location: e.target.value })}
                />

                <div className="modal-actions">
                  <button type="button" onClick={saveSchedule}>
                    Save Schedule
                  </button>

                  <button type="button" onClick={() => setSelectedMatch(null)}>Cancel</button>
                </div>
              </>
            ) : selectedMatch.type === "scores" ? (   // explicitly check
              <>
                <h3>Update Match Scores</h3>
                {selectedMatch.teams.map((team, idx) => (
                  <div key={idx} className="score-input">
                    <label>
                      {team.name} Score:
                      <input
                        type="number"
                        value={tempScores[idx]}
                        onChange={(e) => handleTempScoreChange(idx, Number(e.target.value))}
                      />
                    </label>
                  </div>
                ))}
                <div className="modal-actions">
                  <button type="button" onClick={saveScores}>Save</button>
                  <button type="button" onClick={() => setSelectedMatch(null)}>Close</button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

    </MainLayout>
  );
};

export default GameBracket;
