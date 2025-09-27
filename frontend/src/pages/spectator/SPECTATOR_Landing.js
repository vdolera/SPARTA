import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";



export default function LandingPage() {
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
        navigate(`/${encodeURIComponent(institution.name)}`);
    };

    return (
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
    );
};