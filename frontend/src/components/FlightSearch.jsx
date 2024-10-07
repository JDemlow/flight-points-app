// src/components/FlightSearch.jsx

import React, { useState } from "react";
import Select from "react-select";
import axios from "axios";
import debounce from "lodash.debounce";

const FlightSearch = ({ onSearch }) => {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [departureDate, setDepartureDate] = useState("");

  const [originOptions, setOriginOptions] = useState([]);
  const [destinationOptions, setDestinationOptions] = useState([]);
  const [originLoading, setOriginLoading] = useState(false);
  const [destinationLoading, setDestinationLoading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Function to fetch airports based on input
  const fetchAirports = async (inputValue, setOptions, setLoading) => {
    if (!inputValue) {
      setOptions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/airport-search`, {
        params: { keyword: inputValue, subType: "AIRPORT" },
      });

      const locations = response.data.locations;
      const formattedOptions = locations.map((location) => ({
        value: location.iata_code,
        label: `${location.name} (${location.iata_code}) - ${location.city}, ${location.country}`,
      }));

      setOptions(formattedOptions);
    } catch (error) {
      console.error("Error fetching airports:", error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced versions to prevent excessive API calls
  const debouncedFetchOrigin = debounce((inputValue) => {
    fetchAirports(inputValue, setOriginOptions, setOriginLoading);
  }, 300);

  const debouncedFetchDestination = debounce((inputValue) => {
    fetchAirports(inputValue, setDestinationOptions, setDestinationLoading);
  }, 300);

  // Handlers for input changes
  const handleOriginInputChange = (inputValue) => {
    debouncedFetchOrigin(inputValue);
    return inputValue;
  };

  const handleDestinationInputChange = (inputValue) => {
    debouncedFetchDestination(inputValue);
    return inputValue;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (origin && destination && departureDate) {
      onSearch({
        origin: origin.value,
        destination: destination.value,
        departureDate,
      });
    } else {
      alert("Please fill in all fields.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl p-4 mx-auto mt-8 bg-white rounded shadow-md"
    >
      <div className="mb-4">
        <label className="block mb-2 text-sm font-bold text-gray-700">
          Origin
        </label>
        <Select
          options={originOptions}
          onChange={setOrigin}
          onInputChange={handleOriginInputChange}
          isLoading={originLoading}
          placeholder="Select origin airport..."
          isClearable
        />
      </div>
      <div className="mb-4">
        <label className="block mb-2 text-sm font-bold text-gray-700">
          Destination
        </label>
        <Select
          options={destinationOptions}
          onChange={setDestination}
          onInputChange={handleDestinationInputChange}
          isLoading={destinationLoading}
          placeholder="Select destination airport..."
          isClearable
        />
      </div>
      <div className="mb-4">
        <label className="block mb-2 text-sm font-bold text-gray-700">
          Departure Date
        </label>
        <input
          type="date"
          value={departureDate}
          onChange={(e) => setDepartureDate(e.target.value)}
          className="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
          required
        />
      </div>
      <button
        type="submit"
        className="w-full px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700 focus:outline-none focus:shadow-outline"
      >
        Search Flights
      </button>
    </form>
  );
};

export default FlightSearch;
