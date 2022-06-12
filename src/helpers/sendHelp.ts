import { Context } from 'grammy'

export default function (ctx: Context) {
  return ctx.reply(
    'Just send any link to this bot and it will save it to the web archive.'
  )
}
