import MainLayout from "../../components/MainLayout";
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import '../../styles/ADMIN_Feedback.css';

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
        <div className="feedback-container">
          {feedbacks.length === 0 ? (
            <p>No feedback yet for {decodedEvent}.</p>
          ) : (
            feedbacks.map((fb) => (
              <div className="feedback-contents" key={fb._id}>
                <div className="feedback-header-row">
                  <h3>{fb.playerName}</h3>
                  <h5 style={{ fontStyle: "italic" }}>{new Date(fb.createdAt).toLocaleString()}</h5>
                </div>
                <p>{fb.message}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Feedback;
