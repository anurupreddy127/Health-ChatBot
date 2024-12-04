import React, { useState, useEffect } from "react";

function App() {
  const [symptoms, setSymptoms] = useState([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [response, setResponse] = useState(null);

  // Fetch symptoms list from the Flask backend
  useEffect(() => {
    const fetchSymptoms = async () => {
      try {
        const res = await fetch("http://127.0.0.1:5000/get_symptoms");
        const data = await res.json();
        setSymptoms(data.symptoms); // Set the available symptoms
      } catch (error) {
        console.error("Error fetching symptoms:", error);
      }
    };

    fetchSymptoms();
  }, []);

  // Handle symptom selection
  const handleSymptomChange = (event) => {
    const { value, checked } = event.target;
    if (checked) {
      setSelectedSymptoms((prevSymptoms) => [...prevSymptoms, value]);
    } else {
      setSelectedSymptoms((prevSymptoms) =>
        prevSymptoms.filter((symptom) => symptom !== value)
      );
    }
  };

  // Submit form data
  const handleSubmit = async () => {
    const data = {
      symptoms: selectedSymptoms,
      days: 3, // Set the number of days or get it dynamically
      additional_symptoms: [], // Include any additional symptoms if needed
    };

    try {
      const res = await fetch("http://127.0.0.1:5000/start_conversation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      setResponse(result); // Set the response data
    } catch (error) {
      console.error("Error:", error);
      setResponse("Error processing your request.");
    }
  };

  return (
    <div className="App">
      <h1>Healthcare ChatBot</h1>
      <form>
        <h3>Are you experiencing any of the following symptoms?</h3>
        {symptoms.length > 0 ? (
          symptoms.map((symptom) => (
            <div key={symptom}>
              <label>
                <input
                  type="checkbox"
                  value={symptom}
                  onChange={handleSymptomChange}
                />
                {symptom}
              </label>
            </div>
          ))
        ) : (
          <p>Loading symptoms...</p>
        )}
        <button type="button" onClick={handleSubmit}>
          Submit
        </button>
      </form>

      {response && (
        <div className="response-box">
          <h3>{response.disease}</h3>
          <p>{response.description}</p>
          <h4>Precautions:</h4>
          <ul>
            {response.precautions && response.precautions.length > 0 ? (
              response.precautions.map((precaution, index) => (
                <li key={index}>{precaution}</li>
              ))
            ) : (
              <li>No precautions available</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
