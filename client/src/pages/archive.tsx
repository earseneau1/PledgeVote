import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { NavigationHeader } from "@/components/navigation-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Calendar, TrendingUp, Archive as ArchiveIcon, ExternalLink } from "lucide-react";
import type { Vote as VoteType } from "@shared/schema";

export default function Archive() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: closedVotes, isLoading } = useQuery<VoteType[]>({
    queryKey: ['/api/votes/status/closed'],
  });

  const filteredVotes = (closedVotes || []).filter((vote: VoteType) => {
    const matchesSearch = vote.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vote.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || vote.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <ArchiveIcon className="text-primary" size={32} />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Vote Archive</h1>
              <p className="text-muted-foreground">Historical record of all chapter votes</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Search votes by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-votes"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48" data-testid="select-status-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Archive List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading archived votes...</p>
            </div>
          </div>
        ) : filteredVotes.length > 0 ? (
          <div className="space-y-6">
            {filteredVotes.map((vote: any) => (
              <Card key={vote.id} className="hover-lift" data-testid={`card-archived-vote-${vote.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="bg-muted text-muted-foreground">
                          Closed
                        </Badge>
                        <Badge variant="secondary">
                          {vote.type === 'yes_no' ? 'Yes/No' : 
                           vote.type === 'multiple_choice' ? 'Multiple Choice' : 'Ranked Choice'}
                        </Badge>
                        {/* You could add a "Passed/Failed" badge here based on results */}
                      </div>
                      
                      <h3 className="text-lg font-semibold text-foreground mb-2" data-testid={`text-archived-vote-title-${vote.id}`}>
                        {vote.title}
                      </h3>
                      
                      <p className="text-sm text-muted-foreground mb-3">
                        {vote.description || 'No description provided'}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          Closed {new Date(vote.endDate).toLocaleDateString()}
                        </span>
                        <span>
                          Created by Admin {/* TODO: Show actual creator */}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2 ml-6">
                      <Link href={`/results/${vote.id}`}>
                        <Button variant="outline" size="sm" data-testid={`button-view-results-${vote.id}`}>
                          <TrendingUp size={16} className="mr-1" />
                          View Results
                        </Button>
                      </Link>
                      
                      {/* Placeholder for quick stats */}
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          Participation: --% {/* TODO: Calculate from results */}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <ArchiveIcon className="mx-auto mb-4 text-muted-foreground" size={48} />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchTerm ? 'No votes found' : 'No archived votes yet'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? 'Try adjusting your search terms or filters'
                  : 'Closed votes will appear here for your chapter records'
                }
              </p>
              {!searchTerm && (
                <Link href="/create-vote">
                  <Button className="bg-primary text-primary-foreground" data-testid="button-create-first-vote">
                    Create Your First Vote
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}

        {/* Stats Summary */}
        {filteredVotes.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp size={20} />
                Archive Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-foreground mb-1" data-testid="text-total-archived-votes">
                    {filteredVotes.length}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Archived Votes</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-foreground mb-1">
                    --% {/* TODO: Calculate average participation */}
                  </p>
                  <p className="text-sm text-muted-foreground">Average Participation</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-foreground mb-1">
                    This Semester
                  </p>
                  <p className="text-sm text-muted-foreground">Time Period</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
