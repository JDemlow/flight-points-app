import os
import uuid
import logging
from datetime import datetime

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_caching import Cache
from amadeus import Client, ResponseError
from dotenv import load_dotenv
import isodate
from dateutil import parser

# ================================
# 1. Configuration and Initialization
# ================================

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Configure CORS
# Replace 'https://flight-points-app.netlify.app' with your actual Netlify frontend URL
CORS(
    app,
    resources={
        r"/flight-offers": {
            "origins": [
                "http://localhost:5173",
                "https://flight-points-app.netlify.app",
            ]
        },
        r"/airport-search": {
            "origins": [
                "http://localhost:5173",
                "https://flight-points-app.netlify.app",
            ]
        },
    },
)

# Initialize Flask-Caching with simple cache (in-memory)
cache = Cache(app, config={"CACHE_TYPE": "simple"})

# Initialize the Amadeus client with your API credentials
AMADEUS_API_KEY = os.getenv("AMADEUS_API_KEY")
AMADEUS_API_SECRET = os.getenv("AMADEUS_API_SECRET")

if not AMADEUS_API_KEY or not AMADEUS_API_SECRET:
    logger.error("Amadeus API credentials are not set in the environment variables.")
    raise EnvironmentError("Missing Amadeus API credentials.")

amadeus = Client(client_id=AMADEUS_API_KEY, client_secret=AMADEUS_API_SECRET)

# ================================
# 2. Static Airline Codes Mapping
# ================================

AIRLINE_CODES = {
    "F9": "Frontier Airlines",
    "B6": "JetBlue Airways",
    "AS": "Alaska Airlines",
    "SY": "Sun Country Airlines",
    "NK": "Spirit Airlines",
    "UA": "United Airlines",
    "DL": "Delta Air Lines",
    "AA": "American Airlines",
    "SW": "Southwest Airlines",
    "HA": "Hawaiian Airlines",
    # Add more airlines as needed
}

# ================================
# 3. Helper Functions
# ================================


def get_flight_offers(origin, destination, departure_date, return_date=None):
    """Retrieve flight offers based on origin, destination, departure date, and optional return date."""
    try:
        # Build query parameters
        params = {
            "originLocationCode": origin.upper(),
            "destinationLocationCode": destination.upper(),
            "departureDate": departure_date,
            "adults": 1,
            "max": 10,
            "nonStop": False,  # Include all flights
            "currencyCode": "USD",  # Adjust as needed
        }

        if return_date:
            params["returnDate"] = return_date
            params["travelClass"] = "ECONOMY"  # Adjust as needed

        response = amadeus.shopping.flight_offers_search.get(**params)
        logger.info(
            f"Fetched flight offers for {origin} to {destination} on {departure_date}"
            + (f" and return on {return_date}" if return_date else "")
        )
        return response.data
    except ResponseError as error:
        logger.error(f"Amadeus API ResponseError: {error}")
        return []


def estimate_points_required(cash_price, airline_code):
    """Estimate the number of points required based on cash price and airline."""
    # Define average point values per airline
    airline_point_values = {
        "F9": 0.005,  # Frontier Airlines
        "B6": 0.013,  # JetBlue Airways
        "AS": 0.012,  # Alaska Airlines
        "SY": 0.010,  # Sun Country Airlines
        "NK": 0.014,  # Spirit Airlines
        "UA": 0.012,  # United Airlines
        "DL": 0.013,  # Delta Air Lines
        "AA": 0.015,  # American Airlines
        "SW": 0.011,  # Southwest Airlines
        "HA": 0.014,  # Hawaiian Airlines
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


def process_flight_offers(flight_offers):
    """Process raw flight offers data into a structured format."""
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
            airline_code = offer["validatingAirlineCodes"][0]
            airline_name = AIRLINE_CODES.get(
                airline_code, "Unknown Airline"
            )  # Use static mapping

            # Extract outbound flight details
            outbound = offer["itineraries"][0]
            outbound_departure_time = outbound["segments"][0]["departure"]["at"]
            outbound_arrival_time = outbound["segments"][-1]["arrival"]["at"]
            outbound_duration = outbound["duration"]
            outbound_stops = len(outbound["segments"]) - 1

            # Parse outbound duration for readability
            parsed_outbound_duration = isodate.parse_duration(outbound_duration)
            outbound_hours, remainder = divmod(
                parsed_outbound_duration.total_seconds(), 3600
            )
            outbound_minutes, _ = divmod(remainder, 60)
            outbound_duration_formatted = (
                f"{int(outbound_hours)}h {int(outbound_minutes)}m"
            )

            # Parse outbound departure and arrival times
            outbound_departure_datetime = parser.isoparse(outbound_departure_time)
            outbound_arrival_datetime = parser.isoparse(outbound_arrival_time)

            # Calculate outbound total travel time
            outbound_total_travel_time = (
                outbound_arrival_datetime - outbound_departure_datetime
            )
            outbound_total_hours, remainder = divmod(
                outbound_total_travel_time.total_seconds(), 3600
            )
            outbound_total_minutes, _ = divmod(remainder, 60)
            outbound_total_travel_time_formatted = (
                f"{int(outbound_total_hours)}h {int(outbound_total_minutes)}m"
            )

            # Check if outbound flight arrives on a different day
            outbound_overnight = (
                outbound_arrival_datetime.date() > outbound_departure_datetime.date()
            )

            # Initialize result object
            result = {
                "id": offer_id,
                "price": price,
                "airline": airline_name,  # Updated to display airline name
                "points_required": int(
                    estimate_points_required(price, airline_code)[0]
                ),
                "value_per_point": round(
                    calculate_value_per_point(
                        price, estimate_points_required(price, airline_code)[0]
                    ),
                    2,
                ),
                "point_value": estimate_points_required(price, airline_code)[1],
                "departure_time": outbound_departure_datetime.strftime(
                    "%Y-%m-%d %H:%M"
                ),
                "arrival_time": outbound_arrival_datetime.strftime("%Y-%m-%d %H:%M"),
                "duration": outbound_duration_formatted,
                "stops": outbound_stops,
                "total_travel_time": outbound_total_travel_time_formatted,
                "overnight": outbound_overnight,
            }

            # If return flight exists, extract and add its details
            if len(offer["itineraries"]) > 1:
                return_flight = offer["itineraries"][1]
                return_departure_time = return_flight["segments"][0]["departure"]["at"]
                return_arrival_time = return_flight["segments"][-1]["arrival"]["at"]
                return_duration = return_flight["duration"]
                return_stops = len(return_flight["segments"]) - 1

                # Parse return duration for readability
                parsed_return_duration = isodate.parse_duration(return_duration)
                return_hours, remainder = divmod(
                    parsed_return_duration.total_seconds(), 3600
                )
                return_minutes, _ = divmod(remainder, 60)
                return_duration_formatted = (
                    f"{int(return_hours)}h {int(return_minutes)}m"
                )

                # Parse return departure and arrival times
                return_departure_datetime = parser.isoparse(return_departure_time)
                return_arrival_datetime = parser.isoparse(return_arrival_time)

                # Calculate return total travel time
                return_total_travel_time = (
                    return_arrival_datetime - return_departure_datetime
                )
                return_total_hours, remainder = divmod(
                    return_total_travel_time.total_seconds(), 3600
                )
                return_total_minutes, _ = divmod(remainder, 60)
                return_total_travel_time_formatted = (
                    f"{int(return_total_hours)}h {int(return_total_minutes)}m"
                )

                # Check if return flight arrives on a different day
                return_overnight = (
                    return_arrival_datetime.date() > return_departure_datetime.date()
                )

                # Add return flight details to the result
                result["return_flight"] = {
                    "departure_time": return_departure_datetime.strftime(
                        "%Y-%m-%d %H:%M"
                    ),
                    "arrival_time": return_arrival_datetime.strftime("%Y-%m-%d %H:%M"),
                    "duration": return_duration_formatted,
                    "stops": return_stops,
                    "total_travel_time": return_total_travel_time_formatted,
                    "overnight": return_overnight,
                }

            results.append(result)
        except Exception as e:
            logger.error(f"Error processing offer ID {offer_id}: {e}")
            continue

    # Sort results by value_per_point in descending order
    sorted_results = sorted(results, key=lambda x: x["value_per_point"], reverse=True)
    return sorted_results


# ================================
# 4. API Endpoints
# ================================


@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint to verify the server is running."""
    logger.info("Health check requested.")
    return jsonify({"status": "healthy"}), 200


@app.route("/flight-offers", methods=["GET"])
def flight_offers_endpoint():
    """
    Endpoint to retrieve flight offers.
    Supports both one-way and round-trip searches.
    Example (One-Way):
        /flight-offers?origin=JFK&destination=LAX&departure_date=2024-12-05
    Example (Round-Trip):
        /flight-offers?origin=JFK&destination=LAX&departure_date=2024-12-05&return_date=2024-12-15
    """
    # Get query parameters
    origin = request.args.get("origin")
    destination = request.args.get("destination")
    departure_date = request.args.get("departure_date")
    return_date = request.args.get("return_date")  # Optional for round-trip

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

    if return_date:
        try:
            datetime.strptime(return_date, "%Y-%m-%d")
            # Ensure return_date is after departure_date
            if return_date < departure_date:
                errors.append("Return date cannot be before departure date.")
        except (ValueError, TypeError):
            errors.append("Invalid return date. Please use YYYY-MM-DD format.")

    if errors:
        logger.warning(f"Validation errors: {errors}")
        return jsonify({"errors": errors}), 400

    # Get flight offers from Amadeus API
    offers = get_flight_offers(origin, destination, departure_date, return_date)
    if not offers:
        logger.info("No flight offers found.")
        return jsonify({"message": "No flight offers found."}), 404

    # Process and structure flight offers
    results = process_flight_offers(offers)
    logger.info(f"Returning {len(results)} flight offers.")
    return jsonify(results), 200


@app.route("/airport-search", methods=["GET"], strict_slashes=False)
@cache.cached(timeout=300, query_string=True)  # Cache for 5 minutes
def airport_search_endpoint():
    """
    Endpoint to search for airports and cities based on a keyword.
    Example: /airport-search?keyword=New%20York&subType=AIRPORT
    """
    keyword = request.args.get("keyword")
    sub_type = request.args.get("subType")  # Optional: 'AIRPORT' or 'CITY'

    # Validate input
    if not keyword:
        logger.warning("Missing search keyword.")
        return jsonify({"errors": ["Missing search keyword."]}), 400

    try:
        # Call Amadeus API to search locations
        response = amadeus.reference_data.locations.get(
            keyword=keyword,
            subType=sub_type,  # Can be 'AIRPORT', 'CITY', or omitted for both
        )
        locations = response.data

        MAX_RESULTS = 10  # Define a maximum number of results

        # Process and format the response
        formatted_locations = []
        for location in locations:
            if "iataCode" in location and location["iataCode"]:
                formatted_locations.append(
                    {
                        "name": location.get("name"),
                        "iata_code": location.get("iataCode"),
                        "city": location.get("address", {}).get("cityName"),
                        "country": location.get("address", {}).get("countryName"),
                        "latitude": location.get("geoCode", {}).get("latitude"),
                        "longitude": location.get("geoCode", {}).get("longitude"),
                        "type": location.get("subType"),  # 'AIRPORT' or 'CITY'
                    }
                )
            if len(formatted_locations) >= MAX_RESULTS:
                break

        if not formatted_locations:
            logger.info("No matching airports or cities found.")
            return jsonify({"message": "No matching airports or cities found."}), 404

        logger.info(f"Found {len(formatted_locations)} locations matching '{keyword}'")
        return jsonify({"locations": formatted_locations}), 200

    except ResponseError as error:
        logger.error(f"Amadeus API ResponseError: {error}")
        return (
            jsonify({"errors": ["Amadeus API error: Unable to process your request."]}),
            500,
        )

    except Exception as e:
        logger.error(f"Unexpected error in /airport-search: {e}")
        return jsonify({"errors": ["An unexpected error occurred."]}), 500


# ================================
# 5. Application Entry Point
# ================================

if __name__ == "__main__":
    # It's recommended to run Flask with a production server like Gunicorn in deployment
    port = int(os.environ.get("PORT", 5000))
    logger.info(f"Starting Flask app on port {port}")
    app.run(debug=False, host="0.0.0.0", port=port)
