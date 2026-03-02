import { Subtitle } from '../types'

export function parseSRT(content: string): Subtitle[] {
  const subtitles: Subtitle[] = []
  const blocks = content.split('\n\n').filter(block => block.trim())

  blocks.forEach(block => {
    const lines = block.trim().split('\n')
    if (lines.length < 3) return

    const sequenceNumber = parseInt(lines[0], 10)
    const timecodes = lines[1].split(' --> ')

    if (timecodes.length !== 2) return

    const [startTime, endTime] = timecodes.map(t => t.trim())
    const text = lines.slice(2).join('\n')

    subtitles.push({
      sequence_number: sequenceNumber,
      start_time: startTime,
      end_time: endTime,
      original_text: text
    })
  })

  return subtitles
}

export function parseVTT(content: string): Subtitle[] {
  const subtitles: Subtitle[] = []
  const lines = content.split('\n').filter(line => line.trim())

  let i = 0
  if (lines[0].includes('WEBVTT')) {
    i = 1
  }

  let sequenceNumber = 1
  while (i < lines.length) {
    if (lines[i].includes('-->')) {
      const timecodes = lines[i].split('-->').map(t => t.trim())
      if (timecodes.length !== 2) {
        i++
        continue
      }

      const [startTime, endTime] = timecodes
      const textLines: string[] = []
      i++

      while (i < lines.length && lines[i].trim() && !lines[i].includes('-->')) {
        textLines.push(lines[i])
        i++
      }

      if (textLines.length > 0) {
        subtitles.push({
          sequence_number: sequenceNumber++,
          start_time: startTime,
          end_time: endTime,
          original_text: textLines.join('\n')
        })
      }
    }
    i++
  }

  return subtitles
}

export function generateSRT(subtitles: Subtitle[]): string {
  return subtitles
    .map(sub => {
      const tags = sub.tags ? `${sub.tags}\n` : ''
      return `${sub.sequence_number}\n${sub.start_time} --> ${sub.end_time}\n${tags}${sub.translated_text || sub.original_text}`
    })
    .join('\n\n') + '\n'
}

export function generateVTT(subtitles: Subtitle[]): string {
  const header = 'WEBVTT\n\n'
  const content = subtitles
    .map(sub => {
      const tags = sub.tags ? `${sub.tags}\n` : ''
      return `${sub.start_time} --> ${sub.end_time}\n${tags}${sub.translated_text || sub.original_text}`
    })
    .join('\n\n')
  return header + content + '\n'
}

export function detectFormat(content: string): 'srt' | 'vtt' {
  if (content.includes('WEBVTT')) return 'vtt'
  return 'srt'
}