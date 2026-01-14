import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getGitHubService } from '../services/github.js';

const router = Router();

// Validation helpers
function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

// POST /api/applications - Submit new application
router.post('/', async (req, res) => {
  try {
    const { name, url, description, contactEmail } = req.body;

    // Validation
    const errors = [];

    if (!name || name.trim().length < 2) {
      errors.push('Name is required (minimum 2 characters)');
    }

    if (!url || !isValidUrl(url)) {
      errors.push('Valid URL is required (http:// or https://)');
    }

    if (!description || description.trim().length < 10) {
      errors.push('Description is required (minimum 10 characters)');
    }

    if (!contactEmail || !isValidEmail(contactEmail)) {
      errors.push('Valid email address is required');
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    const github = getGitHubService();

    // Check for duplicate URL in participants
    const participants = await github.getParticipants();
    const normalizedUrl = url.toLowerCase().replace(/\/$/, '');
    const existingParticipant = participants.find(
      p => p.url.toLowerCase().replace(/\/$/, '') === normalizedUrl
    );

    if (existingParticipant) {
      return res.status(409).json({ error: 'This site is already a member of the webring' });
    }

    // Check for duplicate URL in pending applications
    const applications = await github.getApplications();
    const pendingApplication = applications.find(
      a => a.url.toLowerCase().replace(/\/$/, '') === normalizedUrl && a.status === 'pending'
    );

    if (pendingApplication) {
      return res.status(409).json({ error: 'An application for this site is already pending' });
    }

    // Create application
    const application = {
      id: uuidv4(),
      name: name.trim(),
      url: url.trim(),
      description: description.trim(),
      contactEmail: contactEmail.trim().toLowerCase(),
      slug: generateSlug(name.trim()),
      submittedAt: new Date().toISOString(),
      status: 'pending'
    };

    await github.addApplication(application);

    res.status(201).json({
      message: 'Application submitted successfully',
      application: {
        id: application.id,
        name: application.name,
        status: application.status
      }
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// GET /api/applications/:id - Check application status (public)
router.get('/:id', async (req, res) => {
  try {
    const github = getGitHubService();
    const applications = await github.getApplications();
    const application = applications.find(a => a.id === req.params.id);

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Return limited info for public access
    res.json({
      id: application.id,
      name: application.name,
      status: application.status,
      submittedAt: application.submittedAt
    });
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

export default router;
