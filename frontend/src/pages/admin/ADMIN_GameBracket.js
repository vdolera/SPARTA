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
      <div style={{ textAlign: "center", marginTop: "50px" }}> 
        <p>Loading bracket...</p>
      </div> 
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

          // Keep LB Round 1 even if it's empty — only skip rendering if there are truly no matches
          if (skipIncompleteFirstRound && r === 1) {
            // If the round has zero matches, skip rendering it entirely
            if (seeds.length === 0) continue;
          }


          if (seeds.length) bracketRounds.push({ title: `Round ${r}`, seeds });
        }

        return bracketRounds;
      };

      const wbRounds = makeBracketRounds(wbMatches);

      // Get raw LB rounds
      const rawLBRounds = makeBracketRounds(lbMatches, false);

      // Renumber LB rounds so they're sequential (start at 1)
      const lbRounds = rawLBRounds.map((round, idx) => ({
        ...round,
        title: `Round ${idx + 1}`,
      }));

      rounds.push({ title: "WB", rounds: wbRounds });
      rounds.push({ title: "LB", rounds: lbRounds });


      // ✅ Only show Grand Final when both WB Final & LB Final are decided
      if (gfMatches.length > 0) {
        const gf = gfMatches[0];

        const wbFinalDone = game.matches.some(
          (m) => m.bracket === "WB" && m.finalizeWinner && m.round === Math.max(...wbRounds.map(r => parseInt(r.title.split(" ")[1])))
        );

        const lbFinalDone = game.matches.some(
          (m) => m.bracket === "LB" && m.finalizeWinner && m.round === Math.max(...lbRounds.map(r => parseInt(r.title.split(" ")[1])))
        );

        // ✅ Render GF only when WB and LB are both done
        if (wbFinalDone && lbFinalDone) {
          rounds.push({
            title: "Grand Final",
            seeds: [
              {
                id: gf._id,
                date: gf.date || new Date(),
                teams: gf.teams.map((t) => ({
                  name: t.name,
                  score: t.score ?? null,
                  winner: gf.finalizeWinner && t.name === gf.winner,
                })),
                finalizeWinner: gf.finalizeWinner || false,
              },
            ],
          });

          // ✅ Show Champion only AFTER GF is finalized
          if (gf.finalizeWinner && gf.winner) {
            rounds.push({
              title: "Champion",
              seeds: [
                {
                  id: "champion",
                  date: gf.date || new Date(),
                  teams: [
                    {
                      name: gf.winner,
                      score:
                        gf.teams.find((t) => t.name === gf.winner)?.score ?? null,
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

  const roundsData = makeRoundsFromMatches();

  return (
    <MainLayout>
      <div className="game-bracket-info">
        <h1>{game.category} {game.gameType} Bracket</h1>
        <p><b>Event:</b> {decodedEvent}</p>
        <p><b>Schedule:</b> {new Date(game.startDate).toLocaleString()} - {new Date(game.endDate).toLocaleString()}</p>
        <p><b>Bracket Type:</b> {game.bracketType}</p>
        {game.videoLink && (
          <p>
            <a href={game.videoLink} target="_blank" rel="noopener noreferrer">
              Watch Video
            </a>
          </p>
        )}

        <div style={{ display: "flex", flexDirection: "row", gap: "5px", flexWrap: "wrap", alignItems: "center", justifyContent: "center", width: "100%", margin: "0 auto" }}>
          <div className="rules-section">
            {game.rules ? (
              <button onClick={() => setShowRulesModal(true)}>View Rules</button>
            ) : (
              <p>No rules provided.</p>
            )}
          </div>


          <div className="video-section">
            <button
              onClick={() =>
                setSelectedMatch({
                  type: "video",
                  videoLink: game.videoLink || "",
                })
              }
            >
              Add Video Link
            </button>
          </div>
        </div>
      </div>
      {showRulesModal && (
        <div className="modal-overlay">
          <div className="modal rules-modal">
            <h2>Game Rules</h2>

            {game.rules.endsWith(".pdf") ? (
              <iframe
                src={game.rules}
                title="Rules PDF"
                width="100%"
                height="500px"
                style={{ border: "none" }}
              />
            ) : (
              <p style={{ whiteSpace: "pre-wrap" }}>{game.rules}</p>
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
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <h3>Schedule Match</h3>
                  <div style={{ display: "flex", flexDirection: "row", gap: "30px" }}>
                    <label>Date : </label>
                    <input
                      type="datetime-local"
                      style={{ width: "150px" }}
                      value={selectedMatch.date || ""}
                      onChange={(e) => setSelectedMatch({ ...selectedMatch, date: e.target.value })}
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "row", gap: "5px" }}>
                    <label>Location : </label>
                    <input
                      type="text"
                      style={{ width: "150px" }}
                      value={selectedMatch.location || ""}
                      onChange={(e) => setSelectedMatch({ ...selectedMatch, location: e.target.value })}
                    />
                  </div>

                  <div className="modal-actions">
                    <button type="button" onClick={saveSchedule}>
                      Save Schedule
                    </button>

                    <button type="button" onClick={() => setSelectedMatch(null)}>Cancel</button>
                  </div>
                </div>
              </>
            ) : selectedMatch.type === "scores" ? (
              <>
                <h3>Update Match Scores</h3>
                {selectedMatch.teams.map((team, idx) => (
                  <div key={idx} className="score-input">
                    <label style={{ marginLeft: "10px" }}>
                      {team.name} Score:
                    </label>

                    <input
                      type="number"
                      style={{ width: "50px", marginRight: "10px" }}
                      value={tempScores[idx]}
                      onChange={(e) => handleTempScoreChange(idx, Number(e.target.value))}
                    />

                  </div>
                ))}
                <div className="modal-actions">
                  <button type="button" onClick={saveScores}>Save</button>
                  <button type="button" onClick={() => setSelectedMatch(null)}>Close</button>
                </div>
              </>
            ) : selectedMatch.type === "video" && (
              <>
                <h3>Add Video Link</h3>
                <input
                  type="text"
                  placeholder="Enter video URL"
                  value={selectedMatch.videoLink || ""}
                  onChange={(e) =>
                    setSelectedMatch({ ...selectedMatch, videoLink: e.target.value })
                  }
                />
                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await fetch(`http://localhost:5000/api/${gameId}/video`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ videoLink: selectedMatch.videoLink }),
                        });

                        // Refresh game after saving
                        const res = await fetch(`http://localhost:5000/api/games/${gameId}`);
                        const updated = await res.json();
                        setGame(updated);

                        setSelectedMatch(null);
                      } catch (err) {
                        console.error("Error saving video link:", err);
                        alert("Failed to save video link.");
                      }
                    }}
                  >
                    Save
                  </button>
                  <button onClick={() => setSelectedMatch(null)}>Cancel</button>
                </div>
              </>
            )
            }
          </div>
        </div>
      )}

    </MainLayout>
  );
};

export default GameBracket;
