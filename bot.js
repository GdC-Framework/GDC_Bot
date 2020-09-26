/* eslint-disable no-plusplus */
require("dotenv").config();
const Discord = require("discord.js");

const client = new Discord.Client({
  partials: ["USER", "MESSAGE", "CHANNEL", "REACTION"],
});
const moment = require("moment");

const { keywordPatterns, screenshotsRoom } = require("./patterns");
const { sendMessage } = require("./utils/discord");
require("./utils/moment-fr");
const { shortUrl } = require("./utils/string");

const detectGdcMessage = process.env.DEV_MODE_GDC == "true";
moment.locale("fr");

const debugLog = ({ prefix, message, content = true }) => {
  console.log(
    `${prefix}: ${message.member.guild.name} (${message.member.guild.id})/${
      message.channel.name
    } (${message.channel.parentID}/${message.channel.id}) - ${
      message.author.username
    } (${message.author.id} - Groups [${message.member.roles.map(
      ({ name }) => name
    )}]) (Attachments ${message.attachments && message.attachments.size}): ${
      content ? message.content : ""
    }`
  );
};

client.on("ready", () => {
  console.log("I am ready!");
});

client.on("error", console.error);

client.on("message", async (message) => {
  try {
    if (message.partial) await message.fetch();

    // If it is its own message
    if (message.author.id === process.env.OWN_ID) {
      return;
    }

    debugLog({ prefix: "Handle", message, content: true });

    // Si debug ET Shinriel
    if (
      message.content === "debug" &&
      message.author.id === "191984662665494530"
    ) {
      sendMessage(
        message,
        client,
        `Bonjour Maitre, à votre demande je vais vous donner le debug : \n
          Guild:  ${message.member.guild.name} (${message.member.guild.id})
          Channel: ${message.channel.name} (${message.channel.parentID}/${
          message.channel.id
        })
          User: ${message.author.username} (${message.author.id})
          Attachments: ${message.attachments.size})
          Content: ${message.content}
          Guild's channels: ${message.member.guild.channels
            .map(({ name }) => name)
            .join(", ")}`
      );
    }

    if (detectGdcMessage) {
      keywordPatterns(message, client);
      screenshotsRoom(message, client);
    }
  } catch (ex) {
    console.error("Generic Error", ex);
  } finally {
    debugLog({ prefix: "Handle-END", message, content: false });
  }
});

if (process.env.WELCOME_CHANNEL) {
  client.on("guildMemberAdd", async (member) => {
    try {
      // Get the channel where send the welcome message
      const channel = member.guild.channels.find(
        (ch) => ch.name === process.env.WELCOME_CHANNEL
      );
      // Do nothing if not found
      if (!channel) return;

      // Send the message, mentioning the member
      channel.send(`Salut ${member}, 
        Tu trouvera ci-dessous tout ce qu’il te faut pour nous rejoindre <${await shortUrl(
          "http://forum.canardpc.com/threads/96457-Serveur-Arma-3-COOP-CPC-Gr%C3%A8ce-de-Canards-TS-62-210-131-115-RELOADED?s=f1e649135fe3dbcfff14570e4014b87a"
        )}>

        Tous nos outils se trouvent sur <https://grecedecanards.fr>`);
    } catch (ex) {
      console.error("WelcomeMessage", ex);
    }
  });
}

let autoRecoTimes = 0;
const autoReconnect = () =>
  client
    .login(process.env.API_KEY)
    .catch((e) => {
      console.error("Discord Error", e);
      autoRecoTimes++;
      setTimeout(() => {
        autoReconnect();
      }, (autoRecoTimes ** 2) * 500);
    })
    .then(() => {
      autoRecoTimes = 0;
    });

autoReconnect();

module.exports = client;
