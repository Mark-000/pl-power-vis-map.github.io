const express = require("express");
const request = require("request");
const cors = require("cors");

const app = express();
app.use(cors());

// Універсальний проксі — запит приймає будь-який повний URL
app.get("/proxy", (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl || !targetUrl.startsWith("http")) {
    return res.status(400).send("Missing or invalid 'url' parameter");
  }

  console.log("Proxying request to:", targetUrl);
  req.pipe(request(targetUrl)).on("error", () => {
    res.status(500).send("Error forwarding request");
  }).pipe(res);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
