import {
  users,
  votes,
  userVotes,
  attendanceSessions,
  attendanceRecords,
  type User,
  type UpsertUser,
  type Vote,
  type InsertVote,
  type UserVote,
  type InsertUserVote,
  type AttendanceSession,
  type InsertAttendanceSession,
  type AttendanceRecord,
  type InsertAttendanceRecord,
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

  // Attendance operations
  createAttendanceSession(session: InsertAttendanceSession): Promise<AttendanceSession>;
  getAttendanceSession(id: string): Promise<AttendanceSession | undefined>;
  getAttendanceSessionWithDetails(id: string): Promise<any>;
  getAttendanceSessionsByStatus(status: 'scheduled' | 'open' | 'closed'): Promise<
    Array<{ session: AttendanceSession; creator: { id: string | null; firstName: string | null; lastName: string | null; email: string | null } | null }>
  >;
  updateAttendanceStatus(id: string, status: 'scheduled' | 'open' | 'closed'): Promise<AttendanceSession>;
  markAttendance(record: InsertAttendanceRecord): Promise<AttendanceRecord>;
  getAttendanceRecord(sessionId: string, userId: string): Promise<AttendanceRecord | undefined>;
  getAttendanceSummary(sessionId: string): Promise<{ counts: Record<string, number>; records: any[] }>;

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

  // Attendance operations
  async createAttendanceSession(session: InsertAttendanceSession): Promise<AttendanceSession> {
    const [newSession] = await db
      .insert(attendanceSessions)
      .values(session)
      .returning();
    return newSession;
  }

  async getAttendanceSession(id: string): Promise<AttendanceSession | undefined> {
    const [session] = await db
      .select()
      .from(attendanceSessions)
      .where(eq(attendanceSessions.id, id));
    return session;
  }

  async getAttendanceSessionWithDetails(id: string): Promise<any> {
    const [sessionWithCreator] = await db
      .select({
        session: attendanceSessions,
        creator: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(attendanceSessions)
      .leftJoin(users, eq(attendanceSessions.createdBy, users.id))
      .where(eq(attendanceSessions.id, id));

    return sessionWithCreator;
  }

  async getAttendanceSessionsByStatus(status: 'scheduled' | 'open' | 'closed') {
    return await db
      .select({
        session: attendanceSessions,
        creator: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(attendanceSessions)
      .leftJoin(users, eq(attendanceSessions.createdBy, users.id))
      .where(eq(attendanceSessions.status, status))
      .orderBy(desc(attendanceSessions.meetingDate));
  }

  async updateAttendanceStatus(id: string, status: 'scheduled' | 'open' | 'closed'): Promise<AttendanceSession> {
    const [updatedSession] = await db
      .update(attendanceSessions)
      .set({ status, updatedAt: new Date() })
      .where(eq(attendanceSessions.id, id))
      .returning();
    return updatedSession;
  }

  async markAttendance(record: InsertAttendanceRecord): Promise<AttendanceRecord> {
    const [attendance] = await db
      .insert(attendanceRecords)
      .values(record)
      .onConflictDoUpdate({
        target: [attendanceRecords.sessionId, attendanceRecords.userId],
        set: {
          response: record.response,
          note: record.note,
          recordedAt: new Date(),
        },
      })
      .returning();

    return attendance;
  }

  async getAttendanceRecord(sessionId: string, userId: string): Promise<AttendanceRecord | undefined> {
    const [attendance] = await db
      .select()
      .from(attendanceRecords)
      .where(and(eq(attendanceRecords.sessionId, sessionId), eq(attendanceRecords.userId, userId)));
    return attendance;
  }

  async getAttendanceSummary(sessionId: string): Promise<{ counts: Record<string, number>; records: any[] }> {
    const records = await db
      .select({
        id: attendanceRecords.id,
        userId: attendanceRecords.userId,
        response: attendanceRecords.response,
        note: attendanceRecords.note,
        recordedAt: attendanceRecords.recordedAt,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      })
      .from(attendanceRecords)
      .leftJoin(users, eq(attendanceRecords.userId, users.id))
      .where(eq(attendanceRecords.sessionId, sessionId));

    const counts = records.reduce(
      (acc, record) => {
        const status = (record.response ?? 'present') as 'present' | 'excused' | 'absent';
        acc[status] = (acc[status] || 0) + 1;
        acc.total = (acc.total || 0) + 1;
        return acc;
      },
      { total: 0, present: 0, excused: 0, absent: 0 } as Record<string, number>,
    );

    return { counts, records };
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
