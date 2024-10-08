// src/components/FlightResults.jsx

import React from "react";

const FlightResults = ({ results }) => {
  if (!results || results.length === 0) {
    return (
      <p className="mt-4 text-center text-gray-700">
        No flight offers available.
      </p>
    );
  }

  return (
    <div className="max-w-4xl p-4 mx-auto">
      <h2 className="mb-4 text-2xl font-semibold">Flight Offers</h2>
      <ul>
        {results.map((offer) => (
          <li
            key={offer.id}
            className="p-4 mb-4 bg-white border rounded shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold">
                  Airline: {offer.airline} - ${offer.price}
                </p>
                <p>
                  Points Required: {offer.points_required} | Value per Point:{" "}
                  {offer.value_per_point} cents
                </p>
              </div>
              <div>
                <p>
                  Departure: {offer.departure_time} | Arrival:{" "}
                  {offer.arrival_time}
                </p>
                <p>Duration: {offer.duration}</p>
                <p>Stops: {offer.stops}</p>
                <p>Total Travel Time: {offer.total_travel_time}</p>
                <p>Overnight: {offer.overnight ? "Yes" : "No"}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FlightResults;
