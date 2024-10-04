import React, { useState } from "react";

function FlightSearch({ onSearch }) {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch({ origin, destination, departureDate });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md p-4 mx-auto mt-8 bg-white rounded shadow"
    >
      <div className="mb-4">
        <label htmlFor="origin" className="block text-gray-700">
          Origin Airport Code
        </label>
        <input
          id="origin"
          type="text"
          value={origin}
          onChange={(e) => setOrigin(e.target.value.toUpperCase())}
          className="block w-full p-2 mt-1 border border-gray-300 rounded"
          placeholder="e.g., JFK"
          maxLength="3"
          required
        />
      </div>
      <div className="mb-4">
        <label htmlFor="destination" className="block text-gray-700">
          Destination Airport Code
        </label>
        <input
          id="destination"
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value.toUpperCase())}
          className="block w-full p-2 mt-1 border border-gray-300 rounded"
          placeholder="e.g., LAX"
          maxLength="3"
          required
        />
      </div>
      <div className="mb-4">
        <label htmlFor="departureDate" className="block text-gray-700">
          Departure Date
        </label>
        <input
          id="departureDate"
          type="date"
          value={departureDate}
          onChange={(e) => setDepartureDate(e.target.value)}
          className="block w-full p-2 mt-1 border border-gray-300 rounded"
          required
        />
      </div>
      <button
        type="submit"
        className="w-full px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
      >
        Search Flights
      </button>
    </form>
  );
}

export default FlightSearch;
