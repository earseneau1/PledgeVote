import {
  users,
  votes,
  userVotes,
  type User,
  type UpsertUser,
  type Vote,
  type InsertVote,
  type UserVote,
  type InsertUserVote,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Vote operations
  createVote(vote: InsertVote): Promise<Vote>;
  getVote(id: string): Promise<Vote | undefined>;
  getVoteWithDetails(id: string): Promise<any>;
  getActiveVotes(): Promise<Vote[]>;
  getVotesByUser(userId: string): Promise<Vote[]>;
  getVotesByStatus(status: 'draft' | 'active' | 'closed'): Promise<Vote[]>;
  updateVoteStatus(id: string, status: 'draft' | 'active' | 'closed'): Promise<Vote>;
  
  // User vote operations
  submitVote(userVote: InsertUserVote): Promise<UserVote>;
  getUserVote(voteId: string, userId: string): Promise<UserVote | undefined>;
  getVoteResults(voteId: string): Promise<any>;
  getVoteParticipation(voteId: string): Promise<any>;
  
  // User management
  getActiveMembers(): Promise<User[]>;
  updateUserRole(userId: string, role: string): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Vote operations
  async createVote(vote: InsertVote): Promise<Vote> {
    const [newVote] = await db
      .insert(votes)
      .values(vote)
      .returning();
    return newVote;
  }

  async getVote(id: string): Promise<Vote | undefined> {
    const [vote] = await db.select().from(votes).where(eq(votes.id, id));
    return vote;
  }

  async getVoteWithDetails(id: string): Promise<any> {
    const [voteWithCreator] = await db
      .select({
        vote: votes,
        creator: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(votes)
      .leftJoin(users, eq(votes.createdBy, users.id))
      .where(eq(votes.id, id));
    
    return voteWithCreator;
  }

  async getActiveVotes(): Promise<Vote[]> {
    return await db
      .select()
      .from(votes)
      .where(eq(votes.status, 'active'))
      .orderBy(desc(votes.createdAt));
  }

  async getVotesByUser(userId: string): Promise<Vote[]> {
    return await db
      .select()
      .from(votes)
      .where(eq(votes.createdBy, userId))
      .orderBy(desc(votes.createdAt));
  }

  async getVotesByStatus(status: 'draft' | 'active' | 'closed'): Promise<Vote[]> {
    return await db
      .select()
      .from(votes)
      .where(eq(votes.status, status))
      .orderBy(desc(votes.createdAt));
  }

  async updateVoteStatus(id: string, status: 'draft' | 'active' | 'closed'): Promise<Vote> {
    const [updatedVote] = await db
      .update(votes)
      .set({ status, updatedAt: new Date() })
      .where(eq(votes.id, id))
      .returning();
    return updatedVote;
  }

  // User vote operations
  async submitVote(userVote: InsertUserVote): Promise<UserVote> {
    const [newUserVote] = await db
      .insert(userVotes)
      .values(userVote)
      .returning();
    return newUserVote;
  }

  async getUserVote(voteId: string, userId: string): Promise<UserVote | undefined> {
    const [userVote] = await db
      .select()
      .from(userVotes)
      .where(and(eq(userVotes.voteId, voteId), eq(userVotes.userId, userId)));
    return userVote;
  }

  async getVoteResults(voteId: string): Promise<any> {
    const results = await db
      .select({
        choices: userVotes.choices,
        userId: userVotes.userId,
      })
      .from(userVotes)
      .where(eq(userVotes.voteId, voteId));
    
    return results;
  }

  async getVoteParticipation(voteId: string): Promise<any> {
    const [participation] = await db
      .select({
        totalVotes: sql<number>`count(*)`,
      })
      .from(userVotes)
      .where(eq(userVotes.voteId, voteId));
    
    const votersWithDetails = await db
      .select({
        userId: userVotes.userId,
        submittedAt: userVotes.submittedAt,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      })
      .from(userVotes)
      .leftJoin(users, eq(userVotes.userId, users.id))
      .where(eq(userVotes.voteId, voteId));
    
    return {
      totalVotes: participation?.totalVotes || 0,
      voters: votersWithDetails,
    };
  }

  // User management
  async getActiveMembers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.isActive, true))
      .orderBy(users.firstName);
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }
}

export const storage = new DatabaseStorage();
