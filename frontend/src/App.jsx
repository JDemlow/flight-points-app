// src/App.jsx

import React, { useState } from "react";
import FlightSearch from "./components/FlightSearch";
import FlightResults from "./components/FlightResults";

function App() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async ({ origin, destination, departureDate }) => {
    setLoading(true);
    setResults([]);
    setError(null);

    try {
      const response = await fetch(
        `http://127.0.0.1:5000/flight-offers?origin=${origin}&destination=${destination}&departure_date=${departureDate}`
      );

      if (response.ok) {
        const data = await response.json();
        setResults(data);
      } else {
        const errorData = await response.json();
        setError(errorData.message || errorData.errors.join(", "));
      }
    } catch (error) {
      console.error("Error fetching flight offers:", error);
      setError("An error occurred while fetching flight offers.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <h1 className="pt-8 text-3xl font-bold text-center">
        Flight Points Calculator
      </h1>
      <FlightSearch onSearch={handleSearch} />
      {loading ? (
        <div className="flex justify-center mt-4">
          <div className="w-12 h-12 border-t-4 border-b-4 border-blue-500 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {error && (
            <p className="mt-4 text-center text-red-500">Error: {error}</p>
          )}
          <FlightResults results={results} />
        </>
      )}
    </div>
  );
}

export default App;
