import { Context } from 'telegraf'
import axios from 'axios'
const archive = require('archive.is')

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

      // Pubmed articles retrieving hack
      if (
        url.includes('ncbi.nlm.nih.gov') &&
        !url.includes('pubmed.ncbi.nlm.nih.gov')
      ) {
        const articleId = await parsePubMed(url)
        if (articleId) {
          url = 'https://pubmed.ncbi.nlm.nih.gov/' + articleId
        } else {
          continue
        }
      }

      try {
        const archiveUrl = await tryArchivingUrlWebArchive(url)
        if (archiveUrl) {
          await ctx.reply(`<a href="${archiveUrl}">${archiveUrl}</a>`, {
            reply_to_message_id: ctx.message.message_id,
            disable_web_page_preview: true,
            parse_mode: 'HTML',
          })
        }
      } catch (err) {
        const nextArchiveUrl = await tryArchivingUrlArchiveIs(url)
        try {
          if (nextArchiveUrl) {
            await ctx.reply(
              `<a href="${nextArchiveUrl}">${nextArchiveUrl}</a>`,
              {
                reply_to_message_id: ctx.message.message_id,
                disable_web_page_preview: true,
                parse_mode: 'HTML',
              }
            )
          }
        } catch (err) {
          console.log(url, err.message)
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

  if (response && response.wayback_id) {
    return `https://web.archive.org/${response.wayback_id}`
  }
  return false
}

async function tryArchivingUrlArchiveIs(url: string) {
  const response = await archive.save(url)
  return response.shortUrl
}

async function parsePubMed(url: string) {
  const articleId = url.match('(PMC\\w+)')[0]
  const response = (
    await axios.get(
      'https://www.ncbi.nlm.nih.gov/pmc/utils/idconv/v1.0/?ids=' +
        articleId +
        '&format=json'
    )
  ).data

  if (response) {
    return response.records[0].pmid
  }
  return false
}
