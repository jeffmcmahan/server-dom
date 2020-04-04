// This is quote obviously a very rough benchmark.

import cheerio from 'cheerio'
import {dom} from '../main.mjs'
import {readFileSync} from 'fs'

const page = readFileSync('index.html')

let $ = cheerio.load('<h2 class="title">Hello world</h2>')
$('.title').addClass('welcome')
$.html()

console.time('cheerio')
cheerio.load(page)
console.timeEnd('cheerio')

let fragment = dom`<h2 class="title">Hello world</h2>`
fragment.querySelector('.title').classList.add('welcome')
fragment.toString()

console.time('server-dom')
dom`${page}`
console.timeEnd('server-dom')