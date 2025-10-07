import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { NavigationHeader } from "@/components/navigation-header";
import { VoteCard } from "@/components/vote-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Vote, TrendingUp, Users, Clock, Plus, CalendarCheck } from "lucide-react";
import type { Vote as VoteType, User, AttendanceSession } from "@shared/schema";

type AttendanceWithCreator = AttendanceSession & {
  creator?: Pick<User, "firstName" | "lastName"> | null;
};
import { AttendanceCard } from "@/components/attendance-card";

export default function Home() {
  const [votes, setVotes] = useState<VoteType[]>([]);

  const { data: activeVotes, isLoading: votesLoading } = useQuery<VoteType[]>({
    queryKey: ['/api/votes/active'],
  });

  const { data: activeMembers } = useQuery<User[]>({
    queryKey: ['/api/users/active'],
  });

  const { data: openAttendance } = useQuery<AttendanceWithCreator[]>({
    queryKey: ['/api/attendance/status/open'],
  });

  // WebSocket for real-time updates
  useWebSocket((message) => {
    if (message.type === 'vote_created' || message.type === 'vote_status_changed') {
      // Refetch active votes when there are updates
      window.location.reload();
    }
  });

  useEffect(() => {
    if (activeVotes) {
      setVotes(activeVotes);
    }
  }, [activeVotes]);

  const activeMemberCount = activeMembers?.length || 0;
  const activeVoteCount = votes.length;
  const openAttendanceCount = openAttendance?.length ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Chapter Voting Dashboard</h2>
              <p className="text-muted-foreground">Manage and participate in chapter decisions</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-3">
                <Users className="text-primary" size={20} />
                <div>
                  <p className="text-xs text-muted-foreground">Active Members</p>
                  <p className="text-lg font-semibold text-foreground" data-testid="text-active-members">{activeMemberCount}</p>
                </div>
              </div>
              <div className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-3">
                <Vote className="text-success" size={20} />
                <div>
                  <p className="text-xs text-muted-foreground">Active Votes</p>
                  <p className="text-lg font-semibold text-foreground" data-testid="text-active-votes">{activeVoteCount}</p>
                </div>
              </div>
              <div className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-3">
                <CalendarCheck className="text-primary" size={20} />
                <div>
                  <p className="text-xs text-muted-foreground">Open Attendance</p>
                  <p className="text-lg font-semibold text-foreground" data-testid="text-open-attendance">{openAttendanceCount}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Active Votes Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-foreground">Active Votes</h3>
            <Link href="/create-vote">
              <Button className="md:hidden bg-primary text-primary-foreground" data-testid="button-new-vote-mobile">
                <Plus size={16} className="mr-2" />
                New Vote
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {votesLoading ? (
              <div className="col-span-full flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading active votes...</p>
                </div>
              </div>
            ) : votes.length > 0 ? (
              <>
                {votes.map((vote) => (
                  <VoteCard key={vote.id} vote={vote} />
                ))}
                
                {/* Create New Vote Card */}
                <Link href="/create-vote">
                  <div className="bg-card border-2 border-dashed border-border rounded-lg shadow-sm p-8 flex flex-col items-center justify-center text-center hover:border-primary transition-colors cursor-pointer hover-lift min-h-[300px]" data-testid="card-create-vote">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                      <Plus className="text-primary" size={32} />
                    </div>
                    <h4 className="text-lg font-semibold text-foreground mb-2">Create New Vote</h4>
                    <p className="text-sm text-muted-foreground max-w-xs">Start a new voting session on chapter matters and organizational decisions</p>
                  </div>
                </Link>
              </>
            ) : (
              <div className="col-span-full">
                <Card className="text-center py-12">
                  <CardContent>
                    <Vote className="mx-auto mb-4 text-muted-foreground" size={48} />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Active Votes</h3>
                    <p className="text-muted-foreground mb-4">There are currently no active voting sessions.</p>
                    <Link href="/create-vote">
                      <Button className="bg-primary text-primary-foreground" data-testid="button-create-first-vote">
                        Create Your First Vote
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </section>

        {/* Attendance Highlight */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-foreground">Attendance Sessions</h3>
            <Link href="/attendance">
              <Button variant="outline" className="hidden md:inline-flex" data-testid="button-view-attendance">
                Manage Attendance
              </Button>
            </Link>
          </div>

          {openAttendance && openAttendance.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {openAttendance.slice(0, 2).map((session) => (
                <AttendanceCard key={session.id} session={session} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center space-y-3">
                <CalendarCheck className="mx-auto text-muted-foreground" size={36} />
                <h4 className="text-lg font-semibold text-foreground">No open attendance sessions</h4>
                <p className="text-sm text-muted-foreground">Keep members accountable by starting an attendance session.</p>
                <Link href="/create-attendance">
                  <Button data-testid="button-create-attendance">Create session</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Quick Stats */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold text-foreground mb-6">Chapter Voting Activity</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Vote className="text-primary" size={24} />
                  </div>
                </div>
                <p className="text-3xl font-bold text-foreground mb-1" data-testid="text-total-votes">0</p>
                <p className="text-sm text-muted-foreground">Total Votes This Semester</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                    <TrendingUp className="text-success" size={24} />
                  </div>
                </div>
                <p className="text-3xl font-bold text-foreground mb-1" data-testid="text-participation-rate">--</p>
                <p className="text-sm text-muted-foreground">Average Participation Rate</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                    <Users className="text-secondary" size={24} />
                  </div>
                </div>
                <p className="text-3xl font-bold text-foreground mb-1" data-testid="text-eligible-members">{activeMemberCount}</p>
                <p className="text-sm text-muted-foreground">Eligible Voting Members</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                    <Clock className="text-accent" size={24} />
                  </div>
                </div>
                <p className="text-3xl font-bold text-foreground mb-1" data-testid="text-pending-votes">{activeVoteCount}</p>
                <p className="text-sm text-muted-foreground">Pending Your Vote</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <CalendarCheck className="text-primary" size={24} />
                  </div>
                </div>
                <p className="text-3xl font-bold text-foreground mb-1" data-testid="text-open-attendance-summary">{openAttendanceCount}</p>
                <p className="text-sm text-muted-foreground">Open Attendance Sessions</p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
