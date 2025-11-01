import { useEffect, useState } from "react";

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

      <hr className="divider" />

      <div className="form-section">
        <h2>Service Request Form</h2>
        <form className="service-form" onSubmit={handleSubmit}>
          
          {/* Email Field  */}
          <div className="form-group">
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
          <div className="form-group">
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

          {/* File Upload */}
          <div className="form-group">
            <label htmlFor="file-upload">Upload Attachment (Optional)</label>
            <input
              type="file"
              id="file-upload"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </div>

          {/* Submit Button */}
          <button type="submit" className="submit-btn" disabled={status === "sending"}>
            {status === "sending" ? "Sending..." : "Send Request"}
          </button>

          {/* Status Message */}
          {message && (
            <p className={`status-message ${status}`}>{message}</p>
          )}
        </form>
      </div>
    </div>
  );
}