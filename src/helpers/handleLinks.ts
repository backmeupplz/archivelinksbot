import { Context } from 'telegraf'
import axios from 'axios'

export async function handleLinks(ctx: Context) {
  const entities =
    ctx.update.message?.entities || ctx.update.message?.caption_entities || []
  for (const entity of entities) {
    if (entity.url || entity.type === 'url') {
      await ctx.replyWithChatAction('typing')
      let url =
        entity.url ||
        (ctx.message.text || ctx.message.caption).substr(
          entity.offset,
          entity.length
        )

      console.log('Saving:', url)

      try {
        const archiveUrl = await tryArchivingUrlWebArchive(url)
        if (!archiveUrl) {
          throw new Error('Could not get web archive to work')
        }
        await ctx.reply(`<a href="${archiveUrl}">${archiveUrl}</a>`, {
          reply_to_message_id: ctx.message.message_id,
          disable_web_page_preview: true,
          parse_mode: 'HTML',
        })
      } catch (err) {
        // Just a 504, page is still saved, saving just timed out
        if (err.message.includes('504')) {
          const archiveUrl = `https://web.archive.org/${url}`
          console.log('Got 504 but still returned the link', archiveUrl)
          await ctx.reply(`<a href="${archiveUrl}">${archiveUrl}</a>`, {
            reply_to_message_id: ctx.message.message_id,
            disable_web_page_preview: true,
            parse_mode: 'HTML',
          })
          return
        }
        console.log(`Error using web archive:`, url, err.message)
      }
    }
  }
}

async function tryArchivingUrlWebArchive(url: string) {
  // Checking if it's available already
  const avaliabilityResponse = (
    await axios.get(`https://archive.org/wayback/available?url=${url}`)
  ).data
  if (avaliabilityResponse?.archived_snapshots?.closest?.url) {
    console.log(
      `Got available snapshot from web archive:`,
      avaliabilityResponse.archived_snapshots.closest.url
    )
    return avaliabilityResponse.archived_snapshots.closest.url
  } else {
    console.log('No snapshot for url, trying to save', url)
  }
  // Archive if not available yet
  const response = (
    await axios.post('https://pragma.archivelab.org', {
      url,
    })
  ).data
  console.log(response)
  if (response && response.wayback_id) {
    console.log(
      'Created new snapshot on web archive:',
      `https://web.archive.org/${response.wayback_id}`
    )
    return `https://web.archive.org/${response.wayback_id}`
  }
  return undefined
}
