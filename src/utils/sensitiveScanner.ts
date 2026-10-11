import { CommitFilePayload } from '../services/github';

export interface SensitiveScanFinding {
  path: string;
  fileName: string;
  ruleName: string;
  reason: string;
  riskLevel: 'critical' | 'high';
  matchSnippet?: string;
}

interface FileNameRule {
  pattern: RegExp;
  ruleName: string;
  reason: string;
  riskLevel: 'critical' | 'high';
}

interface ContentRule {
  pattern: RegExp;
  ruleName: string;
  reason: string;
  riskLevel: 'critical' | 'high';
}

const FILE_NAME_RULES: FileNameRule[] = [
  {
    pattern: /(^|\/)\.env(\..+)?$/i,
    ruleName: 'Environment Configuration File',
    reason: '.env files usually store database credentials, API tokens, and secret application keys.',
    riskLevel: 'high',
  },
  {
    pattern: /(^|\/)(id_rsa|id_ed25519|id_ecdsa|id_dsa)(\.pub)?$/i,
    ruleName: 'SSH Key File',
    reason: 'Contains SSH identity keys that grant server access.',
    riskLevel: 'critical',
  },
  {
    pattern: /\.(pem|key|pkcs12|pfx|p12|keystore|jks)$/i,
    ruleName: 'Private Key / Certificate Store',
    reason: 'Private encryption keys or keystores must not be stored in public version control.',
    riskLevel: 'critical',
  },
  {
    pattern: /(^|\/)(service-?account.*\.json|credentials\.json|client_secret.*\.json|google-services\.json)$/i,
    ruleName: 'Cloud / Service Account Key',
    reason: 'Contains service account credentials for Google Cloud, AWS, or OAuth providers.',
    riskLevel: 'critical',
  },
  {
    pattern: /(^|\/)(secrets|token|auth)\.json$/i,
    ruleName: 'Secret Token Configuration',
    reason: 'Contains authentication tokens or secrets configuration.',
    riskLevel: 'high',
  },
];

const CONTENT_RULES: ContentRule[] = [
  {
    pattern: /-----BEGIN (?:[A-Z0-9_-]+ )?PRIVATE KEY-----/,
    ruleName: 'Embedded Private Key',
    reason: 'Found PEM/OpenSSH private key block in file content.',
    riskLevel: 'critical',
  },
  {
    pattern: /(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{30,}|github_pat_[A-Za-z0-9_]{40,}/,
    ruleName: 'GitHub Personal Access Token',
    reason: 'Active GitHub access token detected in plaintext.',
    riskLevel: 'critical',
  },
  {
    pattern: /sk-(?:proj-|ant-)?[A-Za-z0-9_-]{20,}/,
    ruleName: 'AI Provider Secret Key',
    reason: 'OpenAI / Anthropic API secret key detected in source code.',
    riskLevel: 'critical',
  },
  {
    pattern: /AIzaSy[A-Za-z0-9_-]{33}/,
    ruleName: 'Google API Key',
    reason: 'Google / Firebase API key detected in plaintext.',
    riskLevel: 'high',
  },
  {
    pattern: /(?:AKIA|ASIA)[0-9A-Z]{16}/,
    ruleName: 'AWS Access Key ID',
    reason: 'Amazon Web Services IAM access key detected.',
    riskLevel: 'high',
  },
  {
    pattern: /(?:postgres(?:ql)?|mongodb(?:\+srv)?|mysql):\/\/[^:\s]{2,}:[^@\s]{3,}@[^\s]+/i,
    ruleName: 'Database URI with Password',
    reason: 'Plaintext database connection string with embedded password.',
    riskLevel: 'critical',
  },
  {
    pattern: /(?:api_key|secret_key|private_key|auth_token|db_password)\s*[:=]\s*["'][A-Za-z0-9_\-\.]{16,}["']/i,
    ruleName: 'Hardcoded Secret Variable',
    reason: 'Suspicious hardcoded credential assignment detected.',
    riskLevel: 'high',
  },
];

function redactSnippet(text: string): string {
  if (text.length <= 8) return '****';
  return `${text.slice(0, 4)}...${text.slice(-4)}`;
}

/**
 * Scans an array of files before commit and push.
 * Returns a list of findings if any sensitive patterns match.
 */
export function scanFilesForSecrets(files: CommitFilePayload[]): SensitiveScanFinding[] {
  const findings: SensitiveScanFinding[] = [];
  const scannedPaths = new Set<string>();

  for (const file of files) {
    if (!file.path) continue;
    const fileName = file.path.split('/').pop() || file.path;

    // 1. File Name Checks
    for (const rule of FILE_NAME_RULES) {
      if (rule.pattern.test(file.path) || rule.pattern.test(fileName)) {
        findings.push({
          path: file.path,
          fileName,
          ruleName: rule.ruleName,
          reason: rule.reason,
          riskLevel: rule.riskLevel,
          matchSnippet: fileName,
        });
        scannedPaths.add(file.path);
        break; // Match one filename rule per file
      }
    }

    // 2. Content Checks (skip if binary or base64 encoded)
    if (file.encoding === 'base64' || !file.content) {
      continue;
    }

    const content = file.content;
    // Don't scan huge generated bundles (> 2MB)
    if (content.length > 2 * 1024 * 1024) {
      continue;
    }

    for (const rule of CONTENT_RULES) {
      const match = rule.pattern.exec(content);
      if (match) {
        // Redact match for safe display
        const matchedText = match[0];
        const snippet = redactSnippet(matchedText);

        findings.push({
          path: file.path,
          fileName,
          ruleName: rule.ruleName,
          reason: rule.reason,
          riskLevel: rule.riskLevel,
          matchSnippet: snippet,
        });
        break; // One content finding per file is enough to flag it
      }
    }
  }

  return findings;
}
