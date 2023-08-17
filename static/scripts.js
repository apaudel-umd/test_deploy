document.addEventListener("DOMContentLoaded", function () {
    let trackingInterval;
    let isTracking = false;
    const dataPoints = [];
    const formData = [];

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
    };

    function startTracking() {
        if (!isTracking) {
            isTracking = true;
            dataPoints.length = 0; // Clear previous data points
            document.getElementById("status").textContent = "Tracking...";
            trackingInterval = setInterval(updatePosition, 5000); // Update every 5 seconds
        }
    };

    function stopTracking() {
        if (isTracking) {
            isTracking = false;
            document.getElementById("status").textContent = "Ready to Submit";
            clearInterval(trackingInterval);
            document.getElementById("submitButton").disabled = false;
        }
    };

    function getFormData() {
        const username = document.getElementById("username").value;
        const email = document.getElementById("email").value;
        const item = document.getElementById("item").value;
        const color = document.getElementById("color").value;
        const date = document.getElementById("date").value;
        const reason = document.getElementById("reason").value;
        const extra = document.getElementById("extra").value;

        formData.push({name: 'username', value: username});
        formData.push({name: 'email', value: email});
        formData.push({name: 'item', value: item});
        formData.push({name: 'color', value: color});
        formData.push({name: 'date', value: date});
        formData.push({name: 'reason', value: reason});
        formData.push({name: 'extra', value: extra});
    };

    function submit() {
        // Send the recorded data to Flask backend
        sendDataToFlask();
        document.getElementById("status").textContent = "Data Sent!";
        dataPoints.length = 0;
        document.getElementById("submitButton").disabled = true;
    };

    function sendDataToFlask() {
        
        getFormData();
        console.log(JSON.stringify(dataPoints));
        console.log(JSON.stringify(formData));

        payload = {
            'dataPoints': dataPoints,
            'formData': formData
        };

        console.log(JSON.stringify(payload));

        fetch("/process_data", {
            method: "POST",
            headers: {
                "Content-Type": "application/json", //'text/plain',
            },
            body: JSON.stringify(payload), // formattedString,
        })
            .then((response) => response.text())
            .then((data) => {
                console.log("Data sent to Flask:", data);
            })
            .catch((error) => {
                console.error("Error sending data to Flask:", error);
            });
    };


    document.getElementById("startButton").addEventListener("click", startTracking);
    document.getElementById("stopButton").addEventListener("click", stopTracking);
    document.getElementById("submitButton").addEventListener("click", submit);
});
