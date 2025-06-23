// tests/items.test.js
const request = require('supertest')
const express = require('express')

// 1) In-memory store for items
const memoryData = []

// 2) Mock fs.promises for the routes
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(() => Promise.resolve(JSON.stringify(memoryData))),
    writeFile: jest.fn((_, json) => {
      memoryData.splice(0, memoryData.length, ...JSON.parse(json))
      return Promise.resolve()
    })
  }
}))

// 3) Load the router *after* mocking
const itemsRouter = require('../routes/items')

let app

beforeEach(() => {
  // initialize memoryData for each test
  memoryData.length = 0
  memoryData.push(
    { id: 1, name: 'foo', category: 'A', price: 10 },
    { id: 2, name: 'bar', category: 'B', price: 20 },
    { id: 3, name: 'baz', category: 'A', price: 30 },
    { id: 4, name: 'qux', category: 'C', price: 40 }
  )

  // rebuild express app
  app = express()
  app.use(express.json())
  app.use('/api/items', itemsRouter)
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ error: err.message })
  })
})

describe('Items API', () => {
  it('should return all items when no query is provided', async () => {
    const res = await request(app).get('/api/items')
    expect(res.statusCode).toBe(200)
    expect(res.body.items).toHaveLength(4)
    expect(res.body.total).toBe(4)
  })

  it('should filter items by search term (case-insensitive)', async () => {
    const res = await request(app)
      .get('/api/items')
      .query({ q: 'BA' })
    expect(res.statusCode).toBe(200)
    expect(res.body.items.map(i => i.name).sort()).toEqual(['bar','baz'])
    expect(res.body.total).toBe(2)
  })

  it('should apply pagination correctly', async () => {
    const res = await request(app)
      .get('/api/items')
      .query({ page: 2, limit: 2 })
    expect(res.statusCode).toBe(200)
    expect(res.body.items.map(i => i.id)).toEqual([3,4])
    expect(res.body.total).toBe(4)
  })

  it('GET /api/items/:id should return an existing item', async () => {
    const res = await request(app).get('/api/items/2')
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ id:2, name:'bar', category:'B', price:20 })
  })

  it('GET /api/items/:id should return 404 for a missing item', async () => {
    const res = await request(app).get('/api/items/999')
    expect(res.statusCode).toBe(404)
    expect(res.body).toHaveProperty('error', 'Item not found')
  })

  it('POST /api/items should create a new item and persist it', async () => {
    const newItem = { name:'new', category:'X', price:55 }
    const res = await request(app).post('/api/items').send(newItem)
    expect(res.statusCode).toBe(201)
    expect(res.body).toMatchObject(newItem)
    expect(res.body).toHaveProperty('id')
    // memoryData was updated by our mock-writeFile
    expect(memoryData).toHaveLength(5)
    expect(memoryData[4]).toMatchObject(newItem)
  })

  it('POST /api/items should return 400 for invalid payload', async () => {
    const res = await request(app).post('/api/items').send({ foo:'bar' })
    expect(res.statusCode).toBe(400)
    expect(res.body).toHaveProperty('errors')
  })
})
