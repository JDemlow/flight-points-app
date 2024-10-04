import uuid
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from amadeus import Client, ResponseError
from dotenv import load_dotenv
import logging
import isodate
from datetime import datetime
from dateutil import parser


# Configure logging
logging.basicConfig(level=logging.INFO)

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

CORS(app)

# Initialize the Amadeus client with your API credentials
AMADEUS_API_KEY = os.getenv("AMADEUS_API_KEY")
AMADEUS_API_SECRET = os.getenv("AMADEUS_API_SECRET")
amadeus = Client(client_id=AMADEUS_API_KEY, client_secret=AMADEUS_API_SECRET)


def get_flight_offers(origin, destination, departure_date):
    """Retrieve flight offers based on origin, destination, and departure date."""
    try:
        response = amadeus.shopping.flight_offers_search.get(
            originLocationCode=origin,
            destinationLocationCode=destination,
            departureDate=departure_date,
            adults=1,
            max=10,
        )
        return response.data
    except ResponseError as error:
        logging.error(f"An error occurred: {error}")
        return []


def estimate_points_required(cash_price, airline_code):
    """Estimate the number of points required based on cash price and airline."""
    # Define average point values per airline
    airline_point_values = {
        "F9": 0.005,  # Frontier Airlines
        "B6": 0.013,  # JetBlue Airways
        "AS": 0.012,  # Alaska Airlines
        "SY": 0.010,  # Sun Country Airlines
        # Add more airlines as needed
    }
    average_point_value = airline_point_values.get(
        airline_code, 0.01
    )  # Default to 1 cent if airline not found
    points_required = float(cash_price) / average_point_value
    return points_required, average_point_value


def calculate_value_per_point(cash_price, points_required):
    """Calculate the value per point for a flight."""
    value_per_point = (
        float(cash_price) / points_required
    ) * 100  # Value in cents per point
    return value_per_point


import uuid  # Add this import at the top


def process_flight_offers(flight_offers):
    results = []
    seen_offers = set()

    for offer in flight_offers:
        offer_id = offer.get("id") or str(
            uuid.uuid4()
        )  # Ensure each offer has a unique 'id'
        if not offer_id or offer_id in seen_offers:
            continue
        seen_offers.add(offer_id)

        try:
            price = float(offer["price"]["total"])
            airline = offer["validatingAirlineCodes"][0]
            # Extract additional flight details
            departure_time = offer["itineraries"][0]["segments"][0]["departure"]["at"]
            arrival_time = offer["itineraries"][0]["segments"][-1]["arrival"]["at"]
            duration = offer["itineraries"][0]["duration"]
            stops = len(offer["itineraries"][0]["segments"]) - 1

            # Parse duration for readability
            parsed_duration = isodate.parse_duration(duration)
            hours, remainder = divmod(parsed_duration.total_seconds(), 3600)
            minutes, _ = divmod(remainder, 60)
            duration_formatted = f"{int(hours)}h {int(minutes)}m"

            # Parse departure and arrival times
            departure_datetime = parser.isoparse(departure_time)
            arrival_datetime = parser.isoparse(arrival_time)

            # Calculate total travel time
            total_travel_time = arrival_datetime - departure_datetime
            total_hours, remainder = divmod(total_travel_time.total_seconds(), 3600)
            total_minutes, _ = divmod(remainder, 60)
            total_travel_time_formatted = f"{int(total_hours)}h {int(total_minutes)}m"

            # Check if flight arrives on a different day
            overnight = arrival_datetime.date() > departure_datetime.date()

            # Pass both price and airline to the function
            points_required, point_value = estimate_points_required(price, airline)
            value_per_point = calculate_value_per_point(price, points_required)

            result = {
                "id": offer_id,  # Ensure 'id' is included
                "price": price,
                "airline": airline,
                "points_required": int(points_required),
                "value_per_point": round(value_per_point, 2),
                "point_value": point_value,
                "departure_time": departure_datetime.strftime("%Y-%m-%d %H:%M"),
                "arrival_time": arrival_datetime.strftime("%Y-%m-%d %H:%M"),
                "duration": duration_formatted,
                "stops": stops,
                "total_travel_time": total_travel_time_formatted,
                "overnight": overnight,
            }
            results.append(result)
        except Exception as e:
            logging.error(f"Error processing offer ID {offer_id}: {e}")
            continue

    # Sort results
    sorted_results = sorted(results, key=lambda x: x["value_per_point"], reverse=True)
    return sorted_results


@app.route("/flight-offers", methods=["GET"])
def flight_offers_endpoint():
    # Get query parameters
    origin = request.args.get("origin")
    destination = request.args.get("destination")
    departure_date = request.args.get("departure_date")

    # Validate inputs
    errors = []
    if not origin or not (origin.isalpha() and len(origin) == 3):
        errors.append("Invalid or missing origin airport code.")
    if not destination or not (destination.isalpha() and len(destination) == 3):
        errors.append("Invalid or missing destination airport code.")
    try:
        datetime.strptime(departure_date, "%Y-%m-%d")
    except (ValueError, TypeError):
        errors.append(
            "Invalid or missing departure date. Please use YYYY-MM-DD format."
        )

    if errors:
        return jsonify({"errors": errors}), 400

    # Get flight offers
    offers = get_flight_offers(origin, destination, departure_date)
    if not offers:
        return jsonify({"message": "No flight offers found."}), 404

    # Process flight offers
    results = process_flight_offers(offers)
    return jsonify(results)


if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
