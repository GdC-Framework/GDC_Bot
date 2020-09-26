const moment = require("moment");
const {
  sendMessage,
  replyMessage,
  deleteMessage,
} = require("../utils/discord");

/*
  Structure screenshotsAuthors:

  authorId: {
      lastValidMessage: Utc Date
  }
*/
const screenshotsAuthors = {};
const timeBetweenMessage = 60 * 60 * 20; // 20 hours in seconds

const IDChannelScreenshots = "434310515762790430";

const hasImage = (message) =>
  (message.attachments && message.attachments.size > 0) ||
  /(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+\.(gif|jpe?g|tiff|png|webp|bmp|svg)(\?.*)?/i.test(
    message.content
  ) ||
  /steamuserimages\-a\.akamaihd\.net/i.test(message.content) ||
  /gph\.is/i.test(message.content) ||
  /tenor\.com/i.test(message.content) ||
  /giphy\.com/i.test(message.content) ||
  /imgur\.com/i.test(message.content);

const canSendMessage = (message) => {
  if (screenshotsAuthors[message.author.id]) {
    const { lastValidMessage } = screenshotsAuthors[message.author.id];

    // Check if message is too soon
    const previousMoment = moment
      .utc(lastValidMessage)
      .add(timeBetweenMessage, "s");
    if (moment.utc().isBefore(previousMoment)) {
      return false;
    }
  }

  return true;
};

const updateLastValidMessage = (message) => {
  if (screenshotsAuthors[message.author.id]) {
    // Update, already exists
    screenshotsAuthors[message.author.id].lastValidMessage = moment.utc();
    screenshotsAuthors[message.author.id].nbWarning = 0;
  } else {
    // New author
    screenshotsAuthors[message.author.id] = {
      lastValidMessage: moment.utc(),
      nbWarning: 0,
    };
  }
};

const handleWarning = ({ message, client }) => {
  const { nbWarning = 0, lastValidMessage } = screenshotsAuthors[
    message.author.id
  ];

  const diffSinceFirstImage = moment(lastValidMessage)
    .locale("fr")
    .fromNow(true);

  switch (nbWarning) {
    case 0:
      replyMessage(
        message,
        `/!\\ Une image par jour et par personne, la prochaine je la supprime, image de la journée envoyée il y a ${diffSinceFirstImage}`
      );
      break;

    default:
      deleteMessage(message);
      break;
  }

  screenshotsAuthors[message.author.id].nbWarning += 1;
};

module.exports = (message, client) => {
  if (message.channel.id === IDChannelScreenshots) {
    if (hasImage(message)) {
      if (canSendMessage(message)) {
        updateLastValidMessage(message);
      } else {
        handleWarning({ message, client });
      }
    }
  }
};
