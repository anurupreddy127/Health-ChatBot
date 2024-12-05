import React, { useState, useEffect, useRef } from "react";
import "./App.css"; // Ensure you have the updated styles

function App() {
  const [symptoms, setSymptoms] = useState([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [response, setResponse] = useState(null);
  const [userName, setUserName] = useState("");
  const [page, setPage] = useState(1); // To track which page the user is on (1 for name page, 2 for symptoms)

  // Create a reference for the response box to scroll into view
  const responseRef = useRef(null);

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

  // Handle user name input
  const handleNameChange = (event) => {
    setUserName(event.target.value);
  };

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

  // Handle "Next" button click to move to the symptoms page
  const handleNextClick = () => {
    if (userName.trim() !== "") {
      setPage(2); // Go to the symptoms page
    } else {
      alert("Please enter your name");
    }
  };

  // Split symptoms into four parts (left and right)
  const quarter = Math.ceil(symptoms.length / 4);
  const firstQuarter = symptoms.slice(0, quarter);
  const secondQuarter = symptoms.slice(quarter, quarter * 2);
  const thirdQuarter = symptoms.slice(quarter * 2, quarter * 3);
  const fourthQuarter = symptoms.slice(quarter * 3);

  // Scroll to the response box after the response is updated
  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [response]); // This effect will trigger every time `response` is updated

  return (
    <div className="App">
      {page === 1 ? (
        // Name Input Page
        <div className="name-page">
          <h1>Healthcare ChatBot</h1>
          <h2>Enter your name</h2>
          <input
            type="text"
            value={userName}
            onChange={handleNameChange}
            placeholder="Your name"
          />
          <button onClick={handleNextClick}>Next</button>
        </div>
      ) : (
        // Symptoms Selection Page
        <div className="symptoms-page">
          <h1>Healthcare ChatBot</h1>
          <h2>Hello, {userName}</h2>{" "}
          {/* Display the greeting with the username */}
          <h3>Are you experiencing any of the following symptoms?</h3>
          <div className="symptoms-container">
            <div className="symptoms-column">
              {firstQuarter.map((symptom) => (
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
              ))}
            </div>
            <div className="divider"></div>
            <div className="symptoms-column">
              {secondQuarter.map((symptom) => (
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
              ))}
            </div>
            <div className="divider"></div>
            <div className="symptoms-column">
              {thirdQuarter.map((symptom) => (
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
              ))}
            </div>
            <div className="divider"></div>
            <div className="symptoms-column">
              {fourthQuarter.map((symptom) => (
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
              ))}
            </div>
          </div>
          <button type="button" onClick={handleSubmit}>
            Submit
          </button>
        </div>
      )}

      {response && (
        <div className="response-box" ref={responseRef}>
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
