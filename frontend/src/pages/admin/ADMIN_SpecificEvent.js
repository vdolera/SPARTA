import MainLayout from "../../components/MainLayout";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { TiGroupOutline } from "react-icons/ti";
import { LuSwords } from "react-icons/lu";
import { MdOutlineScoreboard } from "react-icons/md";
import { MdOutlineFeedback } from "react-icons/md";
import '../../styles/ADMIN_SpecificEvents.css';

const SpecificEvent = () => {
    const navigate = useNavigate();
    const { eventName } = useParams();
    const decodedName = decodeURIComponent(eventName);

    const [event, setEventDetails] = useState(null);

    useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/event?eventName=${encodeURIComponent(decodedName)}`
        );
        const data = await response.json();
        setEventDetails(data);
      } catch (error) {
        console.error("Error fetching event details:", error);
       }
      };
      fetchEventDetails();
    }, [decodedName]);

    const handleGameClick = () => {
        navigate(`/admin/event/${encodeURIComponent(decodedName)}/game`);
      };

    const handleTeamClick = () => {
        navigate(`/admin/event/${encodeURIComponent(decodedName)}/team`);
      };  

    const handleScoreClick = () => {
        navigate(`/admin/event/${encodeURIComponent(decodedName)}/liveScores`);
      };

    const handleFeedbackClick = () => {
        navigate(`/admin/event/${encodeURIComponent(decodedName)}/feedback`);
      };

    return (
        <MainLayout>

            <div className="specific-event-container">
                    
                <div className="event-header" >
                    <h2>{decodedName}</h2>
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

                    <button className="btn-team" onClick={handleTeamClick}>
                      <div className="btn-content">
                        <TiGroupOutline size={48} /> {/* Larger icon */}
                        <span>Team</span>
                      </div>
                    </button>

                    <button className="btn-game" onClick={handleGameClick}>
                      <div className="btn-content">
                        <LuSwords size={48} /> {/* Larger icon */}
                        <span>Game</span>
                      </div>
                    </button>

                    <button className="btn-score" onClick={handleScoreClick}>
                      <div className="btn-content">
                        <MdOutlineScoreboard size={48} /> {/* Larger icon */}
                        <span>Live Score</span>
                      </div>
                    </button>

                    <button className="btn-feedback" onClick={handleFeedbackClick}>
                      <div className="btn-content">
                        <MdOutlineFeedback size={42} /> {/* Larger icon */}
                        <span>Feedback</span>
                      </div>
                    </button>

                </div>
                
            </div>
        
        </MainLayout>
    );
};

export default SpecificEvent;