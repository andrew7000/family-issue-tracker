import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import './App.css';

// Interface for issues
interface Issue {
  id: number;
  title: string;
  responsible: string[];
  observer: string;
  date: string;
  description?: string;
  severity?: string;
  hashtags?: string;
  rootCause?: string;
}

const allPeople: string[] = ['Andrew', 'Sarah', 'Alyssa', 'Sylvie', 'Xiaoping'];

interface IssueCount {
  name: string;
  count: number;
}

function getIssueCountsByPerson(issues: Issue[], people: string[]): IssueCount[] {
  return people.map((person: string) => ({
    name: person,
    count: issues.filter((issue: Issue) => issue.responsible.includes(person)).length
  }));
}

function App() {
  // Initialize issues from localStorage or empty array
  const [issues, setIssues] = useState<Issue[]>(() => {
    const savedIssues = localStorage.getItem('issues');
    return savedIssues ? JSON.parse(savedIssues) : [];
  });

  // Save issues to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('issues', JSON.stringify(issues));
  }, [issues]);

  // Add new issue function
  function addIssue(newIssue: Omit<Issue, 'id'>) {
    const nextId = issues.length > 0 ? Math.max(...issues.map(i => i.id)) + 1 : 1;
    setIssues([...issues, { ...newIssue, id: nextId }]);
  }

  // Edit issue function
  function updateIssue(updated: Issue) {
    setIssues(issues.map(i => (i.id === updated.id ? updated : i)));
  }

  // Delete issue function
  function deleteIssue(id: number) {
    setIssues(issues.filter(i => i.id !== id));
  }

  return (
    <Router>
      <div className="App">
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <ul style={{ display: 'flex', gap: '2rem', margin: 0, padding: 0, listStyle: 'none' }}>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/issues">Issues</Link></li>
            <li><Link to="/dashboard">Dashboard</Link></li>
          </ul>
          <SubmitNewIssueNavButton />
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/issues" element={<Issues issues={issues} deleteIssue={deleteIssue} />} />
          <Route path="/new-issue" element={<NewIssue addIssue={addIssue} />} />
          <Route path="/edit-issue/:id" element={<EditIssue issues={issues} updateIssue={updateIssue} />} />
          <Route path="/dashboard" element={<Dashboard issues={issues} />} />
        </Routes>
      </div>
    </Router>
  );
}

function SubmitNewIssueNavButton() {
  const navigate = useNavigate();
  return (
    <button
      className="util-btn"
      style={{ marginLeft: 'auto', background: '#a00', color: '#fff', borderColor: '#a00', fontSize: '1rem', padding: '0.5rem 1.5rem' }}
      onClick={() => navigate('/new-issue')}
    >
      New Issue
    </button>
  );
}

function Home() {
  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: 0 }}>
        <span className="page-title" style={{ marginBottom: 0 }}>Family Issue Log</span>
        <span className="home-stamp">Filed</span>
      </div>
      <div className="page-desc" style={{ paddingLeft: '2rem', paddingRight: '2rem' }}>
        Welcome to the Family Issue Log System.<br />
        <b>All issues must be logged.</b> <br />
        <span style={{ color: '#a00', fontWeight: 700 }}>Non-compliance will be noted.</span>
      </div>
      <div className="bureaucratic-box">
        <b>Notice:</b> This system is monitored for quality and compliance. <br />
        Please ensure all entries are complete and accurate. <br />
        <span style={{ fontFamily: 'monospace', fontSize: '0.95rem', color: '#a00' }}>
          [Form 1984-B | Dept. of Domestic Oversight]
        </span>
      </div>
    </div>
  );
}

function Issues({ issues, deleteIssue }: { issues: Issue[]; deleteIssue: (id: number) => void }) {
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [sortField, setSortField] = useState<keyof Issue>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterText, setFilterText] = useState('');
  const [filterPerson, setFilterPerson] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterObserver, setFilterObserver] = useState('');
  const navigate = useNavigate();
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const handleSort = (field: keyof Issue) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedIssues = issues
    .filter(issue => {
      const matchesText = issue.title.toLowerCase().includes(filterText.toLowerCase()) ||
                         issue.responsible.some(p => p.toLowerCase().includes(filterText.toLowerCase())) ||
                         issue.observer.toLowerCase().includes(filterText.toLowerCase());
      const matchesPerson = !filterPerson || 
                           issue.responsible.includes(filterPerson) || 
                           issue.observer === filterPerson;
      const matchesSeverity = !filterSeverity || (issue.severity === filterSeverity);
      const matchesObserver = !filterObserver || (issue.observer === filterObserver);
      return matchesText && matchesPerson && matchesSeverity && matchesObserver;
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      // Handle array, string, and number types safely
      if (Array.isArray(aValue) && Array.isArray(bValue)) {
        return sortDirection === 'asc'
          ? aValue.join(',').localeCompare(bValue.join(','))
          : bValue.join(',').localeCompare(aValue.join(','));
      }
      // If only one is an array, treat as string for comparison
      if (Array.isArray(aValue)) {
        return sortDirection === 'asc'
          ? aValue.join(',').localeCompare(String(bValue ?? ''))
          : String(bValue ?? '').localeCompare(aValue.join(','));
      }
      if (Array.isArray(bValue)) {
        return sortDirection === 'asc'
          ? String(aValue ?? '').localeCompare(bValue.join(','))
          : bValue.join(',').localeCompare(String(aValue ?? ''));
      }
      return sortDirection === 'asc'
        ? String(aValue ?? '').localeCompare(String(bValue ?? ''))
        : String(bValue ?? '').localeCompare(String(aValue ?? ''));
    });

  const uniqueSeverities = Array.from(new Set(issues.map(issue => issue.severity).filter(Boolean)));
  const uniqueObservers = Array.from(new Set(issues.map(issue => issue.observer)));

  return (
    <div style={{ padding: '2rem' }}>
      <div className="page-header" style={{ paddingTop: '1rem', paddingBottom: '0.5rem', marginBottom: 0 }}>
        <span className="page-title">Issues Log</span>
      </div>
      <div className="page-desc" style={{ paddingLeft: '2rem', paddingRight: '2rem', marginBottom: '0.5rem' }}>
        A comprehensive record of all family issues and their current status.
      </div>

      <div style={{ marginTop: '2rem', marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
        <input
          type="text"
          placeholder="Search issues..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          style={{
            padding: '0.5rem',
            borderRadius: '4px',
            border: '1px solid #ddd',
            flex: 1
          }}
        />
      </div>

      <div style={{ 
        background: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th 
                style={{ padding: '1rem', textAlign: 'left', cursor: 'pointer' }}
                onClick={() => handleSort('title')}
              >
                Title {sortField === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                style={{ padding: '1rem', textAlign: 'left', cursor: 'pointer' }}
                onClick={() => handleSort('date')}
              >
                Date {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                style={{ padding: '1rem', textAlign: 'left', cursor: 'pointer' }}
                onClick={() => handleSort('responsible')}
              >
                Responsible {sortField === 'responsible' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                style={{ padding: '1rem', textAlign: 'left', cursor: 'pointer' }}
                onClick={() => handleSort('observer')}
              >
                Reported By {sortField === 'observer' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                style={{ padding: '1rem', textAlign: 'left', cursor: 'pointer' }}
                onClick={() => handleSort('severity')}
              >
                Severity {sortField === 'severity' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
            </tr>
            <tr style={{ background: '#fafafa' }}>
              <th></th>
              <th></th>
              <th style={{ padding: '0.5rem' }}>
                <select
                  value={filterPerson}
                  onChange={e => setFilterPerson(e.target.value)}
                  style={{ width: '90%' }}
                >
                  <option value="">All</option>
                  {allPeople.map(person => (
                    <option key={person} value={person}>{person}</option>
                  ))}
                </select>
              </th>
              <th style={{ padding: '0.5rem' }}>
                <select
                  value={filterObserver}
                  onChange={e => setFilterObserver(e.target.value)}
                  style={{ width: '90%' }}
                >
                  <option value="">All</option>
                  {uniqueObservers.map(observer => (
                    <option key={observer} value={observer}>{observer}</option>
                  ))}
                </select>
              </th>
              <th style={{ padding: '0.5rem' }}>
                <select
                  value={filterSeverity}
                  onChange={e => setFilterSeverity(e.target.value)}
                  style={{ width: '90%' }}
                >
                  <option value="">All</option>
                  {uniqueSeverities.map(sev => (
                    <option key={sev} value={sev}>{sev}</option>
                  ))}
                </select>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedIssues.map(issue => (
              <tr 
                key={issue.id}
                onClick={() => setSelectedIssue(issue)}
                className="issue-row"
                style={{ 
                  cursor: 'pointer',
                  borderTop: '1px solid #eee'
                }}
              >
                <td style={{ padding: '1rem' }}>{issue.title}</td>
                <td style={{ padding: '1rem' }}>{issue.date}</td>
                <td style={{ padding: '1rem' }}>{issue.responsible.join(', ')}</td>
                <td style={{ padding: '1rem' }}>{issue.observer}</td>
                <td style={{ padding: '1rem' }}>{issue.severity ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedIssue && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            padding: '2rem',
            borderRadius: '8px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0 }}>{selectedIssue.title}</h2>
              <button 
                onClick={() => setSelectedIssue(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '0.5rem'
                }}
              >
                ×
              </button>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Date:</strong> {selectedIssue.date || 'N/A'}
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Responsible:</strong> {selectedIssue.responsible && selectedIssue.responsible.length > 0 ? selectedIssue.responsible.join(', ') : 'N/A'}
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Reported by:</strong> {selectedIssue.observer || 'N/A'}
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Description:</strong>
              <p>{selectedIssue.description || 'N/A'}</p>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Severity:</strong> {selectedIssue.severity || 'N/A'}
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Hashtags:</strong> {selectedIssue.hashtags || 'N/A'}
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Root Cause:</strong>
              <p>{selectedIssue.rootCause || 'N/A'}</p>
            </div>
            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button 
                className="util-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIssue(null);
                  navigate(`/edit-issue/${selectedIssue.id}`);
                }}
              >
                Edit Issue
              </button>
              <button
                className="util-btn"
                style={{ background: '#fff0f0', color: '#a00', borderColor: '#a00' }}
                onClick={() => setDeleteConfirmId(selectedIssue.id)}
              >
                Delete Issue
              </button>
              {deleteConfirmId === selectedIssue.id && (
                <div style={{ position: 'absolute', background: '#fff', border: '1px solid #a00', borderRadius: 6, padding: '1rem', zIndex: 10, left: '50%', transform: 'translateX(-50%)', minWidth: 180 }}>
                  <div style={{ marginBottom: 8 }}>Delete this issue?</div>
                  <button className="util-btn" style={{ background: '#a00', color: '#fff', marginRight: 8 }} onClick={() => { deleteIssue(selectedIssue.id); setDeleteConfirmId(null); setSelectedIssue(null); }}>Yes</button>
                  <button className="util-btn" style={{ background: '#eee', color: '#222' }} onClick={() => setDeleteConfirmId(null)}>No</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function NewIssue({ addIssue }: { addIssue: (newIssue: Omit<Issue, 'id'>) => void }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    observedAt: getTodayDate(),
    observer: '',
    responsible: [] as string[],
    severity: '2',
    hashtags: '',
    rootCause: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    if (e.target.name === 'responsible') {
      const select = e.target as HTMLSelectElement;
      const selectedOptions = Array.from(select.selectedOptions).map(option => option.value);
      setForm({ ...form, responsible: selectedOptions });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.description || !form.observer || form.responsible.length === 0) {
      setError('Please fill in all required fields.');
      return;
    }
    setError('');
    addIssue({
      title: form.title,
      description: form.description,
      date: form.observedAt,
      observer: form.observer,
      responsible: form.responsible,
      severity: form.severity,
      hashtags: form.hashtags,
      rootCause: form.rootCause
    });
    setSubmitted(true);
    setTimeout(() => {
      navigate('/issues');
    }, 1000);
    setForm({
      title: '',
      description: '',
      observedAt: getTodayDate(),
      observer: '',
      responsible: [],
      severity: '2',
      hashtags: '',
      rootCause: ''
    });
  }

  return (
    <div>
      <div className="page-header">
        <span className="page-title">Log New Issue</span>
      </div>
      <form className="new-issue-form" onSubmit={handleSubmit}>
        <label>
          <span>Title<span className="required-mark">*</span></span>
          <input name="title" value={form.title} onChange={handleChange} required maxLength={60} />
        </label>
        <label className="full-width">
          <span>Description<span className="required-mark">*</span></span>
          <textarea name="description" value={form.description} onChange={handleChange} required rows={2} />
        </label>
        <label>
          <span>Date Observed</span>
          <input type="date" name="observedAt" value={form.observedAt} onChange={handleChange} />
        </label>
        <label>
          <span>Observer<span className="required-mark">*</span></span>
          <select name="observer" value={form.observer} onChange={handleChange} required>
            <option value="">Select an observer</option>
            {allPeople.map(person => (
              <option key={person} value={person}>{person}</option>
            ))}
          </select>
        </label>
        <label className="full-width">
          <span>Responsible<span className="required-mark">*</span></span>
          <div className="pill-toggle-group pill-toggle-single-row">
            {allPeople.map(person => (
              <button
                type="button"
                key={person}
                className={`pill-toggle pill-toggle-small${form.responsible.includes(person) ? ' selected' : ''}`}
                onClick={() => {
                  const isSelected = form.responsible.includes(person);
                  const newResponsible = isSelected
                    ? form.responsible.filter(p => p !== person)
                    : [...form.responsible, person];
                  setForm({ ...form, responsible: newResponsible });
                }}
                aria-pressed={form.responsible.includes(person)}
              >
                {person}
              </button>
            ))}
          </div>
        </label>
        <label>
          <span>Severity</span>
          <select name="severity" value={form.severity} onChange={handleChange}>
            <option value="1">1 - Low</option>
            <option value="2">2 - Medium</option>
            <option value="3">3 - High</option>
          </select>
        </label>
        <label>
          <span>Hashtags</span>
          <input name="hashtags" value={form.hashtags} onChange={handleChange} placeholder="#kitchen, #cat, #behavior" />
        </label>
        <label className="full-width">
          <span>Root Cause Analysis</span>
          <textarea name="rootCause" value={form.rootCause} onChange={handleChange} rows={2} />
        </label>
        {error && <div className="form-error">{error}</div>}
        <div className="form-actions">
          <button className="util-btn" type="submit">Submit Issue</button>
        </div>
        {submitted && <div className="form-success">Issue logged! (Not yet saved to backend)</div>}
      </form>
    </div>
  );
}

function EditIssue({ issues, updateIssue }: { issues: Issue[]; updateIssue: (issue: Issue) => void }) {
  const { id } = useParams();
  const navigate = useNavigate();
  // Find the issue by id
  const issue = issues.find((iss) => String(iss.id) === String(id));
  const [form, setForm] = useState(() => issue ? {
    title: issue.title,
    description: issue.description || '',
    observedAt: issue.date || '',
    observer: issue.observer || '',
    responsible: issue.responsible || [],
    severity: issue.severity || '2',
    hashtags: issue.hashtags || '',
    rootCause: issue.rootCause || ''
  } : {
    title: '',
    description: '',
    observedAt: '',
    observer: '',
    responsible: [],
    severity: '2',
    hashtags: '',
    rootCause: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    if (e.target.name === 'responsible') {
      const select = e.target as HTMLSelectElement;
      const selectedOptions = Array.from(select.selectedOptions).map(option => option.value);
      setForm({ ...form, responsible: selectedOptions });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.description || !form.observer || form.responsible.length === 0) {
      setError('Please fill in all required fields.');
      return;
    }
    setError('');
    setSubmitted(true);
    updateIssue({
      id: issue!.id,
      title: form.title,
      description: form.description,
      date: form.observedAt,
      observer: form.observer,
      responsible: form.responsible,
      severity: form.severity,
      hashtags: form.hashtags,
      rootCause: form.rootCause
    });
    setTimeout(() => {
      navigate('/issues');
    }, 1000);
  }

  if (!issue) {
    return <div style={{ padding: '2rem' }}>Issue not found.</div>;
  }

  return (
    <div>
      <div className="page-header">
        <span className="page-title">Edit Issue</span>
      </div>
      <form className="new-issue-form" onSubmit={handleSubmit}>
        <label>
          <span>Title<span className="required-mark">*</span></span>
          <input name="title" value={form.title} onChange={handleChange} required maxLength={60} />
        </label>
        <label className="full-width">
          <span>Description<span className="required-mark">*</span></span>
          <textarea name="description" value={form.description} onChange={handleChange} required rows={2} />
        </label>
        <label>
          <span>Date Observed</span>
          <input type="date" name="observedAt" value={form.observedAt} onChange={handleChange} />
        </label>
        <label>
          <span>Observer<span className="required-mark">*</span></span>
          <select name="observer" value={form.observer} onChange={handleChange} required>
            <option value="">Select an observer</option>
            {allPeople.map(person => (
              <option key={person} value={person}>{person}</option>
            ))}
          </select>
        </label>
        <label className="full-width">
          <span>Responsible<span className="required-mark">*</span></span>
          <div className="pill-toggle-group pill-toggle-single-row">
            {allPeople.map(person => (
              <button
                type="button"
                key={person}
                className={`pill-toggle pill-toggle-small${form.responsible.includes(person) ? ' selected' : ''}`}
                onClick={() => {
                  const isSelected = form.responsible.includes(person);
                  const newResponsible = isSelected
                    ? form.responsible.filter(p => p !== person)
                    : [...form.responsible, person];
                  setForm({ ...form, responsible: newResponsible });
                }}
                aria-pressed={form.responsible.includes(person)}
              >
                {person}
              </button>
            ))}
          </div>
        </label>
        <label>
          <span>Severity</span>
          <select name="severity" value={form.severity} onChange={handleChange}>
            <option value="1">1 - Low</option>
            <option value="2">2 - Medium</option>
            <option value="3">3 - High</option>
          </select>
        </label>
        <label>
          <span>Hashtags</span>
          <input name="hashtags" value={form.hashtags} onChange={handleChange} placeholder="#kitchen, #cat, #behavior" />
        </label>
        <label className="full-width">
          <span>Root Cause Analysis</span>
          <textarea name="rootCause" value={form.rootCause} onChange={handleChange} rows={2} />
        </label>
        {error && <div className="form-error">{error}</div>}
        <div className="form-actions">
          <button className="util-btn" type="submit">Save Changes</button>
        </div>
        {submitted && <div className="form-success">Issue updated! (Not yet saved to backend)</div>}
      </form>
    </div>
  );
}

function Dashboard({ issues }: { issues: Issue[] }) {
  // Calculate statistics
  const totalIssues = issues.length;
  
  // Calculate severity percentages for levels 1-3
  const severityCounts = issues.reduce((acc, issue) => {
    const severity = issue.severity || 'Unspecified';
    acc[severity] = (acc[severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const severityPercentages = ['1', '2', '3'].map(level => ({
    level,
    count: severityCounts[level] || 0,
    percentage: Math.round(((severityCounts[level] || 0) / totalIssues) * 100)
  }));

  // Calculate issues by person with severity breakdown
  const issuesByPerson = allPeople.map(person => {
    const personIssues = issues.filter(issue => issue.responsible.includes(person));
    const total = personIssues.length;
    const severityBreakdown = personIssues.reduce((acc, issue) => {
      const severity = issue.severity || 'Unspecified';
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const high = severityBreakdown['3'] || 0;
    const medium = severityBreakdown['2'] || 0;
    return {
      name: person,
      total,
      highPct: total > 0 ? high / total : 0,
      highOrMedPct: total > 0 ? (high + medium) / total : 0,
      severityBreakdown: Object.entries(severityBreakdown).map(([severity, count]) => ({
        severity,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0
      }))
    };
  }).sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    if (b.highPct !== a.highPct) return b.highPct - a.highPct;
    if (b.highOrMedPct !== a.highOrMedPct) return b.highOrMedPct - a.highOrMedPct;
    return a.name.localeCompare(b.name);
  });

  // Find the maximum number of issues for scaling
  const maxIssues = Math.max(...issuesByPerson.map(p => p.total));

  // Calculate monthly trends
  const getMonthYear = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  const monthlyData = issues.reduce((acc, issue) => {
    const monthYear = getMonthYear(issue.date);
    if (!acc[monthYear]) {
      acc[monthYear] = {
        total: 0,
        bySeverity: {} as Record<string, number>
      };
    }
    acc[monthYear].total++;
    const severity = issue.severity || 'Unspecified';
    acc[monthYear].bySeverity[severity] = (acc[monthYear].bySeverity[severity] || 0) + 1;
    return acc;
  }, {} as Record<string, { total: number; bySeverity: Record<string, number> }>);

  // Sort months and get last 6 months
  const sortedMonths = Object.keys(monthlyData)
    .sort()
    .slice(-6);

  // Color scheme with high contrast orange-to-red gradient
  const colors = {
    high: '#d32f2f',    // Bright red
    medium: '#f57c00',  // Deep orange
    low: '#ffb74d'      // Light orange
  };

  return (
    <div>
      <div className="page-header">
        <span className="page-title">Dashboard</span>
      </div>
      <div className="page-desc">
        Overview of family issues and trends
      </div>

      <div className="dashboard-grid">
        {/* Summary Statistics */}
        <div className="dashboard-card" style={{ gridColumn: '1 / -1' }}>
          <h3>Summary</h3>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <div className="stat-item" style={{ flex: '0 0 auto' }}>
              <div className="stat-value" style={{ color: '#222' }}>{totalIssues}</div>
              <div className="stat-label">Total Issues</div>
            </div>
            <div style={{ flex: 1, display: 'flex', gap: '1rem', justifyContent: 'space-around' }}>
              {severityPercentages.map(({ level, percentage }) => (
                <div key={level} className="stat-item" style={{ flex: '1' }}>
                  <div className="stat-value" style={{
                    color:
                      level === '1' ? '#ffb74d' :
                      level === '2' ? '#f57c00' :
                      '#d32f2f'
                  }}>{percentage}%</div>
                  <div className="stat-label">
                    {level === '1' ? 'Low' :
                     level === '2' ? 'Medium' :
                     'High'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Issues by Person with Horizontal Stacked Bars */}
        <div className="dashboard-card" style={{ gridColumn: '1 / -1' }}>
          <h3>Issues by Family Member</h3>
          <div style={{ padding: '1rem' }}>
            {issuesByPerson.map(person => (
              <div key={person.name} style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ width: '120px', fontWeight: 'bold' }}>{person.name}</div>
                  <div style={{ flex: 1, height: '24px', background: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
                    {person.severityBreakdown.map(({ severity, count }) => {
                      const width = (count / maxIssues) * 100;
                      return (
                        <div
                          key={severity}
                          style={{
                            display: 'inline-block',
                            height: '100%',
                            width: `${width}%`,
                            background: 
                              severity === '3' ? colors.high :
                              severity === '2' ? colors.medium :
                              severity === '1' ? colors.low :
                              '#9e9e9e',
                            transition: 'width 0.3s ease'
                          }}
                          title={`${severity === '1' ? 'Low' : severity === '2' ? 'Medium' : 'High'}: ${count} issues`}
                        />
                      );
                    })}
                  </div>
                  <div style={{ width: '60px', textAlign: 'right', marginLeft: '1rem' }}>
                    {person.total}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="severity-legend" style={{ marginTop: '1rem' }}>
            <div className="severity-item">
              <div className="severity-dot" style={{ background: colors.high }}></div>
              <span>High</span>
            </div>
            <div className="severity-item">
              <div className="severity-dot" style={{ background: colors.medium }}></div>
              <span>Medium</span>
            </div>
            <div className="severity-item">
              <div className="severity-dot" style={{ background: colors.low }}></div>
              <span>Low</span>
            </div>
          </div>
        </div>

        {/* Monthly Trends */}
        <div className="dashboard-card" style={{ gridColumn: '1 / -1' }}>
          <h3>Monthly Trends (Last 6 Months)</h3>
          <div className="chart-container">
            <svg width="100%" height="300" viewBox="0 0 800 300">
              {/* X-axis labels */}
              {sortedMonths.map((month, i) => (
                <text
                  key={month}
                  x={100 + (i * 120)}
                  y={290}
                  textAnchor="middle"
                  fill="#666"
                  fontSize="12"
                >
                  {month}
                </text>
              ))}
              
              {/* Stacked bars */}
              {sortedMonths.map((month, i) => {
                const data = monthlyData[month];
                let yOffset = 250;
                const barWidth = 80;
                const x = 60 + (i * 120);

                return ['3', '2', '1'].map(severity => {
                  const count = data.bySeverity[severity] || 0;
                  const height = (count / data.total) * 200;
                  const y = yOffset - height;
                  yOffset -= height;

                  return (
                    <g key={`${month}-${severity}`}>
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={height}
                        fill={
                          severity === '3' ? colors.high :
                          severity === '2' ? colors.medium :
                          severity === '1' ? colors.low :
                          '#9e9e9e'
                        }
                        opacity={1}
                      />
                      {height > 20 && (
                        <text
                          x={x + barWidth/2}
                          y={y + height/2}
                          textAnchor="middle"
                          fill="#fff"
                          fontSize="12"
                          style={{ textShadow: '0 0 2px rgba(0,0,0,0.5)' }}
                        >
                          {count}
                        </text>
                      )}
                    </g>
                  );
                });
              })}
            </svg>
          </div>
          <div className="severity-legend">
            <div className="severity-item">
              <div className="severity-dot" style={{ background: colors.high }}></div>
              <span>High</span>
            </div>
            <div className="severity-item">
              <div className="severity-dot" style={{ background: colors.medium }}></div>
              <span>Medium</span>
            </div>
            <div className="severity-item">
              <div className="severity-dot" style={{ background: colors.low }}></div>
              <span>Low</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
