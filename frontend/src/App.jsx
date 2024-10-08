// src/App.jsx

import React, { useState } from "react";
import FlightSearch from "./components/FlightSearch";
import FlightResults from "./components/FlightResults";

function App() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Access the environment variable
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const handleSearch = async ({
    origin,
    destination,
    departureDate,
    returnDate,
  }) => {
    setLoading(true);
    setResults([]);
    setError(null);

    try {
      // Construct query parameters
      const params = new URLSearchParams({
        origin,
        destination,
        departure_date: departureDate,
      });

      if (returnDate) {
        params.append("return_date", returnDate);
      }

      const response = await fetch(
        `${API_BASE_URL}/flight-offers?${params.toString()}`
      );

      if (response.ok) {
        const data = await response.json();
        setResults(data);
      } else {
        const errorData = await response.json();
        if (errorData.errors && errorData.errors.length > 0) {
          setError(errorData.errors.join(", "));
        } else if (errorData.message) {
          setError(errorData.message);
        } else {
          setError("An unexpected error occurred.");
        }
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
          <div
            className="w-12 h-12 border-t-4 border-b-4 border-blue-500 rounded-full animate-spin"
            aria-label="Loading spinner"
          />
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
