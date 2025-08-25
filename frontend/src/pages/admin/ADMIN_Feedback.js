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
                  <div className="feedback-contents" >

                      <div className="feedback-playername">
                        <h4>{fb.playerName || "Anonymous"}</h4>
                      </div>

                      <div className="feedback-date">
                        <p style={{ fontStyle: "italic", fontSize: "10px", fontFamily: "Monteserrat, Sans-Serif" }}>{new Date(fb.createdAt).toLocaleString()}</p>
                      </div>

                      <div className="feedback-content">
                        <p>{fb.message}</p>
                      </div>
  
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
