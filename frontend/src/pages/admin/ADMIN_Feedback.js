import MainLayout from "../../components/MainLayout";
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import '../../styles/ADMIN_Feedback.css';
import { VscSearchStop } from "react-icons/vsc";

const Feedback = () => {
  const { eventName } = useParams();
  const decodedEvent = decodeURIComponent(eventName);

  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/feedback/${decodedEvent}`);
        const data = await res.json();
        setFeedbacks(data);
      } catch (err) {
        console.error("Error fetching feedbacks:", err);
      }
    };
    fetchFeedbacks();
  }, [decodedEvent]);

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
