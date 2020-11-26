import Telegraf from 'telegraf'

export const bot = new Telegraf(process.env.TOKEN)

bot.catch(console.error)
