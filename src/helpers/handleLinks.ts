import { Context } from 'grammy'
import axios from 'axios'

export default async function (ctx: Context) {
  const entities = ctx.msg?.entities || ctx.msg?.caption_entities || []
  const links = []
  for (const entity of entities) {
    if (entity.type === 'url' || (entity.type === 'text_link' && entity.url)) {
      await ctx.replyWithChatAction('typing')
      const url =
        entity.type === 'text_link'
          ? entity.url
          : (ctx.msg?.text || ctx.msg?.caption)?.substring(
              entity.offset,
              entity.offset + entity.length
            )
      if (!url) {
        continue
      }
      console.log('Saving:', url)

      try {
        const archiveUrl = await tryArchivingUrlWebArchive(url)
        if (!archiveUrl) {
          throw new Error('Could not get web archive to work')
        }
        links.push(`<a href="${archiveUrl}">Archived</a>`)
      } catch (err) {
        // Just a 504 or 502, page is still saved, saving just timed out
        if (
          err instanceof Error &&
          (err.message.includes('504') || err.message.includes('502'))
        ) {
          const archiveUrl = `https://web.archive.org/${url}`
          console.log('Got 504 or 502 but still returned the link', archiveUrl)

          links.push(`<a href="${archiveUrl}">Archived</a>`)
        } else {
          console.log(
            `Error using web archive:`,
            url,
            err instanceof Error ? err.message : err
          )
        }
      }
    }
  }
  if (links.length > 0) {
    await ctx.reply(links.join(', '), {
      reply_to_message_id: ctx.msg?.message_id,
      disable_web_page_preview: true,
      parse_mode: 'HTML',
    })
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
  if (response && response.wayback_id) {
    console.log(
      'Created new snapshot on web archive:',
      `https://web.archive.org/${response.wayback_id}`
    )
    return `https://web.archive.org/${response.wayback_id}`
  }
  return undefined
}
