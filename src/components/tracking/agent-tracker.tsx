'use client'

import { useState, useEffect, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Battery, Wifi, WifiOff, Clock, Navigation } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'

interface AgentLocation {
  agentId: string
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
}

export function AgentTracker() {
  const { user } = useAuthStore()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [agents, setAgents] = useState<AgentLocation[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<AgentLocation | null>(null)

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('/?XTransformPort=3003', {
      transports: ['websocket', 'polling'],
    })

    newSocket.on('connect', () => {
      console.log('Connected to tracking service')
      setIsConnected(true)
      
      // Subscribe as manager
      if (user?.companyId) {
        newSocket.emit('manager:subscribe', {
          companyId: user.companyId,
          branchId: user.branchId,
          userId: user.id,
        })
      }
    })

    newSocket.on('disconnect', () => {
      console.log('Disconnected from tracking service')
      setIsConnected(false)
    })

    newSocket.on('agents:list', (agentList: AgentLocation[]) => {
      setAgents(agentList)
    })

    newSocket.on('agent:location:update', (data: { agentId: string; location: any; lastUpdate: Date }) => {
      setAgents(prev => prev.map(agent => 
        agent.agentId === data.agentId 
          ? { ...agent, location: data.location, lastUpdate: data.lastUpdate, isOnline: true }
          : agent
      ))
    })

    newSocket.on('agent:online', (data: { agentId: string }) => {
      setAgents(prev => prev.map(agent => 
        agent.agentId === data.agentId 
          ? { ...agent, isOnline: true }
          : agent
      ))
    })

    newSocket.on('agent:offline', (data: { agentId: string }) => {
      setAgents(prev => prev.map(agent => 
        agent.agentId === data.agentId 
          ? { ...agent, isOnline: false }
          : agent
      ))
    })

    // Use a ref or state initializer pattern instead
    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.companyId, user?.branchId, user?.id])

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatLocation = (lat: number, lng: number) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Agent Tracking / تتبع المناديب</h2>
          <p className="text-muted-foreground">Real-time location monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Badge variant="default" className="bg-green-500">
              <Wifi className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          ) : (
            <Badge variant="secondary">
              <WifiOff className="h-3 w-3 mr-1" />
              Disconnected
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Agents List */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Agents / المناديب</CardTitle>
              <CardDescription>
                {agents.filter(a => a.isOnline).length} online of {agents.length} total
              </CardDescription>
            </CardHeader>
            <CardContent>
              {agents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No agents tracked</p>
                  <p className="text-sm">Agents will appear here when they start tracking</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {agents.map(agent => (
                    <div
                      key={agent.agentId}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedAgent?.agentId === agent.agentId ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                      }`}
                      onClick={() => setSelectedAgent(agent)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${agent.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                          <span className="font-medium">{agent.name}</span>
                        </div>
                        {agent.location.battery !== null && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Battery className="h-3 w-3" />
                            {Math.round(agent.location.battery)}%
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Last update: {formatTime(agent.lastUpdate)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Map Placeholder / Agent Details */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedAgent ? selectedAgent.name : 'Select an Agent'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedAgent ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <Navigation className="h-12 w-12 mb-4 opacity-50" />
                  <p>Select an agent to view their location</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Location Display */}
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="font-medium">Current Location</span>
                    </div>
                    <p className="text-lg font-mono">
                      {formatLocation(selectedAgent.location.latitude, selectedAgent.location.longitude)}
                    </p>
                    {selectedAgent.location.accuracy && (
                      <p className="text-sm text-muted-foreground">
                        Accuracy: ±{Math.round(selectedAgent.location.accuracy)}m
                      </p>
                    )}
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Last Update</span>
                      </div>
                      <p className="font-medium">{formatTime(selectedAgent.lastUpdate)}</p>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Battery className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Battery</span>
                      </div>
                      <p className="font-medium">
                        {selectedAgent.location.battery ? `${Math.round(selectedAgent.location.battery)}%` : 'N/A'}
                      </p>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Navigation className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Speed</span>
                      </div>
                      <p className="font-medium">
                        {selectedAgent.location.speed ? `${Math.round(selectedAgent.location.speed)} km/h` : 'Stationary'}
                      </p>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Wifi className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Status</span>
                      </div>
                      <Badge variant={selectedAgent.isOnline ? 'default' : 'secondary'}>
                        {selectedAgent.isOnline ? 'Online' : 'Offline'}
                      </Badge>
                    </div>
                  </div>

                  {/* Map Placeholder */}
                  <div className="bg-muted rounded-lg h-48 flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Map view would display here</p>
                      <p className="text-xs">Integrate with Google Maps or similar</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
