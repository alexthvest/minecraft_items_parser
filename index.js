const { JSDOM } = require('jsdom')
const request = require('request')
const lodash = require('lodash')
const fs = require('fs')
const config = require('./config')

const classTemplate = `
import { Item, ItemOptions } from './item.ts'

export class {{name}} extends Item {
  constructor(options: ItemOptions = {}) {
    super('{{id}}', options)
  }
}
`

request(config.URL,(err, response, body) => {
  const files = []
  let items = []
  
  const { document } = new JSDOM(body).window
  const table = document.querySelectorAll('#minecraft_items > tbody > tr:not(:first-child)')
  
  for (const row of table) {
    const info = row.querySelector(':nth-child(2)').textContent
    const match = info.match(/(.*)\((.*)\)/)
    
    if (!match) continue
    
    const name = match[1].replace(/\(.*\)/, '').replace(/\s/g, '')
    const id = match[2]
    
    items.push({ id, name })
  }
  
  items = lodash.uniqBy(items, 'id')
  for (const item of items) {
    const id = item.id.replace('minecraft:', '')
    const template = classTemplate.replace('{{name}}', item.name).replace('{{id}}', item.id).trim()
    
    fs.writeFileSync(`items/${id}.ts`, template.trim())
    files.push(`${id}.ts`)
  }
  
  const imports = files.map(f => `export * from './${f}'`)
  fs.writeFileSync('items/index.ts', imports.join('\n'))
})
