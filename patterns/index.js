const { isMatch, keywordEngine } = require('../utils/keywordEngine');

const keywords = require('./keywords');
const screenshotsRoom = require('./screenshotsRoom');
const { hasCommonElements } = require('../utils/array');

const formatDoc = (config) => {
    const commandAsText = config.exactMatch || config.regexDoc || config.regex.toString()
    if(config.documentationShort) {
        return `**${commandAsText}** ==> ${config.documentationShort}`
    }    

    return `${commandAsText}`
}

const keywordsAndResponses = [
    {
        exactMatch: '!help',
        responses: ({ member }) => `Les commandes du bots : 
>>> ${keywordsAndResponses
    .filter(({ roleNames }) => !roleNames || hasCommonElements(roleNames, member.roles.map(({ name }) => name)))
    .map((config) => `${formatDoc(config)}`)
    .join('\n')}`,
    }
].concat(keywords)

module.exports = {
    keywordPatterns: keywordEngine(keywordsAndResponses),
    screenshotsRoom,
}
