require("dotenv").config();
const express = require("express");
const discordClient = require("./bot");

const port = process.env.API_PORT || 3000;
const app = express();

// Server is running?
app.get("/alive", (req, res) => res.send("Still alive"));

app.get("/launchServer", (req, res) => {
  // Running

  // Get the channel where send the welcome message
  const channel = discordClient.channels.find((ch) => ch.name === "bot-lounge");
  // Do nothing if not found
  if (!channel) {
    return res.status(503).send("Channel not found");
  }

  // Send the message, mentioning the member
  channel.send("Salut de la part de l'api !");

  return res.send("OK");
});

app.listen(port);
