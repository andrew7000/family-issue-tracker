import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams, useLocation } from 'react-router-dom';
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

  // Export issues to JSON file
  function exportIssues() {
    const blob = new Blob([JSON.stringify(issues, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `family-issues-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Import issues from JSON file
  function importIssues(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedIssues = JSON.parse(e.target?.result as string);
        // Validate the data structure
        if (Array.isArray(importedIssues) && importedIssues.every(issue => 
          issue.id && issue.title && issue.date && issue.observer)) {
          setIssues(importedIssues);
          alert('Data imported successfully!');
        } else {
          alert('Invalid data format');
        }
      } catch (error) {
        alert('Error importing data');
      }
    };
    reader.readAsText(file);
    // Reset the file input
    event.target.value = '';
  }

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

        {/* Data Management Buttons at the bottom */}
        <div style={{ marginTop: '2rem', padding: '1rem 2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button 
            onClick={exportIssues}
            className="util-btn"
            style={{ fontSize: '0.9rem' }}
          >
            Export Data
          </button>
          <label className="util-btn" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
            Import Data
            <input
              type="file"
              accept=".json"
              onChange={importIssues}
              style={{ display: 'none' }}
            />
          </label>
        </div>
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
  const location = useLocation();

  // Initialize filterPerson from URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const personFilter = params.get('filterPerson');
    if (personFilter) {
      setFilterPerson(personFilter);
    }
  }, [location.search]);

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
                         issue.observer.toLowerCase().includes(filterText.toLowerCase()) ||
                         (issue.description && issue.description.toLowerCase().includes(filterText.toLowerCase())) ||
                         (issue.hashtags && issue.hashtags.toLowerCase().includes(filterText.toLowerCase()));
      const matchesPerson = !filterPerson || 
                           issue.responsible.includes(filterPerson);
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
        A comprehensive record of all family issues.
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
                style={{ padding: '1rem', textAlign: 'left', cursor: 'pointer', width: '20%' }}
                onClick={() => handleSort('title')}
              >
                Title {sortField === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                style={{ padding: '1rem', textAlign: 'left', cursor: 'pointer', width: '20%' }}
                onClick={() => handleSort('date')}
              >
                Date {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                style={{ padding: '1rem', textAlign: 'left', cursor: 'pointer', width: '20%' }}
                onClick={() => handleSort('responsible')}
              >
                Responsible {sortField === 'responsible' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                style={{ padding: '1rem', textAlign: 'left', cursor: 'pointer', width: '20%' }}
                onClick={() => handleSort('observer')}
              >
                Reported By {sortField === 'observer' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                style={{ padding: '1rem', textAlign: 'left', cursor: 'pointer', width: '20%' }}
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
                  {['1', '2', '3'].map(sev => (
                    <option key={sev} value={sev}>
                      {sev === '1' ? '1 - Low' :
                       sev === '2' ? '2 - Medium' :
                       '3 - High'}
                    </option>
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
                <td style={{ padding: '1rem', width: '20%' }}>{issue.title}</td>
                <td style={{ padding: '1rem', width: '20%' }}>{issue.date}</td>
                <td style={{ padding: '1rem', width: '20%' }}>{issue.responsible.join(', ')}</td>
                <td style={{ padding: '1rem', width: '20%' }}>{issue.observer}</td>
                <td style={{ padding: '1rem', width: '20%' }}>
                  {/* Container for severity bar and text */}
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {/* Severity bar */}
                    <div style={{
                      width: '6px',
                      height: '20px', // Adjust height as needed
                      marginRight: '8px',
                      borderRadius: '3px',
                      backgroundColor:
                        issue.severity === '1' ? '#ffb74d' :
                        issue.severity === '2' ? '#f57c00' :
                        issue.severity === '3' ? '#d32f2f' :
                        'transparent', // Default color if severity is not 1, 2, or 3
                    }}></div>
                    {/* Severity text */}
                    <div>
                      {issue.severity === '1' ? '1 - Low' :
                       issue.severity === '2' ? '2 - Medium' :
                       issue.severity === '3' ? '3 - High' :
                       issue.severity ?? ''}
                    </div>
                  </div>
                </td>
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
  const [selectedPeriod, setSelectedPeriod] = useState('all_time');
  const [tooltip, setTooltip] = useState<{ visible: boolean; content: string; x: number; y: number }>({ visible: false, content: '', x: 0, y: 0 });
  const navigate = useNavigate();

  const filterIssuesByPeriod = (issues: Issue[], period: string): Issue[] => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Normalize 'now' to the start of the day

    return issues.filter(issue => {
      const issueDate = new Date(issue.date);
      issueDate.setHours(0, 0, 0, 0); // Normalize issue date to the start of the day

      if (period === 'all_time') {
        return true;
      } else if (period === 'past_30_days') {
        const past30Days = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        return issueDate >= past30Days && issueDate <= now;
      } else if (period === 'past_7_days') {
        const past7Days = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        return issueDate >= past7Days && issueDate <= now;
      }
      return true; // Default to all time if period is unrecognized
    });
  };

  const filteredIssues = filterIssuesByPeriod(issues, selectedPeriod);

  // Calculate statistics based on filtered issues
  const totalIssues = filteredIssues.length;
  
  // Calculate severity percentages for levels 1-3
  const severityCounts = filteredIssues.reduce((acc, issue) => {
    const severity = issue.severity || 'Unspecified';
    acc[severity] = (acc[severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const severityPercentages = ['1', '2', '3'].map(level => ({
    level,
    count: severityCounts[level] || 0,
    percentage: totalIssues > 0 ? Math.round(((severityCounts[level] || 0) / totalIssues) * 100) : 0
  }));

  // Calculate issues by person with severity breakdown
  const issuesByPerson = allPeople.map(person => {
    const personIssues = filteredIssues.filter(issue => issue.responsible.includes(person));
    const total = personIssues.length;
    const severityBreakdown = personIssues.reduce((acc, issue) => {
      const severity = issue.severity || 'Unspecified';
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      name: person,
      total,
      severityBreakdown: Object.entries(severityBreakdown).map(([severity, count]) => ({
        severity,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0
      }))
    };
  }).sort((a, b) => b.total - a.total); // Sort by total issues descending

  // Find the maximum number of issues for scaling based on filtered issues
  const maxIssues = Math.max(...issuesByPerson.map(p => p.total), 1); // Ensure at least 1 for scaling

  // Calculate monthly trends (still based on all issues for the chart)
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

  // Calculate the maximum count for any single severity across all displayed months for scaling
  const maxSeverityCountAcrossAllMonths = sortedMonths.reduce((max, month) => {
    const data = monthlyData[month];
    const maxForMonth = Math.max(...Object.values(data.bySeverity).map(count => count || 0), 0);
    return Math.max(max, maxForMonth);
  }, 0) || 1; // Ensure max is at least 1 to avoid division by zero

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

      {/* Time Period Filter Buttons */}
      <div style={{ gridColumn: '1 / -1', marginBottom: '1rem', paddingLeft: '2rem' }}>
        <button 
          onClick={() => setSelectedPeriod('all_time')}
          style={{
            marginRight: '0.5rem',
            padding: '0.5rem 1rem',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer',
            backgroundColor: selectedPeriod === 'all_time' ? '#eee' : '#fff'
          }}
        >
          All Time
        </button>
        <button 
          onClick={() => setSelectedPeriod('past_30_days')}
          style={{
            marginRight: '0.5rem',
            padding: '0.5rem 1rem',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer',
            backgroundColor: selectedPeriod === 'past_30_days' ? '#eee' : '#fff'
          }}
        >
          Past 30 Days
        </button>
        <button 
          onClick={() => setSelectedPeriod('past_7_days')}
          style={{
            padding: '0.5rem 1rem',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer',
            backgroundColor: selectedPeriod === 'past_7_days' ? '#eee' : '#fff'
          }}
        >
          Past 7 Days
        </button>
      </div>

      <div className="dashboard-grid">
        {/* Summary Statistics */}
        <div className="dashboard-card" style={{ gridColumn: '1 / -1' }}>
          <h3>Summary ({selectedPeriod === 'all_time' ? 'All Time' : selectedPeriod === 'past_30_days' ? 'Past 30 Days' : 'Past 7 Days'})</h3>
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
          <h3>Issues by Family Member ({selectedPeriod === 'all_time' ? 'All Time' : selectedPeriod === 'past_30_days' ? 'Past 30 Days' : 'Past 7 Days'})</h3>
          <div style={{ padding: '1rem' }}>
            {issuesByPerson.map(person => (
              <div key={person.name} style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div 
                    style={{ 
                      width: '120px', 
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      color: '#222',
                      transition: 'color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#a00';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#222';
                    }}
                    onClick={() => navigate(`/issues?filterPerson=${encodeURIComponent(person.name)}`)}
                  >
                    {person.name}
                  </div>
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
              
              {/* Stacked bars and total counts */}
              {sortedMonths.map((month, i) => {
                const data = monthlyData[month];
                let yOffset = 250;
                const barWidth = 80;
                const x = 60 + (i * 120);

                // Calculate total issues for the month
                const totalMonthIssues = Object.values(data.bySeverity).reduce((sum, count) => sum + (count || 0), 0);

                // Render severity segments
                const severitySegments = ['3', '2', '1'].map(severity => {
                    const count = data.bySeverity[severity] || 0;
                    // Scale height based on the maximum severity count across all months
                    const height = (count / maxSeverityCountAcrossAllMonths) * 200; // 200 is the chart height in viewBox
                    const y = yOffset - height;
                    yOffset -= height;

                    // Determine severity label for tooltip
                    const severityLabel = severity === '1' ? 'Low' : severity === '2' ? 'Medium' : 'High';

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
                          onMouseEnter={(e) => {
                            setTooltip({
                              visible: true,
                              content: `${count} ${severityLabel} issues`,
                              x: e.clientX,
                              y: e.clientY,
                            });
                          }}
                          onMouseLeave={() => setTooltip({ visible: false, content: '', x: 0, y: 0 })}
                        />
                      </g>
                    );
                  });

                // Render total count label above the bar
                const totalCountLabel = totalMonthIssues > 0 && (
                  <text
                    key={`${month}-total`}
                    x={x + barWidth / 2}
                    y={250 + 15} // Position below the x-axis with a buffer
                    textAnchor="middle"
                    fill="#222"
                    fontSize="12"
                    fontWeight="bold"
                  >
                    {totalMonthIssues}
                  </text>
                );

                return (
                  <g key={`${month}-bar`}>
                    {severitySegments}
                    {totalCountLabel}
                  </g>
                );
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
      {tooltip.visible && (
        <div
          style={{
            position: 'fixed',
            top: tooltip.y + 10,
            left: tooltip.x + 10,
            background: 'rgba(0, 0, 0, 0.7)',
            color: '#fff',
            padding: '5px 10px',
            borderRadius: '4px',
            fontSize: '0.9em',
            pointerEvents: 'none', // Ensure tooltip doesn't interfere with hover
            zIndex: 1000, // Ensure tooltip is on top
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
}

export default App;
