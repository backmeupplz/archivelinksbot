import { Context } from 'telegraf'
import axios from 'axios'

export async function handleText(ctx: Context) {
  for (const entity of ctx.message?.entities || []) {
    if (entity.url || entity.type === 'url') {
      await ctx.replyWithChatAction('typing')
      const url =
        entity.url || ctx.message.text.substr(entity.offset, entity.length)
      try {
        const response = (
          await axios.post('https://pragma.archivelab.org', {
            url,
          })
        ).data
        await ctx.reply(`https://web.archive.org${response.wayback_id}`, {
          reply_to_message_id: ctx.message.message_id,
          disable_web_page_preview: true,
        })
      } catch (err) {
        console.log(err.message)
      }
    }
  }
}
