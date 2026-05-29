import http from "http";

// Test data sesuai format model (text + num)
const data = JSON.stringify({
    text: "Experienced in Python, SQL, and machine learning. Responsible for analyzing large datasets and building predictive models.",
    num: 5
});

const options = {
    hostname: "localhost",
    port: 5000,
    path: "/api/predictions",
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data)
    }
};

const req = http.request(options, (res) => {

    res.on("data", (chunk) => {
        console.log(chunk.toString());
    });

});

req.write(data);
req.end();