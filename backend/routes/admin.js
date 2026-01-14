import { Router } from 'express';
import { requireAdmin, authenticateAdmin } from '../middleware/auth.js';
import { getGitHubService } from '../services/github.js';

const router = Router();

// POST /api/admin/login - Authenticate admin
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const token = await authenticateAdmin(username, password);

    if (!token) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/admin/applications - List all applications (protected)
router.get('/applications', requireAdmin, async (req, res) => {
  try {
    const github = getGitHubService();
    const applications = await github.getApplications();

    // Filter by status if provided
    const status = req.query.status;
    const filtered = status
      ? applications.filter(a => a.status === status)
      : applications;

    res.json(filtered);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// POST /api/admin/applications/:id/approve - Approve application
router.post('/applications/:id/approve', requireAdmin, async (req, res) => {
  try {
    const github = getGitHubService();
    const applications = await github.getApplications();
    const application = applications.find(a => a.id === req.params.id);

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ error: 'Application is not pending' });
    }

    // Create participant from application
    const participant = {
      slug: application.slug,
      name: application.name,
      url: application.url,
      description: application.description,
      contactEmail: application.contactEmail,
      approvedAt: new Date().toISOString()
    };

    // Ensure unique slug
    const participants = await github.getParticipants();
    let slug = participant.slug;
    let counter = 1;
    while (participants.some(p => p.slug === slug)) {
      slug = `${participant.slug}-${counter}`;
      counter++;
    }
    participant.slug = slug;

    // Add participant
    await github.addParticipant(participant);

    // Update application status
    await github.updateApplicationStatus(req.params.id, 'approved');

    res.json({
      message: 'Application approved',
      participant
    });
  } catch (error) {
    console.error('Error approving application:', error);
    res.status(500).json({ error: 'Failed to approve application' });
  }
});

// POST /api/admin/applications/:id/reject - Reject application
router.post('/applications/:id/reject', requireAdmin, async (req, res) => {
  try {
    const github = getGitHubService();
    const applications = await github.getApplications();
    const application = applications.find(a => a.id === req.params.id);

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ error: 'Application is not pending' });
    }

    const reason = req.body.reason || '';
    await github.updateApplicationStatus(req.params.id, 'rejected');

    res.json({
      message: 'Application rejected',
      applicationId: req.params.id
    });
  } catch (error) {
    console.error('Error rejecting application:', error);
    res.status(500).json({ error: 'Failed to reject application' });
  }
});

// DELETE /api/admin/applications/:id - Delete application
router.delete('/applications/:id', requireAdmin, async (req, res) => {
  try {
    const github = getGitHubService();
    await github.removeApplication(req.params.id);

    res.json({ message: 'Application deleted' });
  } catch (error) {
    if (error.message === 'Application not found') {
      return res.status(404).json({ error: 'Application not found' });
    }
    console.error('Error deleting application:', error);
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

// GET /api/admin/participants - List all participants (protected)
router.get('/participants', requireAdmin, async (req, res) => {
  try {
    const github = getGitHubService();
    const participants = await github.getParticipants();
    res.json(participants);
  } catch (error) {
    console.error('Error fetching participants:', error);
    res.status(500).json({ error: 'Failed to fetch participants' });
  }
});

// PUT /api/admin/participants/:slug - Update participant
router.put('/participants/:slug', requireAdmin, async (req, res) => {
  try {
    const { name, url, description, contactEmail } = req.body;
    const updates = {};

    if (name) updates.name = name.trim();
    if (url) updates.url = url.trim();
    if (description) updates.description = description.trim();
    if (contactEmail) updates.contactEmail = contactEmail.trim().toLowerCase();

    const github = getGitHubService();
    const participant = await github.updateParticipant(req.params.slug, updates);

    res.json({ message: 'Participant updated', participant });
  } catch (error) {
    if (error.message === 'Participant not found') {
      return res.status(404).json({ error: 'Participant not found' });
    }
    console.error('Error updating participant:', error);
    res.status(500).json({ error: 'Failed to update participant' });
  }
});

// DELETE /api/admin/participants/:slug - Remove participant
router.delete('/participants/:slug', requireAdmin, async (req, res) => {
  try {
    const github = getGitHubService();
    await github.removeParticipant(req.params.slug);

    res.json({ message: 'Participant removed' });
  } catch (error) {
    if (error.message === 'Participant not found') {
      return res.status(404).json({ error: 'Participant not found' });
    }
    console.error('Error removing participant:', error);
    res.status(500).json({ error: 'Failed to remove participant' });
  }
});

// POST /api/admin/cache/invalidate - Force cache refresh
router.post('/cache/invalidate', requireAdmin, async (req, res) => {
  try {
    const github = getGitHubService();
    github.invalidateCache();
    res.json({ message: 'Cache invalidated' });
  } catch (error) {
    console.error('Error invalidating cache:', error);
    res.status(500).json({ error: 'Failed to invalidate cache' });
  }
});

export default router;
