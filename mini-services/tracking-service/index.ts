// Real-time Agent Tracking Service
// WebSocket server for live location tracking of field agents

import { createServer } from 'http'
import { Server } from 'socket.io'

const PORT = 3003

const httpServer = createServer()
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

// Store active agents
const activeAgents = new Map<string, {
  id: string
  name: string
  companyId: string
  branchId: string | null
  location: {
    latitude: number
    longitude: number
    accuracy: number | null
    speed: number | null
    battery: number | null
  }
  lastUpdate: Date
  isOnline: boolean
}>()

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`)

  // Agent joins with their info
  socket.on('agent:join', (data: {
    id: string
    name: string
    companyId: string
    branchId: string | null
  }) => {
    socket.join(`company:${data.companyId}`)
    if (data.branchId) {
      socket.join(`branch:${data.branchId}`)
    }
    socket.join(`agent:${data.id}`)
    
    // Initialize agent if not exists
    if (!activeAgents.has(data.id)) {
      activeAgents.set(data.id, {
        id: data.id,
        name: data.name,
        companyId: data.companyId,
        branchId: data.branchId,
        location: { latitude: 0, longitude: 0, accuracy: null, speed: null, battery: null },
        lastUpdate: new Date(),
        isOnline: true
      })
    } else {
      // Mark as online
      const agent = activeAgents.get(data.id)!
      agent.isOnline = true
      agent.lastUpdate = new Date()
    }

    // Notify managers
    io.to(`company:${data.companyId}`).emit('agent:online', { agentId: data.id })
    console.log(`Agent ${data.name} (${data.id}) joined`)
  })

  // Agent updates location
  socket.on('agent:location', (data: {
    agentId: string
    latitude: number
    longitude: number
    accuracy?: number
    speed?: number
    battery?: number
  }) => {
    const agent = activeAgents.get(data.agentId)
    if (agent) {
      agent.location = {
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy || null,
        speed: data.speed || null,
        battery: data.battery || null
      }
      agent.lastUpdate = new Date()
      agent.isOnline = true

      // Broadcast to company and branch
      io.to(`company:${agent.companyId}`).emit('agent:location:update', {
        agentId: data.agentId,
        location: agent.location,
        lastUpdate: agent.lastUpdate
      })

      if (agent.branchId) {
        io.to(`branch:${agent.branchId}`).emit('agent:location:update', {
          agentId: data.agentId,
          location: agent.location,
          lastUpdate: agent.lastUpdate
        })
      }
    }
  })

  // Manager requests all agents in company/branch
  socket.on('manager:subscribe', (data: {
    companyId: string
    branchId?: string
    userId: string
  }) => {
    socket.join(`company:${data.companyId}`)
    if (data.branchId) {
      socket.join(`branch:${data.branchId}`)
    }

    // Send current agents
    const agents = Array.from(activeAgents.values()).filter(a => {
      if (a.companyId !== data.companyId) return false
      if (data.branchId && a.branchId !== data.branchId) return false
      return true
    })

    socket.emit('agents:list', agents)
    console.log(`Manager ${data.userId} subscribed to company ${data.companyId}`)
  })

  // Get single agent location
  socket.on('agent:get', (data: { agentId: string }, callback: (agent: typeof activeAgents extends Map<string, infer T> ? T : never) => void) => {
    const agent = activeAgents.get(data.agentId)
    callback(agent)
  })

  // Agent goes offline
  socket.on('agent:leave', (data: { agentId: string }) => {
    const agent = activeAgents.get(data.agentId)
    if (agent) {
      agent.isOnline = false
      agent.lastUpdate = new Date()
      io.to(`company:${agent.companyId}`).emit('agent:offline', { agentId: data.agentId })
      console.log(`Agent ${data.agentId} went offline`)
    }
  })

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`)
    // Find and mark agent as offline if this was an agent connection
    activeAgents.forEach((agent, agentId) => {
      if (socket.rooms.has(`agent:${agentId}`)) {
        agent.isOnline = false
        agent.lastUpdate = new Date()
        io.to(`company:${agent.companyId}`).emit('agent:offline', { agentId })
      }
    })
  })
})

// Cleanup inactive agents every 5 minutes
setInterval(() => {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
  activeAgents.forEach((agent, agentId) => {
    if (agent.lastUpdate < fiveMinutesAgo) {
      agent.isOnline = false
    }
  })
}, 5 * 60 * 1000)

httpServer.listen(PORT, () => {
  console.log(`🚀 Agent Tracking Service running on port ${PORT}`)
  console.log(`📡 WebSocket ready for connections`)
})
