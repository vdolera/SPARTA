import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Spectator.css";

export default function LandingPage() {

  useEffect(() => {document.title = "SPARTA | Spectator";},[]);

    const [institutions, setInstitutions] = useState([]);
    const navigate = useNavigate();
    useEffect(() => {
        const fetchInstitutions = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/institutions`);
                const data = await res.json();
                setInstitutions(data);
            } catch (err) {
                console.error('Failed to fetch institutions:', err);
            }
        };
        fetchInstitutions();
    }, []);

    const handleInstitutionClick = (institution) => {
        navigate(`/spectator/${encodeURIComponent(institution.name)}`);
    };

    return (
        <div className="main-container">
                
            <div className="spectator-header">
                <div className="header-text">
                    SPARTA SPECTATOR LIVE VIEWING
                </div>
            </div>

            <div className="logo-div">
                <div className="logo-container">
                    <img src="/SPARTA_Logo.png" alt="SPARTA Logo" className="spectator-logo" />
                </div>
            </div>

            <h3 className="page-title">Select Your Institution</h3>

            <div className="institution-list">
    
                {institutions.map((institution) => (
                    <button key={institution._id} className="institution-item"
                    onClick={() => handleInstitutionClick(institution)}>
                        <div className="institution-name">
                            {institution.name}
                        </div>
                    </button>
                ))}
            </div>
        </div>     
    );
};