import { Context } from 'telegraf'
import axios from 'axios'
const archive = require('archive.is')

export async function handleText(ctx: Context) {
  for (const entity of ctx.message?.entities || []) {
    if (entity.url || entity.type === 'url') {
      await ctx.replyWithChatAction('typing')
      const url =
        entity.url || ctx.message.text.substr(entity.offset, entity.length)
      try {
        await ctx.reply(await tryArchivingUrlWebArchive(url), {
          reply_to_message_id: ctx.message.message_id,
          disable_web_page_preview: true,
        })
      } catch (err) {
        if (err.message.includes('500')) {
          try {
            await ctx.reply(await tryArchivingUrlArchiveIs(url), {
              reply_to_message_id: ctx.message.message_id,
              disable_web_page_preview: true,
            })
          } catch (err) {
            console.log(url, err.message)
          }
        }
        console.log(url, err.message)
      }
    }
  }
}

async function tryArchivingUrlWebArchive(url: string) {
  const response = (
    await axios.post('https://pragma.archivelab.org', {
      url,
    })
  ).data
  return `https://web.archive.org${response.wayback_id}`
}

async function tryArchivingUrlArchiveIs(url: string) {
  const response = await archive.save(url)
  return response.shortUrl
}
