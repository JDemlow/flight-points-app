// src/components/FlightResults.jsx

import React from "react";
import PropTypes from "prop-types";

function FlightResults({ results = [] }) {
  console.log("FlightResults received results:", results); // Debugging line

  return (
    <div className="max-w-2xl mx-auto mt-8">
      {results.length === 0 ? (
        <p className="text-center text-gray-500">No results found.</p>
      ) : (
        results.map((result) => (
          <div
            key={result.id}
            className="p-6 mb-6 bg-white rounded-lg shadow-md"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-xl font-semibold">
                ${result.price.toFixed(2)}
              </p>
              <span className="px-3 py-1 text-sm text-blue-800 bg-blue-100 rounded-full">
                {result.airline}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-gray-600">Departure:</p>
                <p className="font-medium">{result.departure_time}</p>
              </div>
              <div>
                <p className="text-gray-600">Arrival:</p>
                <p className="font-medium">{result.arrival_time}</p>
              </div>
              <div>
                <p className="text-gray-600">Duration:</p>
                <p className="font-medium">{result.duration}</p>
              </div>
              <div>
                <p className="text-gray-600">Total Travel Time:</p>
                <p className="font-medium">{result.total_travel_time}</p>
              </div>
              <div>
                <p className="text-gray-600">Stops:</p>
                <p className="font-medium">{result.stops}</p>
              </div>
              <div>
                <p className="text-gray-600">Points Required:</p>
                <p className="font-medium">{result.points_required}</p>
              </div>
            </div>
            <p className="mb-2 text-gray-700">
              Value per Point: {result.value_per_point} cents (using{" "}
              {(result.point_value * 100).toFixed(1)} cents per point)
            </p>
            {result.overnight && (
              <p className="text-red-500">
                Note: This flight arrives on a different day.
              </p>
            )}
          </div>
        ))
      )}
    </div>
  );
}

FlightResults.propTypes = {
  results: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      airline: PropTypes.string.isRequired,
      price: PropTypes.number.isRequired,
      departure_time: PropTypes.string.isRequired,
      arrival_time: PropTypes.string.isRequired,
      duration: PropTypes.string.isRequired,
      total_travel_time: PropTypes.string.isRequired,
      stops: PropTypes.number.isRequired,
      points_required: PropTypes.number.isRequired,
      value_per_point: PropTypes.number.isRequired,
      point_value: PropTypes.number.isRequired,
      overnight: PropTypes.bool.isRequired,
    })
  ),
};

export default FlightResults;
