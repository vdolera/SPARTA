import PlayerMainLayout from "../../components/P_MainLayout";
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
    <PlayerMainLayout>

      <div className="feedback-header-row">
        <button onClick={() => setShowOverlay(true)}>Post Feedback</button>
      </div>

      <div className="feedback-maindiv">
        
          {feedbacks.length === 0 ? (
            <div className="no-feedback-message">
              <p>You have not submitted any feedbacks for {decodedEvent}.</p>
            </div>
          ) : (
            feedbacks.map((fb) => (   
                <div className="feedback-container" key={fb._id}>
                  <div className="feedback-contents">
                    <h5 style={{ fontStyle: "italic", textAlign: "right", margin: 0}}>{new Date(fb.createdAt).toLocaleDateString()}</h5>
                    <p>{fb.message}</p>
                    <h5 style={{ textAlign: "right", marginBottom: "5px" }}> - {fb.playerName || "Anonymous"}</h5>
                  </div> 
            </div>
            ))
          )} 
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
            />

            <div className="feedback-actions">
              <button className="cancel" onClick={() => setShowOverlay(false)}>
                Cancel
              </button>
              <button className="submit" onClick={handlePost}>
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

    </PlayerMainLayout>
  );
};

export default PlayerFeedback;
