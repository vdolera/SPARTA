import MainLayout from "../../components/MainLayout";
import React from "react";
import '../../styles/ADMIN_Feedback.css';

const Feedback = () => {
  return (

    <MainLayout>

    <div className="feedback-maindiv">
      
      <div className="feedback-container">

        <div className="feedback-contents">
          {/* Feedback items will be displayed here */}
          <div className="feedback-header-row">
            <h3>Feedback Title</h3>
            <h5 style={{ fontStyle: "italic" }}>Feedback Date</h5>
          </div>

          <p>User1: This is a feedback comment.</p>

        </div>
        
      </div>

    </div>

    </MainLayout>

  )
};

export default Feedback;