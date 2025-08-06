import MainLayout from "../../components/MainLayout";

const SpecificEvent = () => {
    return (
        <MainLayout>
            <h1>Specific Event</h1>

            <div className="specific-event-container">
                <div className="event-details">
                    <p>Event Name: {eventName}</p>
                    <p>Organizer: {organizerName}</p>
                    <p>Date: {eventDate}</p>
                    <p>Location: {eventLocation}</p>
                </div>
            </div>
        
        </MainLayout>
    );
};

export default SpecificEvent;