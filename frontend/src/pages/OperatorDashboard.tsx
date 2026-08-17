import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Users, BookOpen, ClipboardList, FileDown, AlertTriangle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppShell from '@/components/AppShell';

// Mock operator data
const teamMembers = [
  { id: '1', name: 'Alex M.', role: 'Line Cook', credentials: 2, lastActive: '2 days ago', completionRate: 85, status: 'active' },
  { id: '2', name: 'Sam K.', role: 'Prep Cook', credentials: 1, lastActive: '5 days ago', completionRate: 50, status: 'active' },
  { id: '3', name: 'Jordan P.', role: 'Sous Chef', credentials: 4, lastActive: 'Today', completionRate: 100, status: 'champion' },
  { id: '4', name: 'Riley T.', role: 'Server', credentials: 0, lastActive: '14 days ago', completionRate: 0, status: 'inactive' },
  { id: '5', name: 'Casey W.', role: 'Bartender', credentials: 1, lastActive: '3 days ago', completionRate: 33, status: 'active' },
];

const libraryPacks = [
  { id: 'lp1', name: 'Thermal Equipment', seats: 10, assigned: 7, tier: 'Small Dept' },
  { id: 'lp2', name: 'Beverage Mastery', seats: 5, assigned: 3, tier: 'Custom' },
];

const tabs = [
  { key: 'overview', label: 'Overview', icon: ClipboardList },
  { key: 'library', label: 'Library', icon: BookOpen },
  { key: 'roster', label: 'Roster', icon: Users },
  { key: 'compliance', label: 'Compliance', icon: FileDown },
];

const OperatorDashboard = () => {
  const { tab: urlTab } = useParams();
  const [activeTab, setActiveTab] = useState(urlTab || 'overview');

  const certified = teamMembers.filter(m => m.completionRate === 100).length;
  const inProgress = teamMembers.filter(m => m.completionRate > 0 && m.completionRate < 100).length;
  const notStarted = teamMembers.filter(m => m.completionRate === 0).length;

  return (
    <AppShell>
      {/* Header */}
      <header className="bg-background border-b border-border">
        <div className="max-w-[1200px] mx-auto px-5 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link to="/" className="text-xl font-bold font-display text-primary lowercase mb-1 block">quipp</Link>
              <h1 className="text-2xl font-bold font-display text-foreground uppercase">Operator Dashboard</h1>
              <p className="text-sm text-muted-foreground">The Drake Hotel · Toronto · LOC-001</p>
            </div>
            <div className="flex gap-2">
              <Button className="rounded-full" size="sm">Assign Course</Button>
              <Button variant="secondary" className="rounded-full" size="sm">Add Staff</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Nav */}
      <nav className="border-b border-border">
        <div className="max-w-[1200px] mx-auto px-5 flex gap-1 overflow-x-auto">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />{t.label}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="max-w-[1200px] mx-auto px-5 py-8">
        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div>
            {/* Traffic light numbers */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-card rounded-3xl p-6 text-center">
                <p className="text-4xl font-bold font-display text-success mb-1">{certified}</p>
                <p className="text-xs font-bold uppercase text-muted-foreground">Fully Certified</p>
              </div>
              <div className="bg-card rounded-3xl p-6 text-center">
                <p className="text-4xl font-bold font-display text-warning mb-1">{inProgress}</p>
                <p className="text-xs font-bold uppercase text-muted-foreground">In Progress</p>
              </div>
              <div className="bg-card rounded-3xl p-6 text-center">
                <p className="text-4xl font-bold font-display text-destructive mb-1">{notStarted}</p>
                <p className="text-xs font-bold uppercase text-muted-foreground">Not Started</p>
              </div>
              <div className="bg-card rounded-3xl p-6 text-center">
                <p className="text-4xl font-bold font-display text-foreground mb-1">{teamMembers.length}</p>
                <p className="text-xs font-bold uppercase text-muted-foreground">Total Staff</p>
              </div>
            </div>

            {/* Alerts */}
            <div className="bg-card rounded-3xl p-6 mb-8">
              <h3 className="text-lg font-bold font-display text-card-foreground mb-4 uppercase flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" /> Alerts
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-background">
                  <p className="text-sm text-foreground">Riley T. inactive 14+ days</p>
                  <Button size="sm" variant="secondary" className="rounded-full"><Send className="w-3 h-3" /> Remind</Button>
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-background">
                  <p className="text-sm text-foreground">Sam K. — Smart Ovens unstarted 7+ days</p>
                  <Button size="sm" variant="secondary" className="rounded-full"><Send className="w-3 h-3" /> Remind</Button>
                </div>
              </div>
            </div>

            {/* Recent completions */}
            <div className="bg-card rounded-3xl p-6">
              <h3 className="text-lg font-bold font-display text-card-foreground mb-4 uppercase">Recent Completions</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-background">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Jordan P.</p>
                    <p className="text-xs text-muted-foreground">Blast Chillers · IN · Today</p>
                  </div>
                  <span className="text-xs font-bold text-success">✓ Earned</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-background">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Alex M.</p>
                    <p className="text-xs text-muted-foreground">Smart Ovens · IN · 2 days ago</p>
                  </div>
                  <span className="text-xs font-bold text-success">✓ Earned</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LIBRARY */}
        {activeTab === 'library' && (
          <div>
            <h2 className="text-2xl font-bold font-display text-foreground mb-6 uppercase">Library Packs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {libraryPacks.map(pack => (
                <div key={pack.id} className="bg-card rounded-3xl p-6">
                  <h3 className="text-lg font-bold font-display text-card-foreground mb-2">{pack.name}</h3>
                  <p className="text-xs text-muted-foreground mb-4">{pack.tier}</p>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-muted-foreground">Seats</span>
                    <span className="text-sm font-bold text-foreground">{pack.assigned}/{pack.seats}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted mb-4">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${(pack.assigned / pack.seats) * 100}%` }} />
                  </div>
                  <Button className="w-full rounded-full" size="sm">Assign Seats</Button>
                </div>
              ))}
            </div>
            <div className="bg-card rounded-3xl p-6 text-center">
              <p className="text-sm text-muted-foreground mb-3">Need more seats or courses?</p>
              <Button variant="secondary" className="rounded-full">Add Library Pack</Button>
            </div>
          </div>
        )}

        {/* ROSTER */}
        {activeTab === 'roster' && (
          <div>
            <h2 className="text-2xl font-bold font-display text-foreground mb-6 uppercase">Team Roster</h2>
            <div className="bg-card rounded-3xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-bold uppercase text-muted-foreground px-6 py-4">Name</th>
                      <th className="text-left text-xs font-bold uppercase text-muted-foreground px-6 py-4">Role</th>
                      <th className="text-center text-xs font-bold uppercase text-muted-foreground px-6 py-4">Credentials</th>
                      <th className="text-center text-xs font-bold uppercase text-muted-foreground px-6 py-4">Completion</th>
                      <th className="text-right text-xs font-bold uppercase text-muted-foreground px-6 py-4">Last Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.map(m => (
                      <tr key={m.id} className={`border-b border-border last:border-0 ${m.status === 'champion' ? 'bg-primary/5' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-xs font-bold">{m.name.split(' ').map(w => w[0]).join('')}</div>
                            <span className="text-sm font-semibold text-card-foreground">{m.name}</span>
                            {m.status === 'champion' && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary text-primary-foreground">★</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{m.role}</td>
                        <td className="px-6 py-4 text-center text-sm font-bold text-card-foreground">{m.credentials}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-sm font-bold ${m.completionRate === 100 ? 'text-success' : m.completionRate > 0 ? 'text-warning' : 'text-destructive'}`}>{m.completionRate}%</span>
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-muted-foreground">{m.lastActive}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* COMPLIANCE */}
        {activeTab === 'compliance' && (
          <div>
            <h2 className="text-2xl font-bold font-display text-foreground mb-6 uppercase">Compliance Export</h2>
            <div className="bg-card rounded-3xl p-8 text-center">
              <FileDown className="w-16 h-16 mx-auto text-primary mb-4" />
              <h3 className="text-xl font-bold font-display text-card-foreground mb-2 uppercase">Generate Report</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                One-click PDF with location name, date range, all staff credentials, and QUIPP verification seal. For insurance, HR, and inspections.
              </p>
              <Button className="rounded-full h-14 px-10 font-bold">Download PDF</Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default OperatorDashboard;
