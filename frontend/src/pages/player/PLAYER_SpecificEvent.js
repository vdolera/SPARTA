import PlayerMainLayout from "../../components/P_MainLayout";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { TiGroupOutline } from "react-icons/ti";
import { LuSwords } from "react-icons/lu";
import { MdOutlineScoreboard } from "react-icons/md";
import { MdOutlineFeedback } from "react-icons/md";
import '../../styles/ADMIN_SpecificEvents.css';

const PlayerSpecificEvent = () => {
    const navigate = useNavigate();
    const { eventName, teamName } = useParams();
    const decodedEvent = decodeURIComponent(eventName);
    const decodedTeam = decodeURIComponent(teamName);

    const [event, setEventDetails] = useState(null);
    const [teams, setTeams] = useState([]);
    const user = JSON.parse(localStorage.getItem('auth'));
    const userInstitution = user?.institution;

    useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/event?eventName=${encodeURIComponent(decodedEvent)}`
        );
        const data = await response.json();
        setEventDetails(data);
      } catch (error) {
        console.error("Error fetching event details:", error);
       }
      };
      fetchEventDetails();
    }, [decodedEvent]);

    useEffect(() => {
      const fetchTeams = async () => {
        try {
          const response = await fetch(
          `http://localhost:5000/api/team?institution=${encodeURIComponent(
            userInstitution
          )}&event=${encodeURIComponent(decodedEvent)}&teamName=${encodeURIComponent(decodedTeam)}`
        );
          const data = await response.json();
          setTeams(data);
        } catch (error) {
          console.error("Error fetching teams:", error);
        }
      };

    if (userInstitution && decodedEvent) {
      fetchTeams();
    }
  }, [userInstitution, decodedEvent, decodedEvent, decodedTeam]);    

    const handleGameClick = (event) => {
        navigate(`/event/${encodeURIComponent(decodedEvent)}/game`);
      };

    const handleSelectTeam = (teamName) => {
        navigate(`/event/${encodeURIComponent(decodedEvent)}/team/${encodeURIComponent(decodedTeam)}/players`);
    };

    const handleScoreClick = (event) => {
        navigate(`/event/${encodeURIComponent(decodedEvent)}/liveScores`);
      };

    const handleFeedbackClick = (event) => {
        navigate(`/event/${encodeURIComponent(decodedEvent)}/feedback`);
      };

    return (
        <PlayerMainLayout>

            <div className="specific-event-container">
                    
                <div className="event-header">
                    <h2>{decodedEvent}</h2>
                </div>
                
                <div className="event-details">

                    <div className="organizer-box">
                        <h3>Organizer Details</h3>
                        <p>Name: {event?.userName}</p>

                    </div>
                    <div className="date-box">
                        <h3>Event Date</h3>
                        <p>Start: {event?.eventStartDate ? new Date(event.eventStartDate).toLocaleDateString() : "Loading..."}</p>
                        <p>End: {event?.eventEndDate ? new Date(event.eventEndDate).toLocaleDateString() : "Loading..."}</p>
                    </div>

                    <div className="location-box">
                        <h3>Event Location</h3>
                        <p>Venue: Event Venue</p>
                        {/* <p>Location: {location}</p> */}
                    </div>
                </div>

                <div className="event-specifics">

                    <button className="btn-team" onClick={() => handleSelectTeam(teams.teamName)}>
                      <div className="btn-content">
                        <TiGroupOutline size={48} />
                        <span>Team</span>
                      </div>
                    </button>

                    <button className="btn-game" onClick={handleGameClick}>
                      <div className="btn-content">
                        <LuSwords size={48} />
                        <span>Game</span>
                      </div>
                    </button>

                    <button className="btn-score" onClick={handleScoreClick}>
                      <div className="btn-content">
                        <MdOutlineScoreboard size={48} />
                        <span>Live Score</span>
                      </div>
                    </button>

                    <button className="btn-feedback" onClick={handleFeedbackClick}>
                      <div className="btn-content">
                        <MdOutlineFeedback size={42} />
                        <span>Feedback</span>
                      </div>
                    </button>

                </div>
                
            </div>
        
        </PlayerMainLayout>
    );
};

export default PlayerSpecificEvent;