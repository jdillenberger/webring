import { Router } from 'express';
import { getGitHubService } from '../services/github.js';

const router = Router();

// Helper: Extract and normalize domain from URL
function extractDomain(urlString) {
  try {
    const url = new URL(urlString);
    let hostname = url.hostname.toLowerCase();
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }
    return hostname;
  } catch {
    return null;
  }
}

// Helper: Find participant by slug
function findBySlug(slug, participants) {
  return participants.findIndex(p => p.slug === slug);
}

// Helper: Find participant by Referer header
function findByReferrer(req, participants) {
  const referer = req.get('Referer') || req.get('Referrer');
  if (!referer) return -1;

  const refererDomain = extractDomain(referer);
  if (!refererDomain) return -1;

  return participants.findIndex(p => extractDomain(p.url) === refererDomain);
}

// Helper: Resolve current index (slug first, then referrer)
function resolveCurrentIndex(req, participants) {
  const slug = req.params.slug;
  if (slug) {
    const index = findBySlug(slug, participants);
    if (index !== -1) return index;
  }
  return findByReferrer(req, participants);
}

// GET /api/participants - List all participants
router.get('/', async (req, res) => {
  try {
    const github = getGitHubService();
    const participants = await github.getParticipants();
    res.json(participants);
  } catch (error) {
    console.error('Error fetching participants:', error);
    res.status(500).json({ error: 'Failed to fetch participants' });
  }
});

// GET /api/participants/:slug - Get single participant
router.get('/:slug', async (req, res) => {
  try {
    const github = getGitHubService();
    const participants = await github.getParticipants();
    const participant = participants.find(p => p.slug === req.params.slug);

    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    res.json(participant);
  } catch (error) {
    console.error('Error fetching participant:', error);
    res.status(500).json({ error: 'Failed to fetch participant' });
  }
});

// GET /api/next/:slug? - Navigate to next site
router.get('/next/:slug?', async (req, res) => {
  try {
    const github = getGitHubService();
    const participants = await github.getParticipants();

    if (participants.length === 0) {
      return res.status(404).json({ error: 'No participants in webring' });
    }

    const currentIndex = resolveCurrentIndex(req, participants);

    if (currentIndex === -1) {
      return res.redirect(participants[0].url);
    }

    const nextIndex = (currentIndex + 1) % participants.length;
    res.redirect(participants[nextIndex].url);
  } catch (error) {
    console.error('Error navigating next:', error);
    res.status(500).json({ error: 'Navigation failed' });
  }
});

// GET /api/prev/:slug? - Navigate to previous site
router.get('/prev/:slug?', async (req, res) => {
  try {
    const github = getGitHubService();
    const participants = await github.getParticipants();

    if (participants.length === 0) {
      return res.status(404).json({ error: 'No participants in webring' });
    }

    const currentIndex = resolveCurrentIndex(req, participants);

    if (currentIndex === -1) {
      return res.redirect(participants[participants.length - 1].url);
    }

    const prevIndex = (currentIndex - 1 + participants.length) % participants.length;
    res.redirect(participants[prevIndex].url);
  } catch (error) {
    console.error('Error navigating prev:', error);
    res.status(500).json({ error: 'Navigation failed' });
  }
});

// GET /api/random/:slug? - Navigate to random site
router.get('/random/:slug?', async (req, res) => {
  try {
    const github = getGitHubService();
    const participants = await github.getParticipants();

    if (participants.length === 0) {
      return res.status(404).json({ error: 'No participants in webring' });
    }

    const currentIndex = resolveCurrentIndex(req, participants);

    let available = participants;
    if (currentIndex !== -1 && participants.length > 1) {
      available = participants.filter((_, i) => i !== currentIndex);
    }

    const randomIndex = Math.floor(Math.random() * available.length);
    res.redirect(available[randomIndex].url);
  } catch (error) {
    console.error('Error navigating random:', error);
    res.status(500).json({ error: 'Navigation failed' });
  }
});

// GET /api/navigate/:slug? - Get navigation info as JSON
router.get('/navigate/:slug?', async (req, res) => {
  try {
    const github = getGitHubService();
    const participants = await github.getParticipants();

    if (participants.length === 0) {
      return res.status(404).json({ error: 'No participants in webring' });
    }

    const currentIndex = resolveCurrentIndex(req, participants);

    if (currentIndex === -1) {
      return res.status(404).json({
        error: 'Participant not found',
        message: 'Provide a valid slug or ensure the Referer header matches a participant URL'
      });
    }

    const prevIndex = (currentIndex - 1 + participants.length) % participants.length;
    const nextIndex = (currentIndex + 1) % participants.length;

    const others = participants.filter((_, i) => i !== currentIndex);
    const randomParticipant = others.length > 0
      ? others[Math.floor(Math.random() * others.length)]
      : participants[0];

    res.json({
      current: participants[currentIndex],
      prev: participants[prevIndex],
      next: participants[nextIndex],
      random: randomParticipant
    });
  } catch (error) {
    console.error('Error getting navigation info:', error);
    res.status(500).json({ error: 'Failed to get navigation info' });
  }
});

// GET /api/stats - Get webring statistics
router.get('/stats', async (req, res) => {
  try {
    const github = getGitHubService();
    const participants = await github.getParticipants();

    res.json({
      totalMembers: participants.length,
      newestMember: participants.length > 0 ? participants[participants.length - 1] : null
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
