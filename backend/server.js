const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());

// Get all issues
app.get('/api/issues', async (req, res) => {
  try {
    const issues = await prisma.issue.findMany({
      include: {
        responsibleParties: true,
        comments: true
      }
    });
    res.json(issues);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
});

// Create new issue
app.post('/api/issues', async (req, res) => {
  try {
    const { title, description, observedAt, observer, priority, hashtags, rootCause, responsible } = req.body;
    
    const issue = await prisma.issue.create({
      data: {
        title,
        description,
        observedAt: new Date(observedAt),
        observer,
        priority: parseInt(priority),
        hashtags,
        rootCause,
        responsibleParties: {
          create: responsible.map(name => ({ name }))
        }
      },
      include: {
        responsibleParties: true,
        comments: true
      }
    });
    
    res.json(issue);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create issue' });
  }
});

// Update issue
app.put('/api/issues/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, observedAt, observer, priority, hashtags, rootCause, responsible } = req.body;
    
    // First delete existing responsible parties
    await prisma.responsibleParty.deleteMany({
      where: { issueId: parseInt(id) }
    });
    
    const issue = await prisma.issue.update({
      where: { id: parseInt(id) },
      data: {
        title,
        description,
        observedAt: new Date(observedAt),
        observer,
        priority: parseInt(priority),
        hashtags,
        rootCause,
        responsibleParties: {
          create: responsible.map(name => ({ name }))
        }
      },
      include: {
        responsibleParties: true,
        comments: true
      }
    });
    
    res.json(issue);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update issue' });
  }
});

// Delete issue
app.delete('/api/issues/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete related records first
    await prisma.comment.deleteMany({
      where: { issueId: parseInt(id) }
    });
    await prisma.responsibleParty.deleteMany({
      where: { issueId: parseInt(id) }
    });
    
    // Then delete the issue
    await prisma.issue.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ message: 'Issue deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete issue' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 