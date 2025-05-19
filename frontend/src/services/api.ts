const API_BASE_URL = 'http://localhost:3005/api';

export interface Issue {
  id: number;
  title: string;
  description: string;
  observedAt: string;
  observer: string;
  priority: number;
  hashtags: string;
  rootCause?: string;
  responsibleParties: { name: string }[];
  comments: Comment[];
}

export interface Comment {
  id: number;
  content: string;
  author: string;
  createdAt: string;
  updatedAt: string;
}

export const api = {
  // Get all issues
  getIssues: async (): Promise<Issue[]> => {
    const response = await fetch(`${API_BASE_URL}/issues`);
    if (!response.ok) {
      throw new Error('Failed to fetch issues');
    }
    return response.json();
  },

  // Create new issue
  createIssue: async (issue: Omit<Issue, 'id'>): Promise<Issue> => {
    const response = await fetch(`${API_BASE_URL}/issues`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...issue,
        responsible: issue.responsibleParties.map(p => p.name)
      }),
    });
    if (!response.ok) {
      throw new Error('Failed to create issue');
    }
    return response.json();
  },

  // Update issue
  updateIssue: async (issue: Issue): Promise<Issue> => {
    const response = await fetch(`${API_BASE_URL}/issues/${issue.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...issue,
        responsible: issue.responsibleParties.map(p => p.name)
      }),
    });
    if (!response.ok) {
      throw new Error('Failed to update issue');
    }
    return response.json();
  },

  // Delete issue
  deleteIssue: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/issues/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete issue');
    }
  },
}; 