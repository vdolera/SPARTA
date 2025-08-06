import MainLayout from "../../components/MainLayout";
import React from "react";
import '../../styles/ADMIN_Feedback.css';

const Feedback = () => {
  return (

    <MainLayout>
      <h1>Feedback</h1>

    <div className="feedback-maindiv">
      
      <div className="feedback-container">

        <div className="feedback-contents">
          {/* Feedback items will be displayed here */}
          <h3>Feedback title</h3>
          <p>User1: This is a feedback comment.</p>
        </div>
        
      </div>

    </div>

    </MainLayout>

  )
};

export default Feedback;