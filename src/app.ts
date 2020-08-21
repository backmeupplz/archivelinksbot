import * as dotenv from 'dotenv'
dotenv.config({ path: `${__dirname}/../.env` })

import { bot } from './helpers/bot'
import { checkTime } from './middlewares/checkTime'
import { sendHelp } from './commands/help'
import { handleText } from './helpers/handleText'

// Check time
bot.use(checkTime)
// Setup commands
bot.command(['help', 'start'], sendHelp)
bot.on('text', handleText)
// Start bot
bot.launch()

// Log success
console.info('Bot is up and running')
