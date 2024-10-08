// src/components/FlightSearch.jsx

import React, { useState, useCallback, useEffect } from "react";
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

  const [originError, setOriginError] = useState(null);
  const [destinationError, setDestinationError] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Function to fetch airports based on input
  const fetchAirports = async (
    inputValue,
    setOptions,
    setLoading,
    setError
  ) => {
    if (!inputValue) {
      setOptions([]);
      return;
    }

    setLoading(true);
    setError(null); // Reset previous errors
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
      setError("Failed to load airport options. Please try again.");
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  // Memoized debounced functions to prevent recreation on every render
  const debouncedFetchOrigin = useCallback(
    debounce((inputValue) => {
      fetchAirports(
        inputValue,
        setOriginOptions,
        setOriginLoading,
        setOriginError
      );
    }, 300),
    [] // Dependencies array is empty to ensure it's created only once
  );

  const debouncedFetchDestination = useCallback(
    debounce((inputValue) => {
      fetchAirports(
        inputValue,
        setDestinationOptions,
        setDestinationLoading,
        setDestinationError
      );
    }, 300),
    []
  );

  // Handlers for input changes
  const handleOriginInputChange = (inputValue) => {
    debouncedFetchOrigin(inputValue);
    return inputValue;
  };

  const handleDestinationInputChange = (inputValue) => {
    debouncedFetchDestination(inputValue);
    return inputValue;
  };

  // Cleanup debounced functions on component unmount
  useEffect(() => {
    return () => {
      debouncedFetchOrigin.cancel();
      debouncedFetchDestination.cancel();
    };
  }, [debouncedFetchOrigin, debouncedFetchDestination]);

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
      {/* Origin Selection */}
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
          noOptionsMessage={() =>
            originError ? originError : "No airports found."
          }
        />
      </div>

      {/* Destination Selection */}
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
          noOptionsMessage={() =>
            destinationError ? destinationError : "No airports found."
          }
        />
      </div>

      {/* Departure Date Selection */}
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
          min={new Date().toISOString().split("T")[0]} // Prevent selecting past dates
        />
      </div>

      {/* Submit Button */}
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
