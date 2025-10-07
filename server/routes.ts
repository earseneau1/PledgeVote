import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertVoteSchema, insertUserVoteSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Vote management routes
  app.post('/api/votes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      const startDate = new Date(req.body.startDate);
      const endDate = new Date(req.body.endDate);

      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        return res.status(400).json({ message: "Invalid vote dates provided" });
      }

      const voteData = insertVoteSchema.parse({
        ...req.body,
        startDate,
        endDate,
        createdBy: userId,
      });
      
      const newVote = await storage.createVote(voteData);
      
      // Notify WebSocket clients of new vote
      broadcastToClients('vote_created', { vote: newVote });
      
      res.json(newVote);
    } catch (error) {
      console.error("Error creating vote:", error);
      res.status(500).json({ message: "Failed to create vote" });
    }
  });

  app.get('/api/votes/active', async (req, res) => {
    try {
      const activeVotes = await storage.getActiveVotes();
      res.json(activeVotes);
    } catch (error) {
      console.error("Error fetching active votes:", error);
      res.status(500).json({ message: "Failed to fetch active votes" });
    }
  });

  app.get('/api/votes/:id', async (req, res) => {
    try {
      const voteDetails = await storage.getVoteWithDetails(req.params.id);
      if (!voteDetails) {
        return res.status(404).json({ message: "Vote not found" });
      }
      res.json(voteDetails);
    } catch (error) {
      console.error("Error fetching vote details:", error);
      res.status(500).json({ message: "Failed to fetch vote details" });
    }
  });

  app.patch('/api/votes/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const { status } = req.body;
      const updatedVote = await storage.updateVoteStatus(req.params.id, status);
      
      // Notify WebSocket clients of status change
      broadcastToClients('vote_status_changed', { vote: updatedVote });
      
      res.json(updatedVote);
    } catch (error) {
      console.error("Error updating vote status:", error);
      res.status(500).json({ message: "Failed to update vote status" });
    }
  });

  // User vote routes
  app.post('/api/votes/:id/vote', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const voteId = req.params.id;
      
      // Check if user has already voted
      const existingVote = await storage.getUserVote(voteId, userId);
      if (existingVote) {
        return res.status(400).json({ message: "You have already voted on this item" });
      }
      
      const userVoteData = insertUserVoteSchema.parse({
        voteId,
        userId,
        choices: req.body.choices,
      });
      
      const userVote = await storage.submitVote(userVoteData);
      
      // Notify WebSocket clients of new vote submission
      broadcastToClients('vote_submitted', { 
        voteId, 
        userId,
        timestamp: new Date().toISOString()
      });
      
      res.json(userVote);
    } catch (error) {
      console.error("Error submitting vote:", error);
      res.status(500).json({ message: "Failed to submit vote" });
    }
  });

  app.get('/api/votes/:id/my-vote', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userVote = await storage.getUserVote(req.params.id, userId);
      res.json(userVote);
    } catch (error) {
      console.error("Error fetching user vote:", error);
      res.status(500).json({ message: "Failed to fetch user vote" });
    }
  });

  app.get('/api/votes/:id/results', async (req, res) => {
    try {
      const results = await storage.getVoteResults(req.params.id);
      res.json(results);
    } catch (error) {
      console.error("Error fetching vote results:", error);
      res.status(500).json({ message: "Failed to fetch vote results" });
    }
  });

  app.get('/api/votes/:id/participation', async (req, res) => {
    try {
      const participation = await storage.getVoteParticipation(req.params.id);
      res.json(participation);
    } catch (error) {
      console.error("Error fetching vote participation:", error);
      res.status(500).json({ message: "Failed to fetch vote participation" });
    }
  });

  // Archive and management routes
  app.get('/api/votes/status/:status', async (req, res) => {
    try {
      const { status } = req.params;
      const votes = await storage.getVotesByStatus(status as 'draft' | 'active' | 'closed');
      res.json(votes);
    } catch (error) {
      console.error("Error fetching votes by status:", error);
      res.status(500).json({ message: "Failed to fetch votes" });
    }
  });

  app.get('/api/users/active', async (req, res) => {
    try {
      const activeMembers = await storage.getActiveMembers();
      res.json(activeMembers);
    } catch (error) {
      console.error("Error fetching active members:", error);
      res.status(500).json({ message: "Failed to fetch active members" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server setup
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const clients = new Set<WebSocket>();

  function broadcastToClients(type: string, data: any) {
    const message = JSON.stringify({ type, data });
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('WebSocket client connected');

    ws.on('close', () => {
      clients.delete(ws);
      console.log('WebSocket client disconnected');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });

  return httpServer;
}
