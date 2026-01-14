import { Octokit } from '@octokit/rest';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class GitHubService {
  constructor() {
    this.useLocalData = process.env.USE_LOCAL_DATA === 'true';
    this.localDataPath = join(__dirname, '../../data');

    if (!this.useLocalData) {
      if (!process.env.GITHUB_TOKEN) {
        throw new Error('GITHUB_TOKEN is required when USE_LOCAL_DATA is false');
      }
      this.octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
      this.owner = process.env.GITHUB_OWNER;
      this.repo = process.env.GITHUB_REPO;
      this.branch = process.env.GITHUB_BRANCH || 'main';
    }

    // Cache for reducing API calls
    this.cache = {
      participants: null,
      applications: null,
      participantsSha: null,
      applicationsSha: null,
      lastFetch: 0
    };
    this.cacheTimeout = 60000; // 1 minute cache
  }

  isCacheValid() {
    return Date.now() - this.cache.lastFetch < this.cacheTimeout;
  }

  // Get file content from GitHub
  async getFile(path) {
    if (this.useLocalData) {
      const localPath = join(this.localDataPath, path);
      if (!existsSync(localPath)) {
        return { content: null, sha: null };
      }
      const content = readFileSync(localPath, 'utf-8');
      return { content: JSON.parse(content), sha: null };
    }

    try {
      const response = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
        ref: this.branch
      });

      const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
      return { content: JSON.parse(content), sha: response.data.sha };
    } catch (error) {
      if (error.status === 404) {
        return { content: null, sha: null };
      }
      throw error;
    }
  }

  // Update file in GitHub
  async updateFile(path, content, message) {
    if (this.useLocalData) {
      const localPath = join(this.localDataPath, path);
      writeFileSync(localPath, JSON.stringify(content, null, 2));
      return true;
    }

    // Get current SHA for update
    const { sha } = await this.getFile(path);

    const params = {
      owner: this.owner,
      repo: this.repo,
      path,
      message,
      content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'),
      branch: this.branch
    };

    if (sha) {
      params.sha = sha;
    }

    await this.octokit.repos.createOrUpdateFileContents(params);

    // Invalidate cache
    this.cache.lastFetch = 0;

    return true;
  }

  // Get all participants
  async getParticipants() {
    if (this.cache.participants && this.isCacheValid()) {
      return this.cache.participants;
    }

    const { content, sha } = await this.getFile('participants.json');

    if (!content) {
      // Initialize empty participants file
      const initial = { participants: [] };
      await this.updateFile('participants.json', initial, 'Initialize participants.json');
      this.cache.participants = [];
      this.cache.participantsSha = null;
      return [];
    }

    this.cache.participants = content.participants || [];
    this.cache.participantsSha = sha;
    this.cache.lastFetch = Date.now();

    return this.cache.participants;
  }

  // Save participants
  async saveParticipants(participants, message = 'Update participants') {
    await this.updateFile('participants.json', { participants }, message);
    this.cache.participants = participants;
  }

  // Get all applications
  async getApplications() {
    if (this.cache.applications && this.isCacheValid()) {
      return this.cache.applications;
    }

    const { content, sha } = await this.getFile('applications.json');

    if (!content) {
      // Initialize empty applications file
      const initial = { applications: [] };
      await this.updateFile('applications.json', initial, 'Initialize applications.json');
      this.cache.applications = [];
      this.cache.applicationsSha = null;
      return [];
    }

    this.cache.applications = content.applications || [];
    this.cache.applicationsSha = sha;
    this.cache.lastFetch = Date.now();

    return this.cache.applications;
  }

  // Save applications
  async saveApplications(applications, message = 'Update applications') {
    await this.updateFile('applications.json', { applications }, message);
    this.cache.applications = applications;
  }

  // Add a new application
  async addApplication(application) {
    const applications = await this.getApplications();
    applications.push(application);
    await this.saveApplications(applications, `New application: ${application.name}`);
    return application;
  }

  // Update application status
  async updateApplicationStatus(id, status) {
    const applications = await this.getApplications();
    const index = applications.findIndex(a => a.id === id);
    if (index === -1) {
      throw new Error('Application not found');
    }
    applications[index].status = status;
    await this.saveApplications(applications, `Update application ${id} status to ${status}`);
    return applications[index];
  }

  // Remove application
  async removeApplication(id) {
    const applications = await this.getApplications();
    const filtered = applications.filter(a => a.id !== id);
    if (filtered.length === applications.length) {
      throw new Error('Application not found');
    }
    await this.saveApplications(filtered, `Remove application ${id}`);
  }

  // Add participant (from approved application)
  async addParticipant(participant) {
    const participants = await this.getParticipants();
    participants.push(participant);
    await this.saveParticipants(participants, `Add participant: ${participant.name}`);
    return participant;
  }

  // Remove participant
  async removeParticipant(slug) {
    const participants = await this.getParticipants();
    const filtered = participants.filter(p => p.slug !== slug);
    if (filtered.length === participants.length) {
      throw new Error('Participant not found');
    }
    await this.saveParticipants(filtered, `Remove participant: ${slug}`);
  }

  // Update participant
  async updateParticipant(slug, updates) {
    const participants = await this.getParticipants();
    const index = participants.findIndex(p => p.slug === slug);
    if (index === -1) {
      throw new Error('Participant not found');
    }
    participants[index] = { ...participants[index], ...updates };
    await this.saveParticipants(participants, `Update participant: ${slug}`);
    return participants[index];
  }

  // Invalidate cache (force refresh on next read)
  invalidateCache() {
    this.cache.lastFetch = 0;
  }
}

// Singleton instance
let instance = null;

export function getGitHubService() {
  if (!instance) {
    instance = new GitHubService();
  }
  return instance;
}

export default GitHubService;
