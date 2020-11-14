const moment = require('moment')

const { sendMessage, replaceMessage } = require('../utils/discord')
const { compareFolders } = require('../utils/files')

module.exports = [
	{
		exactMatch: 'ping',
    	documentationShort: `Sûrement une énigme ?`,
		responses: 'pong',
	},
	{
		regex: /^!as/i,
		regexDoc: '!as [commande]',
		documentationShort: `Affiche un message au nom du bot`,
		roleNames: ['Admins', 'Techniques'],
		responses: (message) => message.content.substring(4),
		deleteOriginalMessage: true,
	},
	{
		exactMatch: ['mod', 'mode', '!mod', '!mode'],
		responses: () => {
			const { ARMA_FOLDER, MODS } = process.env
			if (ARMA_FOLDER && MODS) {
				const mods = MODS.split(' ')
				const keyFolder = `${ARMA_FOLDER}Keys`

				const currentMod = mods.find((modFolder) =>
					compareFolders(`${ARMA_FOLDER}Keys${modFolder}`, keyFolder)
				)

				if (currentMod) return `Le serveur tourne en **${currentMod}**`
				return 'Impossible de détecter le mod'
			}
		},
		// channelIds: ['116601499177451524', '699236704791560192'],
	},
	{
		regex: /^!next ?([0-9]{1,2}\/[0-9]{1,2})? ?([0-9]{1,2}\/[0-9]{1,2})?/i,
		regexDoc: '!next [DD/MM] [DD/MM]',
		documentationShort: `Propose des dates avec réactions, allant de la première date à la deuxième, maximum de 14 jours
        
1ere date: Si non spécifié prend le lendemain
2ème date: Si non spécifié propose 7 jours suivant la première date`,
		roleNames: ['Admins', 'Techniques'],
		responses: async (message, client, config) => {
			const regExResult = config.regex.exec(message.content)

			// Max date
			const maxDays = 14

			const dateStart = regExResult[1]
				? moment(regExResult[1], 'DD/MM')
				: moment().add(1, 'd')
			const enhancedDateEnd = (date) =>
				date.isBefore(dateStart) ? date.add('y', 1) : date

			const dateEnd = regExResult[2]
				? moment.min(
						enhancedDateEnd(moment(regExResult[2], 'DD/MM')),
						moment(dateStart).add(maxDays / 2, 'd')
				  )
				: moment(dateStart).add(maxDays, 'd')

			const addDate = async (date, hours) =>
				sendMessage(
					message,
					client,
					`${date.format('dddd (D/M)')} ${hours}`
				).then((newSchecule) => {
					if (!newSchecule) return
					newSchecule = newSchecule[0]
					newSchecule
						.react('❓')
						.then(() =>
							newSchecule
								.react('✅')
								.then(() =>
									newSchecule
										.react('❌')
										.then(() => {})
										.catch(console.error)
								)
								.catch(console.error)
						)
						.catch(console.error)
				})

			for (
				let day = dateStart;
				day.isSameOrBefore(dateEnd);
				day.add(1, 'days')
			) {
        // We want to show in the right order
				// eslint-disable-next-line no-await-in-loop
				await addDate(day, 'soir')
			}
		},
		deleteOriginalMessage: true,
	},
]
