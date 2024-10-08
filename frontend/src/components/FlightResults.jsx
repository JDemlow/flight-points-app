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
            <div className="flex flex-col items-start justify-between md:flex-row md:items-center">
              <div className="mb-4 md:mb-0">
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
                  <strong>Departure:</strong> {offer.departure_time} |{" "}
                  <strong>Arrival:</strong> {offer.arrival_time}
                </p>
                <p>
                  <strong>Duration:</strong> {offer.duration} |{" "}
                  <strong>Stops:</strong> {offer.stops}
                </p>
                <p>
                  <strong>Total Travel Time:</strong> {offer.total_travel_time}{" "}
                  | <strong>Overnight:</strong> {offer.overnight ? "Yes" : "No"}
                </p>
              </div>
            </div>
            {offer.return_flight && (
              <div className="pt-4 mt-4 border-t">
                <h3 className="mb-2 text-lg font-semibold">Return Flight</h3>
                <div className="flex flex-col items-start justify-between md:flex-row md:items-center">
                  <div className="mb-4 md:mb-0">
                    <p className="font-bold">
                      Airline: {offer.airline} - ${offer.price}
                    </p>
                    <p>
                      Points Required: {offer.points_required} | Value per
                      Point: {offer.value_per_point} cents
                    </p>
                  </div>
                  <div>
                    <p>
                      <strong>Departure:</strong>{" "}
                      {offer.return_flight.departure_time} |{" "}
                      <strong>Arrival:</strong>{" "}
                      {offer.return_flight.arrival_time}
                    </p>
                    <p>
                      <strong>Duration:</strong> {offer.return_flight.duration}{" "}
                      | <strong>Stops:</strong> {offer.return_flight.stops}
                    </p>
                    <p>
                      <strong>Total Travel Time:</strong>{" "}
                      {offer.return_flight.total_travel_time} |{" "}
                      <strong>Overnight:</strong>{" "}
                      {offer.return_flight.overnight ? "Yes" : "No"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FlightResults;
