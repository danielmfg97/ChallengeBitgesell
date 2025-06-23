// tests/stats.test.js
const request = require('supertest')
const express = require('express')

// In-memory stats data and watch callback holder
const memoryStats = []
let watchCallback

// Mock fs and util.promisify
jest.mock('fs', () => {
  const EventEmitter = require('events')
  return {
    readFile: (path, encoding, cb) => {
      process.nextTick(() => {
        cb(null, JSON.stringify(memoryStats))
      })
    },
    watch: (path, cb) => {
      watchCallback = cb
      return new EventEmitter()
    }
  }
})
jest.mock('util', () => {
  const original = jest.requireActual('util')
  return {
    ...original,
    promisify: fn => (...args) =>
      new Promise((resolve, reject) => {
        fn(...args, (err, res) => {
          if (err) reject(err)
          else resolve(res)
        })
      })
  }
})

let app

beforeEach(() => {
  memoryStats.length = 0
  memoryStats.push({ id: 1 }, { id: 3 }, { id: 5 })

  jest.resetModules()
  const statsRouter = require('../routes/stats')

  app = express()
  app.use(express.json())
  app.use('/api/stats', statsRouter)
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ error: err.message })
  })
})

describe('Stats API', () => {
  it('should return count, avgId, and generatedAt', async () => {
    const res = await request(app).get('/api/stats')
    expect(res.statusCode).toBe(200)
    expect(res.body.count).toBe(3)
    expect(res.body.avgId).toBe((1 + 3 + 5) / 3)
    expect(typeof res.body.generatedAt).toBe('string')
  })

  it('should invalidate cache when stats change', async () => {
    const first = await request(app).get('/api/stats')
    expect(first.body.count).toBe(3)

    memoryStats.splice(0, memoryStats.length, { id: 10 }, { id: 20 })
    watchCallback()

    const second = await request(app).get('/api/stats')
    expect(second.body.count).toBe(2)
    expect(second.body.avgId).toBe((10 + 20) / 2)
  })  
})
