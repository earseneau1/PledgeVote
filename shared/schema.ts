import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  uuid,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("member"),
  chapterId: varchar("chapter_id"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const voteTypeEnum = pgEnum('vote_type', ['yes_no', 'multiple_choice', 'ranked_choice']);
export const voteStatusEnum = pgEnum('vote_status', ['draft', 'active', 'closed']);

export const attendanceStatusEnum = pgEnum('attendance_status', ['scheduled', 'open', 'closed']);
export const attendanceResponseEnum = pgEnum('attendance_response', ['present', 'excused', 'absent']);

export const votes = pgTable("votes", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: voteTypeEnum("type").notNull(),
  status: voteStatusEnum("status").default('draft'),
  options: jsonb("options"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  eligibleVoters: jsonb("eligible_voters"),
  requiresQuorum: boolean("requires_quorum").default(false),
  quorumThreshold: integer("quorum_threshold"),
  allowRealTimeResults: boolean("allow_real_time_results").default(true),
  sendNotifications: boolean("send_notifications").default(true),
  chapterId: varchar("chapter_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userVotes = pgTable("user_votes", {
  id: uuid("id").primaryKey().defaultRandom(),
  voteId: uuid("vote_id").notNull().references(() => votes.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  choices: jsonb("choices").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

export const attendanceSessions = pgTable("attendance_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  meetingDate: timestamp("meeting_date").notNull(),
  status: attendanceStatusEnum("status").default('scheduled'),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  chapterId: varchar("chapter_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const attendanceRecords = pgTable("attendance_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").notNull().references(() => attendanceSessions.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  response: attendanceResponseEnum("response").default('present'),
  note: text("note"),
  recordedAt: timestamp("recorded_at").defaultNow(),
}, (table) => [
  uniqueIndex("attendance_session_user_idx").on(table.sessionId, table.userId),
]);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  votesCreated: many(votes),
  userVotes: many(userVotes),
}));

export const votesRelations = relations(votes, ({ one, many }) => ({
  creator: one(users, {
    fields: [votes.createdBy],
    references: [users.id],
  }),
  userVotes: many(userVotes),
}));

export const userVotesRelations = relations(userVotes, ({ one }) => ({
  vote: one(votes, {
    fields: [userVotes.voteId],
    references: [votes.id],
  }),
  user: one(users, {
    fields: [userVotes.userId],
    references: [users.id],
  }),
}));

export const attendanceSessionsRelations = relations(attendanceSessions, ({ one, many }) => ({
  creator: one(users, {
    fields: [attendanceSessions.createdBy],
    references: [users.id],
  }),
  records: many(attendanceRecords),
}));

export const attendanceRecordsRelations = relations(attendanceRecords, ({ one }) => ({
  session: one(attendanceSessions, {
    fields: [attendanceRecords.sessionId],
    references: [attendanceSessions.id],
  }),
  user: one(users, {
    fields: [attendanceRecords.userId],
    references: [users.id],
  }),
}));

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const insertVoteSchema = createInsertSchema(votes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserVoteSchema = createInsertSchema(userVotes).omit({
  id: true,
  submittedAt: true,
});

export const insertAttendanceSessionSchema = createInsertSchema(attendanceSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAttendanceRecordSchema = createInsertSchema(attendanceRecords).omit({
  id: true,
  recordedAt: true,
});

export type InsertVote = z.infer<typeof insertVoteSchema>;
export type Vote = typeof votes.$inferSelect;
export type InsertUserVote = z.infer<typeof insertUserVoteSchema>;
export type UserVote = typeof userVotes.$inferSelect;
export type InsertAttendanceSession = z.infer<typeof insertAttendanceSessionSchema>;
export type AttendanceSession = typeof attendanceSessions.$inferSelect;
export type InsertAttendanceRecord = z.infer<typeof insertAttendanceRecordSchema>;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
