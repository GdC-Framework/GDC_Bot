const {
	sendMessage,
	replaceMessage,
	replyAndReplaceMessage,
	replyMessage,
	deleteMessage,
} = require('./discord')
const { RollDice } = require('./math')
const { hasCommonElements } = require('../utils/array');

const isMatch = (
	{ authorId, channelId, content, member }, // Source message
	{
		authorIds,
		notAuthorIds,
		channelIds,
		notChannelIds,
		roleNames,
		notRoleNames,
		exactMatch,
		regex,
	}
) => {
	const userRoles = member.roles.map(({ name }) => name)
	return (
		// Config
		(!authorIds || authorIds.includes(authorId)) && // Filter by authorIds (if filter)
		(!channelIds || channelIds.includes(channelId)) && // Filter by channelIds (if filter)
		(!notAuthorIds || !notAuthorIds.includes(authorId)) && // Filter by notAuthorIds (if filter)
		(!notChannelIds || !notChannelIds.includes(channelId)) && // Filter by notChannelIds (if filter)
		(!roleNames || hasCommonElements(roleNames, userRoles)) && // Filter by channelIds (if filter)
		(!notRoleNames || !hasCommonElements(notRoleNames, userRoles)) && // Filter by notChannelIds (if filter)
		((exactMatch && // Exact match
			((typeof exactMatch === 'string' && content === exactMatch) || // string
				(typeof exactMatch !== 'string' &&
					exactMatch.includes(content)))) || // array
			(regex && regex.test(content))) // Regex match
	)
}

/*
    Configuration of a keywords :

    // To match Text 
    regex // For regex... of course
    // For a text EXACT (if there is something before or after, doesn't match)
    // * String
    // * Array
    exactMatch 

    // Filter by authorIds (if filter)
    authorIds 
    notAuthorIds

    // Filter by channelIds (if filter)
    channelIds 
    notChannelIds 

    // Filter by roleNames (if filter)
    roleNames 
    notRoleNames 

    // Boolean, to stop checking for other keywords
    stopCheckingNextKeywords
    // Boolean, to delete the original message
    deleteOriginalMessage
    // Boolean, to reply the original message
    replayOriginalMessage

    // Could be
    // * String
    // * Function (message) => {} // message = full configuration of the message from discord
    // * Array => Random value from this array
    responses
*/

exports.keywordEngine = (keywordsAndResponses) => (message, client) => {
	const messageConfig = {
		authorId: message.author.id,
		channelId: message.channel.id,
		content: message.content,
		member: message.member,
	}

	keywordsAndResponses.every(async (config) => {
		if (isMatch(messageConfig, config)) {
			let calculatedResponse = ''
			switch (typeof config.responses) {
				case 'function':
					calculatedResponse = config.responses(
						message,
						client,
						config
					)
					break
				case 'string':
					calculatedResponse = config.responses
					break
				// Array
				default:
					calculatedResponse =
						config.responses[RollDice(config.responses.length) - 1]
					break
			}

			if (calculatedResponse) {
				if (config.deleteOriginalMessage) {
					if (config.replayOriginalMessage)
						await replyAndReplaceMessage(
							message,
							calculatedResponse
						)
					else
						await replaceMessage(
							message,
							client,
							calculatedResponse
						)
				} else {
					if (config.replayOriginalMessage)
						await replyMessage(message, calculatedResponse)
          await sendMessage(message, client, calculatedResponse)
				}

				return config.stopCheckingNextKeywords || false
      }
      
      if (config.deleteOriginalMessage) {
        deleteMessage(message)
      }
		}

		return true
	})
}

exports.isMatch = isMatch
