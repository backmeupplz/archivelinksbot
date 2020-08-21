import { Context } from 'telegraf'

export function sendHelp(ctx: Context) {
  return ctx.replyWithHTML(
    `Just send any link to this bot and it will save it to the web archive.`
  )
}
