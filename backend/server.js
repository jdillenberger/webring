import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const DATA_FILE = join(__dirname, '../data/participants.json');

function loadParticipants() {
  const data = readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(data).participants;
}

function findBySlug(slug, participants) {
  return participants.findIndex(p => p.slug === slug);
}

// Extract and normalize domain from URL (strips www. prefix)
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

// Find participant by Referer header (domain-based matching)
function findByReferrer(req, participants) {
  const referer = req.get('Referer') || req.get('Referrer');
  if (!referer) return -1;

  const refererDomain = extractDomain(referer);
  if (!refererDomain) return -1;

  return participants.findIndex(p => extractDomain(p.url) === refererDomain);
}

// Resolve current index: slug first, then referrer fallback
function resolveCurrentIndex(req, participants) {
  const slug = req.params.slug;
  if (slug) {
    const index = findBySlug(slug, participants);
    if (index !== -1) return index;
  }
  return findByReferrer(req, participants);
}

// Get all participants
app.get('/api/participants', (req, res) => {
  const participants = loadParticipants();
  res.json(participants);
});

// Get a single participant by slug
app.get('/api/participants/:slug', (req, res) => {
  const participants = loadParticipants();
  const participant = participants.find(p => p.slug === req.params.slug);
  if (!participant) {
    return res.status(404).json({ error: 'Participant not found' });
  }
  res.json(participant);
});

// Navigate to next site in the ring (slug optional, falls back to referrer)
app.get('/api/next/:slug?', (req, res) => {
  const participants = loadParticipants();
  const currentIndex = resolveCurrentIndex(req, participants);

  if (currentIndex === -1) {
    return res.redirect(participants[0].url);
  }

  const nextIndex = (currentIndex + 1) % participants.length;
  res.redirect(participants[nextIndex].url);
});

// Navigate to previous site in the ring (slug optional, falls back to referrer)
app.get('/api/prev/:slug?', (req, res) => {
  const participants = loadParticipants();
  const currentIndex = resolveCurrentIndex(req, participants);

  if (currentIndex === -1) {
    return res.redirect(participants[participants.length - 1].url);
  }

  const prevIndex = (currentIndex - 1 + participants.length) % participants.length;
  res.redirect(participants[prevIndex].url);
});

// Navigate to random site in the ring (slug optional, falls back to referrer, excludes current)
app.get('/api/random/:slug?', (req, res) => {
  const participants = loadParticipants();
  const currentIndex = resolveCurrentIndex(req, participants);

  let available = participants;
  if (currentIndex !== -1 && participants.length > 1) {
    available = participants.filter((_, i) => i !== currentIndex);
  }

  const randomIndex = Math.floor(Math.random() * available.length);
  res.redirect(available[randomIndex].url);
});

// Get navigation info as JSON (slug optional, falls back to referrer)
app.get('/api/navigate/:slug?', (req, res) => {
  const participants = loadParticipants();
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
});

// Get webring stats
app.get('/api/stats', (req, res) => {
  const participants = loadParticipants();
  res.json({
    totalMembers: participants.length,
    newestMember: participants[participants.length - 1]
  });
});

app.listen(PORT, () => {
  console.log(`Webring API running on http://localhost:${PORT}`);
});
