import React from "react";
import { Link, useLocation } from "react-router-dom";
import '../styles/MainLayout.css';

// Only include routes that actually exist and are meaningful for breadcrumbs
const ROUTE_CONFIG = {
  // Admin routes
  "/admin/dashboard": "Dashboard",
  "/admin/approval": "Player Approval",
  "/admin/event": "Events",
  "/admin/event/create": "Create Event",
  "/admin/event/:eventName": "Event Details",
  "/admin/event/:eventName/team": "Teams",
  "/admin/event/:eventName/addteam": "Create Team",
  "/admin/event/:eventName/team/:teamName/players": "Team Players", // This will be overridden
  "/admin/event/:eventName/team/:teamName/pending": "Pending Players", // This will be overridden
  "/admin/event/:eventName/team/:teamName/player/:playerId/profile": "Player Profile", // This will be overridden
  "/admin/event/:eventName/game": "Games",
  "/admin/event/:eventName/addgame": "Create Game",
  "/admin/event/:eventName/game/:game": "Game Bracket",
  "/admin/event/:eventName/liveScores": "Live Scores",
  "/admin/event/:eventName/feedback": "Feedback",
  "/admin/pantheon": "Pantheon",
  "/admin/pantheon/:eventName/ranking": "Rankings", // This will be overridden
  "/admin/pantheon/:eventName/:teamName/players": "Team Players",

  // Player routes
  "/dashboard": "Dashboard",
  "/event": "Events",
  "/event/:eventName": "Event Details",
  "/event/:eventName/team/:teamName/players": "Team Players", // This will be overridden
  "/event/:eventName/game": "Games",
  "/event/:eventName/game/:game": "Game Bracket",
  "/event/:eventName/feedback": "Feedback",
  "/event/:eventName/liveScores": "Live Scores",
  "/pantheon": "Pantheon",
  "/pantheon/:eventName/ranking": "Rankings", // This will be overridden
  "/pantheon/:eventName/:teamName/players": "Team Players",
};

// Simple function to format dynamic parameters
const formatSegment = (segment) => {
  return decodeURIComponent(segment)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const Breadcrumbs = () => {
  const location = useLocation();
  const pathname = location.pathname;

  const generateBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs = [];
    let currentPath = '';

    // Store team name for custom labels
    let currentTeamName = '';
    // Store event name for pantheon rankings
    let pantheonEventName = '';

    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Skip admin/player/spectator prefixes as they don't represent actual pages
      if ((segment === 'admin' || segment === 'player' || segment === 'spectator')) {
        return;
      }

      // Store team name when we encounter it
      if (segments[index - 1] === 'team' && segment !== 'players' && segment !== 'pending' && segment !== 'player') {
        currentTeamName = decodeURIComponent(segment);
      }

      // Store pantheon event name when we encounter it
      if (segments[index - 1] === 'pantheon' && segment !== 'ranking' && segment !== 'players') {
        pantheonEventName = decodeURIComponent(segment);
      }

      // Get label from route config or format the segment
      let label = ROUTE_CONFIG[currentPath];
      
      // Custom handling for team players page - show "COCS Players"
      if (currentPath.endsWith('/players') && currentTeamName && !currentPath.includes('/player/')) {
        label = `${currentTeamName} Players`;
      }
      
      // Custom handling for pending players page - show "Pending Players"
      if (currentPath.endsWith('/pending') && currentTeamName) {
        label = `${currentTeamName} Pending Players`;
      }
      
      // Custom handling for player profile page - show "Player Profile"
      if (currentPath.endsWith('/profile') && currentTeamName) {
        label = `Player Profile`;
        // Also make sure we have the team players breadcrumb before this
        const teamPlayersPath = currentPath.replace(/\/player\/[^/]+\/profile$/, '/players');
        const hasTeamPlayers = breadcrumbs.some(crumb => crumb.path === teamPlayersPath);
        if (!hasTeamPlayers && currentTeamName) {
          breadcrumbs.push({
            path: teamPlayersPath,
            label: `${currentTeamName} Players`
          });
        }
      }
      
      // Store pantheon event name when we encounter it
        if (segments[index - 1] === 'pantheon' && segment !== 'ranking' && segment !== 'players') {
          pantheonEventName = decodeURIComponent(segment);
          return; // Skip the event name segment since it doesn't redirect to any page
        }
      
      if (!label) {
        // For dynamic segments, use formatted version
        label = formatSegment(segment);
        
        // Special cases for better readability
        if (segment === 'addteam') label = 'Create Team';
        if (segment === 'addgame') label = 'Create Game';
        if (segment === 'liveScores') label = 'Live Scores';
      }

      // Skip team name segments that don't have their own page
      const isTeamNameInTeamRoute = 
        segments[index - 1] === 'team' && 
        (segments[index + 1] === 'players' || segments[index + 1] === 'pending' || segments[index + 1] === 'player');
      
      if (isTeamNameInTeamRoute) {
        return; // Skip the team name segment
      }

      // Skip game ID segments - they'll be handled by the route config as "Game Bracket"
      const isGameIdSegment = 
        segments[index - 1] === 'game' && 
        segment !== 'addgame' && 
        (looksLikeId(segment) || ROUTE_CONFIG[currentPath] === "Game Bracket");
      
      if (isGameIdSegment) {
        return; // Skip the game ID segment
      }

      // Skip player ID segments - they don't represent actual pages
      const isPlayerIdSegment = 
        segments[index - 1] === 'player' && 
        segments[index + 1] === 'profile' && 
        looksLikeId(segment);
      
      if (isPlayerIdSegment) {
        return; // Skip the player ID segment
      }

      // Only add to breadcrumbs if we have a meaningful label
      if (label && label.trim() !== '') {
        breadcrumbs.push({
          path: currentPath,
          label: label
        });
      }
    });

    return breadcrumbs;
  };

  // Helper function to check if a string looks like an ID
  const looksLikeId = (str) => {
    return /^[a-f\d]{24}$/i.test(str) || /^\d+$/.test(str) || str.length > 15;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      {breadcrumbs.map((crumb, index) => (
        <span key={crumb.path} className="breadcrumb-item">
          {index === breadcrumbs.length - 1 ? (
            <span className="breadcrumb-current" aria-current="page">
              {crumb.label}
            </span>
          ) : (
            <Link to={crumb.path} className="breadcrumb-link">
              {crumb.label}
            </Link>
          )}
          {index < breadcrumbs.length - 1 && (
            <span className="breadcrumb-separator"> ›</span>
          )}
        </span>
      ))}
    </nav>
  );
};

export default Breadcrumbs;