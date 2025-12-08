import MainLayout from "../../components/MainLayout";
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import '../../styles/ADMIN_Feedback.css';
import { VscSearchStop } from "react-icons/vsc";

const Feedback = () => {

  useEffect(() => {document.title = "SPARTA | Event Feedback";},[]);

  const { eventName } = useParams();
  const decodedEvent = decodeURIComponent(eventName);
  const userId = JSON.parse(localStorage.getItem("auth"));

  const [eventDetails, setEventDetails] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);


  // Fetch event details
  useEffect(() => {
    const fetchEventId = async () => {
      try {
        // Fetch all events for institution
        const res = await fetch(`http://localhost:5000/api/events?institution=${encodeURIComponent(userId?.institution)}`);
        const data = await res.json();
        
        if (Array.isArray(data)) {
          // Find the specific event
          const found = data.find(e => e.eventName === decodedEvent);
          if (found) {
            setEventDetails(found);
          }
        }
      } catch (err) {
        console.error("Error fetching event details:", err);
      }
    };

    if (userId?.institution && decodedEvent) {
      fetchEventId();
    }
  }, [userId?.institution, decodedEvent]);
   // Fetch Feedbacks
   useEffect(() => {
    const fetchFeedbacks = async () => {
      // Wait for ID to be found
      if (!eventDetails?._id) return;

      try {
        // Use query param ?eventId=...
        const res = await fetch(`http://localhost:5000/api/feedback?eventId=${eventDetails._id}`);
        const data = await res.json();
        setFeedbacks(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching feedbacks:", err);
      }
    };

    fetchFeedbacks();
  }, [eventDetails]);

  return (
    <MainLayout>

      <div className="feedback-header-row">
        <h3>Feedbacks for {decodedEvent}</h3>
      </div>
      <div className="feedback-maindiv">
        
          {feedbacks.length === 0 ? (
            <div className="no-feedback-message">
              <VscSearchStop size={48}/>
              <p > No feedback yet for {decodedEvent}.</p>
            </div>
          ) : (
            feedbacks.map((fb) => (
              <div className="feedback-item" key={fb._id}>
                <div className="feedback-container">  
                  <div className="feedback-contents">
                    <h5 style={{ fontStyle: "italic", textAlign: "right", margin: 0}}>{new Date(fb.createdAt).toLocaleDateString()}</h5>
                    <p>{fb.message}</p>
                    <h5 style={{ textAlign: "right", marginBottom: "5px" }}> - {fb.playerName || "Anonymous"}</h5>
                  </div>  
                </div>
              </div>
            ))
          )}
        
      </div>
    </MainLayout>
  );
};

export default Feedback;
