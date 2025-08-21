import MainLayout from "../../components/MainLayout";
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import '../../styles/ADMIN_Feedback.css';

const PlayerFeedback = () => {
  const { eventName } = useParams();
  const decodedEvent = decodeURIComponent(eventName);

  const user = JSON.parse(localStorage.getItem("auth"));
  const [showOverlay, setShowOverlay] = useState(false);
  const [feedback, setFeedback] = useState("");
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

  const handlePost = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventName: decodedEvent,
          institution: user.institution,
          userId: user._id,
          playerName: user.playerName,
          message: feedback,
        }),
      });

      if (res.ok) {
        const newFb = await res.json();
        setFeedbacks([newFb.feedback, ...feedbacks]);
        setFeedback("");
        setShowOverlay(false);
      } else {
        alert("Failed to post feedback");
      }
    } catch (err) {
      console.error("Error posting feedback:", err);
    }
  };

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
        <button onClick={() => setShowOverlay(true)}>Post Feedback</button>
      </div>

      {showOverlay && (
        <div className="feedback-overlay">
          <div className="feedback-modal">
            <h2>Post Feedback for {decodedEvent}</h2>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Write your feedback..."
              rows="5"
              style={{ width: "100%", padding: "10px" }}
            />
            <div className="feedback-actions">
              <button onClick={handlePost}>Submit</button>
              <button onClick={() => setShowOverlay(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default PlayerFeedback;
