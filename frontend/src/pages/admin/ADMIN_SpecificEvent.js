import MainLayout from "../../components/MainLayout";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { TiGroupOutline } from "react-icons/ti";
import { LuSwords } from "react-icons/lu";
import '../../styles/ADMIN_SpecificEvents.css';

const SpecificEvent = () => {
    const navigate = useNavigate();
    const { eventName } = useParams();
    const decodedName = decodeURIComponent(eventName);

    const handleGameClick = (event) => {
        navigate(`/admin/event/${encodeURIComponent(decodedName)}/game`);
      };

    const handleTeamClick = (event) => {
        navigate(`/admin/event/${encodeURIComponent(decodedName)}/team`);
      };  

    const [eventColor, setEventColor] = useState("#1A2A49");

    return (
        <MainLayout>
            <h1>{decodedName}</h1>

            <div className="specific-event-container">
                    
                <div className="event-header" >
                    <h2>{decodedName}</h2>
                    {/* <p>Event Name: {eventName}</p> */}
                </div>
                
                <div className="event-details">

                    <div className="organizer-box">
                        <h3>Organizer Details</h3>
                        <p>Name: Organizer Name</p>
                    {/* <p>Organizer: {organizerName}</p> */}
                    </div>
                    <div className="date-box">
                        <h3>Event Date</h3>
                        <p>Start: 2023-10-01</p>
                        <p>End: 2023-10-02</p>
                        {/* <p>Start: {eventStartDate}</p>
                        <p>End: {eventEndDate}</p> */}
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
                </div>
                
            </div>
        
        </MainLayout>
    );
};

export default SpecificEvent;