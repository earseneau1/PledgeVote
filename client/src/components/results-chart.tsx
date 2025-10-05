import { PieChart, Pie, Cell, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

interface ResultsChartProps {
  vote: any;
  results: any[];
}

export function ResultsChart({ vote, results }: ResultsChartProps) {
  if (!results || results.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No votes cast yet</p>
      </div>
    );
  }

  const COLORS = ['hsl(var(--success))', 'hsl(var(--destructive))', 'hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))'];

  if (vote.type === 'yes_no') {
    const yesVotes = results.filter((r: any) => r.choices?.answer === 'yes').length;
    const noVotes = results.filter((r: any) => r.choices?.answer === 'no').length;
    
    const data = [
      { name: 'Yes', value: yesVotes, color: COLORS[0] },
      { name: 'No', value: noVotes, color: COLORS[1] },
    ].filter(item => item.value > 0);

    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (vote.type === 'multiple_choice' && vote.options) {
    const data = vote.options.map((option: string, index: number) => ({
      name: option,
      votes: results.filter((r: any) => r.choices?.selectedOption === option).length,
      color: COLORS[index % COLORS.length],
    }));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12 }}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis />
          <Tooltip />
          <Bar dataKey="votes" fill="hsl(var(--primary))" />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (vote.type === 'ranked_choice') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Ranked choice visualization coming soon</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-muted-foreground">Unable to display results for this vote type</p>
    </div>
  );
}
