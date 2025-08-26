// Updated bracket.js - Only fixed the connector implementation
import React from "react";
import "../styles/bracket.css";

export const renderSingleElimination = (teams) => {
  if (!Array.isArray(teams) || teams.length === 0) return <p>No teams</p>;

  // Make sure we have power of 2 teams by padding with "BYE"
  let size = 1;
  while (size < teams.length) size *= 2;
  const paddedTeams = [...teams, ...Array(size - teams.length).fill("BYE")];

  const rounds = [];
  let currentRound = paddedTeams;

  while (currentRound.length > 1) {
    const matches = [];
    for (let i = 0; i < currentRound.length; i += 2) {
      matches.push([currentRound[i], currentRound[i + 1]]);
    }
    rounds.push(matches);
    currentRound = Array(matches.length).fill(null); // empty for next round
  }

  return (
    <div className="bracket">
      {rounds.map((matches, roundIdx) => (
        <div key={roundIdx} className="round">
          {matches.map((match, matchIdx) => (
            <div key={matchIdx} className="match">
              <div className="team-box">{match[0]}</div>
              <div className="team-box">{match[1]}</div>
              {roundIdx < rounds.length - 1 && (
                <div className="connector"></div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};