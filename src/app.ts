import 'module-alias/register'
import 'source-map-support/register'

import { ignoreOld, sequentialize } from 'grammy-middlewares'
import { run } from '@grammyjs/runner'
import bot from '@/helpers/bot'
import handleLinks from '@/helpers/handleLinks'
import sendHelp from '@/helpers/sendHelp'

async function runApp() {
  console.log('Starting app...')
  bot
    // Middlewares
    .use(sequentialize())
    .use(ignoreOld())
  // Commands
  bot.command(['help', 'start'], sendHelp)
  // Handlers
  bot.on(['msg::text_link', 'msg::url'], handleLinks)
  // Errors
  bot.catch(console.error)
  // Start bot
  await bot.init()
  run(bot)
  console.info(`@${bot.botInfo.username} is up and running`)
}

void runApp()
