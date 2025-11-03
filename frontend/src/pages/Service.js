import { useEffect, useState } from "react";
import "../styles/Service.css"
import "../styles/Spectator.css"

export default function ServicePage() {
  // State for form fields
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [file, setFile] = useState(null);
  
  // State for loading and feedback 
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  // Set the document title on component mount
  useEffect(() => {
    document.title = "SPARTA | Service Request";
  }, []);

  // Form Submit Handler 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    setMessage("Sending your request...");

    const formData = new FormData();
    formData.append("email", email);
    formData.append("body", body);
    if (file) {
      formData.append("attachment", file); 
    }

    try {
      const response = await fetch(`http://localhost:5000/api/send-request`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage("Request sent successfully! We will get back to you soon.");
        setEmail("");
        setBody("");
        setFile(null);
        e.target.reset();
      } else {
        setStatus("error");
        setMessage(result.message || "An error occurred. Please try again.");
      }
    } catch (error) {
      console.error("Form submission error:", error);
      setStatus("error");
      setMessage("Failed to connect to the server. Please check your connection.");
    }
  };

  return (

    <div className="service-page-container">

      <div className="spectator-header">
        <div className="header-text">
          SPARTA SERVICE REQUEST
        </div>
      </div>

      <div className="logo-div">
        <div className="logo-container">
          <img src="/SPARTA_Logo.png" alt="SPARTA Logo" className="spectator-logo" />
        </div>
      </div>

    <div className="service-page-wrapper">
      <div className="instructions-section">
        <h2>How to Add a New Institution</h2>
        <p>
          Follow these steps to request a new institution to be added to the
          SPARTA platform. Our team will review your request and add it to the
          system.
        </p>

        <ol className="instructions-list">
          <li>
            <strong>Your Email:</strong> Fill in your contact email so we can
            notify you of updates.
          </li>
          <li>
            <strong>Message Body:</strong> Please provide the following details
            about the institution:
            <ul>
              <li>Full official name of the institution.</li>
              <li>Address (City, State/Province, Country).</li>
              <li>Official website or a primary contact person (if known).</li>
              <li>Any other relevant details.</li>
            </ul>
          </li>
          <li>
            <strong>Upload Attachment (Optional):</strong> You can attach a
            supporting document, such as an official letter, logo, or brochure.
          </li>
          <li>
            <strong>Submit:</strong> Click "Send Request" and our admin team
            will begin the verification process.
          </li>
        </ol>
      </div>

        <div className="form-section">
          <h2>Service Request Form</h2>
          <form className="service-form" onSubmit={handleSubmit}>
            
            {/* Email Field  */}
            <div className="service-form-group">
              <label htmlFor="email">Your Contact Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            {/* Body Field */}
            <div className="service-form-group">
              <label htmlFor="body">Message Body (Institution Details)</label>
              <textarea
                id="body"
                rows="10"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Please enter the institution's details as per the instructions above..."
                required
              ></textarea>
            </div>

            <div className="service-form-group">
              
              <div className="file-upload" style={{width: "80%", margin: "5px auto"}}>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  style={{display: "none"}}
                />

                <span>{file ? file.name : "No file chosen"}</span>

                <label htmlFor="file-upload" className="upload-btn">
                  Upload Attachment
                </label>
              </div>

            </div>

            <button type="submit" className="submit-btn" disabled={status === "sending"}>
              {status === "sending" ? "Sending..." : "Send Request"}
            </button>

            {message && (
              <p className={`status-message ${status}`}>{message}</p>
            )}
          </form>
        </div>

      </div>
    </div>
  );
}