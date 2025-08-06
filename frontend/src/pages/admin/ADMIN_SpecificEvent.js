import MainLayout from "../../components/MainLayout";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import '../../styles/ADMIN_SpecificEvents.css';

const SpecificEvent = () => {
    return (
        <MainLayout>
            <h1>Specific Event</h1>

            <div className="specific-event-container">
                    
                <div className="event-header">
                    <h2>Event Name</h2>
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
            </div>
        
        </MainLayout>
    );
};

export default SpecificEvent;