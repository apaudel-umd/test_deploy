document.addEventListener("DOMContentLoaded", function () {
    let trackingInterval;
    let isTracking = false;
    const dataPoints = [];

    // Initialize the map
    var map = L.map('map').setView([0, 0], 13);

    // Add a map tile layer (you can choose your desired tile layer)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    // Add the Locate control to the map
    var lc = L.control.locate({
        position: 'topright',
        drawCircle: false,
        follow: true,
        setView: true,
        keepCurrentZoomLevel: true,
        markerStyle: {
            weight: 1,
            opacity: 0.8,
            fillColor: 'blue',
            fillOpacity: 0.6,
        },
    }).addTo(map);

    // Listen for locationfound event to create or update a marker on the map
    map.on('locationfound', function (e) {
        if (typeof userMarker === 'undefined') {
            userMarker = L.marker(e.latlng).addTo(map);
        } else {
            userMarker.setLatLng(e.latlng);
        }

        // Center the map on the user's location
        map.setView(e.latlng, 18);
    });

    // Listen for locationerror event in case there's an issue retrieving the user's location
    map.on('locationerror', function (e) {
        alert("Could not find your location: " + e.message);
    });


    function updatePosition() {
        navigator.geolocation.getCurrentPosition(
            function (position) {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;

                // Update the HTML elements with the latitude and longitude values
                document.getElementById("latitude").textContent = latitude;
                document.getElementById("longitude").textContent = longitude;

                // Record the data point
                if (isTracking) {
                    dataPoints.push({ longitude, latitude });
                }
            },
            function (error) {
                console.error("Error getting location:", error.message);
            }
        );
    }

    function startTracking() {
        if (!isTracking) {
            isTracking = true;
            dataPoints.length = 0; // Clear previous data points
            document.getElementById("status").textContent = "Tracking...";
            trackingInterval = setInterval(updatePosition, 5000); // Update every 5 seconds
        }
    }

    function stopTracking() {
        if (isTracking) {
            isTracking = false;
            document.getElementById("status").textContent = "Ready to Submit";
            clearInterval(trackingInterval);
            document.getElementById("submitButton").disabled = false;
        }
    }

    function submit() {
        // Send the recorded data to Flask backend
        sendDataToFlask();
        document.getElementById("status").textContent = "Data Sent!";
        dataPoints.length = 0;
        document.getElementById("submitButton").disabled = true;
    }

    function sendDataToFlask() {
        // Use fetch API to send data to Flask
        //let textData = dataPoints.pop().toString();
        //let count = 1;
        // while (dataPoints.length > 0) {
        //     if (count % 2 === 0) {
        //         textData = dataPoints.pop() + ', ' + textData;
        //     } else {
        //         textData = dataPoints.pop() + textData;
        //     }
        //     count++;
        //     };

        // const jsonString = JSON.stringify(dataPoints);
        // Parse the JSON string into a JavaScript array
        //const dataArray = JSON.parse(jsonString);

        // Convert the array of objects into the desired format
        //const formattedString = dataArray
        //.map(({ longitude, latitude }) => `${longitude} ${latitude}`)
        //.join(', ');

        console.log(JSON.stringify(dataPoints));
        //console.log(formattedString);

        fetch("/process_data", {
            method: "POST",
            headers: {
                "Content-Type": "application/json", //'text/plain',
            },
            body: JSON.stringify(dataPoints), // formattedString,
        })
            .then((response) => response.text())
            .then((data) => {
                console.log("Data sent to Flask:", data);
            })
            .catch((error) => {
                console.error("Error sending data to Flask:", error);
            });
    }

    document
        .getElementById("startButton")
        .addEventListener("click", startTracking);
    document.getElementById("stopButton").addEventListener("click", stopTracking);
    document.getElementById("submitButton").addEventListener("click", submit);
});
